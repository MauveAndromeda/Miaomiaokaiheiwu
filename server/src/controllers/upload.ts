/**
 * 上传控制器
 * 安全加固版本 - MIME类型验证 + 扩展名白名单 + 文件头检测
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { OssService } from '../services/oss';
import { ApiError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// 文件类型白名单配置
const FILE_TYPE_CONFIG = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    // 文件头magic bytes
    magicBytes: {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/gif': [0x47, 0x49, 0x46],
      'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  audio: {
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4'],
    extensions: ['mp3', 'wav', 'ogg', 'aac', 'm4a'],
    magicBytes: {
      'audio/mpeg': [0xFF, 0xFB], // or [0x49, 0x44, 0x33] for ID3
      'audio/wav': [0x52, 0x49, 0x46, 0x46], // RIFF
      'audio/ogg': [0x4F, 0x67, 0x67, 0x53], // OggS
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
    extensions: ['mp4', 'webm', 'mov', 'avi'],
    magicBytes: {
      'video/mp4': [0x00, 0x00, 0x00], // ftyp at offset 4
      'video/webm': [0x1A, 0x45, 0xDF, 0xA3], // EBML
    },
    maxSize: 200 * 1024 * 1024, // 200MB
  },
};

type FileType = keyof typeof FILE_TYPE_CONFIG;

export class UploadController {
  private ossService = new OssService();

  /**
   * 验证文件类型安全性
   */
  private validateFile(
    file: Express.Multer.File,
    fileType: FileType
  ): { valid: boolean; extension: string; error?: string } {
    const config = FILE_TYPE_CONFIG[fileType];

    // 1. 验证文件大小
    if (file.size > config.maxSize) {
      return {
        valid: false,
        extension: '',
        error: `文件大小超过限制 (最大 ${config.maxSize / 1024 / 1024}MB)`,
      };
    }

    // 2. 验证MIME类型
    if (!config.mimeTypes.includes(file.mimetype)) {
      logger.warn(`文件MIME类型不允许: ${file.mimetype}, 文件名: ${file.originalname}`);
      return {
        valid: false,
        extension: '',
        error: `不支持的文件类型: ${file.mimetype}`,
      };
    }

    // 3. 验证扩展名（从原始文件名提取并转小写）
    const originalExt = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (!config.extensions.includes(originalExt)) {
      logger.warn(`文件扩展名不允许: ${originalExt}, 文件名: ${file.originalname}`);
      return {
        valid: false,
        extension: '',
        error: `不支持的文件扩展名: ${originalExt}`,
      };
    }

    // 4. 验证文件头magic bytes（防止伪造扩展名）
    const magicBytesMap = config.magicBytes as Record<string, number[]>;
    const expectedMagic = magicBytesMap[file.mimetype];
    if (expectedMagic && file.buffer.length >= expectedMagic.length) {
      const fileMagic = Array.from(file.buffer.subarray(0, expectedMagic.length));
      const magicMatch = expectedMagic.every((byte, index) => fileMagic[index] === byte);

      if (!magicMatch) {
        // 对于某些格式，magic bytes可能在不同位置，进行额外检查
        if (file.mimetype === 'audio/mpeg') {
          // MP3可能以ID3标签开头
          const id3Magic = [0x49, 0x44, 0x33]; // "ID3"
          const id3Match = id3Magic.every((byte, index) => file.buffer[index] === byte);
          if (!id3Match) {
            logger.warn(`文件头验证失败: ${file.originalname}, MIME: ${file.mimetype}`);
            return {
              valid: false,
              extension: '',
              error: '文件内容与声明的类型不匹配',
            };
          }
        } else if (file.mimetype !== 'video/mp4') {
          // MP4的magic bytes检测比较复杂，跳过
          logger.warn(`文件头验证失败: ${file.originalname}, MIME: ${file.mimetype}`);
          return {
            valid: false,
            extension: '',
            error: '文件内容与声明的类型不匹配',
          };
        }
      }
    }

    // 5. 基于MIME类型确定安全的扩展名（不使用原始扩展名）
    const safeExtension = this.getSafeExtension(file.mimetype, fileType);

    return { valid: true, extension: safeExtension };
  }

  /**
   * 根据MIME类型获取安全的扩展名
   */
  private getSafeExtension(mimeType: string, fileType: FileType): string {
    const mimeToExt: Record<string, string> = {
      // 图片
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      // 音频
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'audio/aac': 'aac',
      'audio/mp4': 'm4a',
      // 视频
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
    };

    return mimeToExt[mimeType] || FILE_TYPE_CONFIG[fileType].extensions[0];
  }

  /**
   * 上传单张图片
   */
  uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ApiError(400, '请选择图片');
      }

      const validation = this.validateFile(req.file, 'image');
      if (!validation.valid) {
        throw new ApiError(400, validation.error || '文件验证失败');
      }

      // 使用UUID生成安全的文件名，扩展名基于验证后的MIME类型
      const filename = `images/${uuidv4()}.${validation.extension}`;

      const url = await this.ossService.upload(
        filename,
        req.file.buffer,
        req.file.mimetype
      );

      logger.info(`图片上传成功: ${filename}, 用户: ${req.userId}`);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 批量上传图片
   */
  uploadImages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        throw new ApiError(400, '请选择图片');
      }

      // 限制批量上传数量
      if (files.length > 9) {
        throw new ApiError(400, '单次最多上传9张图片');
      }

      const urls = await Promise.all(
        files.map(async (file) => {
          const validation = this.validateFile(file, 'image');
          if (!validation.valid) {
            throw new ApiError(400, `文件 ${file.originalname}: ${validation.error}`);
          }

          const filename = `images/${uuidv4()}.${validation.extension}`;
          return this.ossService.upload(filename, file.buffer, file.mimetype);
        })
      );

      logger.info(`批量图片上传成功: ${files.length}张, 用户: ${req.userId}`);

      res.json({
        success: true,
        data: { urls },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 上传音频
   */
  uploadAudio = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ApiError(400, '请选择音频文件');
      }

      const validation = this.validateFile(req.file, 'audio');
      if (!validation.valid) {
        throw new ApiError(400, validation.error || '文件验证失败');
      }

      const filename = `audio/${uuidv4()}.${validation.extension}`;

      const url = await this.ossService.upload(
        filename,
        req.file.buffer,
        req.file.mimetype
      );

      logger.info(`音频上传成功: ${filename}, 用户: ${req.userId}`);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 上传视频
   */
  uploadVideo = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ApiError(400, '请选择视频文件');
      }

      const validation = this.validateFile(req.file, 'video');
      if (!validation.valid) {
        throw new ApiError(400, validation.error || '文件验证失败');
      }

      const filename = `videos/${uuidv4()}.${validation.extension}`;

      const url = await this.ossService.upload(
        filename,
        req.file.buffer,
        req.file.mimetype
      );

      logger.info(`视频上传成功: ${filename}, 用户: ${req.userId}`);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  };
}
