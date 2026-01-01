/**
 * 订单相关路由
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { OrderController } from '../controllers/order';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
const orderController = new OrderController();

/**
 * @route   POST /api/v1/orders
 * @desc    创建订单
 * @access  Private
 */
router.post(
  '/',
  auth,
  [
    body('coachId').isUUID().withMessage('教练ID无效'),
    body('gameId').isUUID().withMessage('游戏ID无效'),
    body('serviceType').isIn(['play', 'voice', 'video']).withMessage('服务类型无效'),
    body('quantity').isInt({ min: 1, max: 99 }).withMessage('数量必须在1-99之间'),
    body('remark').optional().isLength({ max: 200 }),
  ],
  validate,
  orderController.create
);

/**
 * @route   GET /api/v1/orders
 * @desc    获取订单列表
 * @access  Private
 */
router.get(
  '/',
  auth,
  [
    query('status').optional().isIn([
      'all', 'pending_payment', 'pending_accept', 'accepted',
      'in_progress', 'completed', 'cancelled', 'refunded'
    ]),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  orderController.getList
);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    获取订单详情
 * @access  Private
 */
router.get(
  '/:id',
  auth,
  [param('id').isUUID()],
  validate,
  orderController.getDetail
);

/**
 * @route   POST /api/v1/orders/:id/cancel
 * @desc    取消订单
 * @access  Private
 */
router.post(
  '/:id/cancel',
  auth,
  [
    param('id').isUUID(),
    body('reason').optional().isLength({ max: 200 }),
  ],
  validate,
  orderController.cancel
);

/**
 * @route   POST /api/v1/orders/:id/accept
 * @desc    接受订单（教练）
 * @access  Private (Coach)
 */
router.post(
  '/:id/accept',
  auth,
  [param('id').isUUID()],
  validate,
  orderController.accept
);

/**
 * @route   POST /api/v1/orders/:id/complete
 * @desc    完成订单
 * @access  Private
 */
router.post(
  '/:id/complete',
  auth,
  [param('id').isUUID()],
  validate,
  orderController.complete
);

/**
 * @route   POST /api/v1/orders/:id/review
 * @desc    评价订单
 * @access  Private
 */
router.post(
  '/:id/review',
  auth,
  [
    param('id').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('评分必须在1-5之间'),
    body('content').optional().isLength({ max: 500 }),
    body('tags').optional().isArray(),
    body('isAnonymous').optional().isBoolean(),
  ],
  validate,
  orderController.review
);

export default router;
