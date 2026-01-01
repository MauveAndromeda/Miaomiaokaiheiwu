/**
 * 认证相关路由
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth';
import { validate } from '../middleware/validate';
import { smsLimiter } from '../middleware/rateLimit';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/send-code
 * @desc    发送短信验证码
 * @access  Public
 */
router.post(
  '/send-code',
  smsLimiter,
  [
    body('phone')
      .isMobilePhone('zh-CN')
      .withMessage('请输入正确的手机号'),
  ],
  validate,
  authController.sendCode
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    验证码登录
 * @access  Public
 */
router.post(
  '/login',
  [
    body('phone')
      .isMobilePhone('zh-CN')
      .withMessage('请输入正确的手机号'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('验证码为6位数字'),
  ],
  validate,
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    刷新Token
 * @access  Private
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    退出登录
 * @access  Private
 */
router.post('/logout', authController.logout);

export default router;
