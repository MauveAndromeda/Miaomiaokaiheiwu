/**
 * 用户相关路由
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { UserController } from '../controllers/user';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
const userController = new UserController();

/**
 * @route   GET /api/v1/user/profile
 * @desc    获取当前用户资料
 * @access  Private
 */
router.get('/profile', auth, userController.getProfile);

/**
 * @route   PUT /api/v1/user/profile
 * @desc    更新用户资料
 * @access  Private
 */
router.put(
  '/profile',
  auth,
  [
    body('nickname').optional().isLength({ min: 2, max: 20 }),
    body('avatar').optional().isURL(),
    body('gender').optional().isIn(['male', 'female', 'unknown']),
    body('bio').optional().isLength({ max: 200 }),
  ],
  validate,
  userController.updateProfile
);

/**
 * @route   GET /api/v1/user/wallet
 * @desc    获取钱包信息
 * @access  Private
 */
router.get('/wallet', auth, userController.getWallet);

/**
 * @route   GET /api/v1/user/transactions
 * @desc    获取交易记录
 * @access  Private
 */
router.get('/transactions', auth, userController.getTransactions);

/**
 * @route   GET /api/v1/user/favorites
 * @desc    获取收藏列表
 * @access  Private
 */
router.get('/favorites', auth, userController.getFavorites);

/**
 * @route   POST /api/v1/user/favorites/:coachId
 * @desc    添加收藏
 * @access  Private
 */
router.post('/favorites/:coachId', auth, userController.addFavorite);

/**
 * @route   DELETE /api/v1/user/favorites/:coachId
 * @desc    取消收藏
 * @access  Private
 */
router.delete('/favorites/:coachId', auth, userController.removeFavorite);

export default router;
