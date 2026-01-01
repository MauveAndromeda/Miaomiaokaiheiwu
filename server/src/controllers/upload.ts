/**
 * 上传控制器
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { OssService } from '../services/oss';
import { ApiError } from '../utils/errors';
import { v4 as uuidv4 } from 'uuid';

export class UploadController {
  private ossService = new OssService();

  /**
   * 上传单张图片
   */
  uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new ApiError(400, '请选择图片');
      }

      const ext = req.file.originalname.split('.').pop();
      const filename = `images/${uuidv4()}.${ext}`;

      const url = await this.ossService.upload(
        filename,
        req.file.buffer,
        req.file.mimetype
      );

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

      const urls = await Promise.all(
        files.map(async (file) => {
          const ext = file.originalname.split('.').pop();
          const filename = `images/${uuidv4()}.${ext}`;
          return this.ossService.upload(filename, file.buffer, file.mimetype);
        })
      );

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

      const ext = req.file.originalname.split('.').pop();
      const filename = `audio/${uuidv4()}.${ext}`;

      const url = await this.ossService.upload(
        filename,
        req.file.buffer,
        req.file.mimetype
      );

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

      const ext = req.file.originalname.split('.').pop();
      const filename = `videos/${uuidv4()}.${ext}`;

      const url = await this.ossService.upload(
        filename,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  };
}
