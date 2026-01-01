/**
 * 文件上传路由
 */

import { Router } from 'express';
import multer from 'multer';
import { UploadController } from '../controllers/upload';
import { auth } from '../middleware/auth';

const router = Router();
const uploadController = new UploadController();

// 配置multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'video/mp4',
      'video/quicktime',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  },
});

/**
 * @route   POST /api/v1/upload/image
 * @desc    上传图片
 * @access  Private
 */
router.post(
  '/image',
  auth,
  upload.single('file'),
  uploadController.uploadImage
);

/**
 * @route   POST /api/v1/upload/images
 * @desc    批量上传图片
 * @access  Private
 */
router.post(
  '/images',
  auth,
  upload.array('files', 9),
  uploadController.uploadImages
);

/**
 * @route   POST /api/v1/upload/audio
 * @desc    上传音频
 * @access  Private
 */
router.post(
  '/audio',
  auth,
  upload.single('file'),
  uploadController.uploadAudio
);

/**
 * @route   POST /api/v1/upload/video
 * @desc    上传视频
 * @access  Private
 */
router.post(
  '/video',
  auth,
  upload.single('file'),
  uploadController.uploadVideo
);

export default router;
