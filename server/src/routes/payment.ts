/**
 * 支付相关路由
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { PaymentController } from '../controllers/payment';
import { auth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route   POST /api/v1/payment/order/:orderId
 * @desc    支付订单
 * @access  Private
 */
router.post(
  '/order/:orderId',
  auth,
  [
    param('orderId').isUUID(),
    body('method').isIn(['balance', 'wechat', 'alipay']).withMessage('支付方式无效'),
  ],
  validate,
  paymentController.payOrder
);

/**
 * @route   POST /api/v1/payment/recharge
 * @desc    充值
 * @access  Private
 */
router.post(
  '/recharge',
  auth,
  [
    body('amount').isInt({ min: 1, max: 100000 }).withMessage('充值金额无效'),
    body('method').isIn(['wechat', 'alipay']).withMessage('支付方式无效'),
  ],
  validate,
  paymentController.recharge
);

/**
 * @route   POST /api/v1/payment/wechat/notify
 * @desc    微信支付回调
 * @access  Public (WeChat Server)
 */
router.post('/wechat/notify', paymentController.wechatNotify);

/**
 * @route   POST /api/v1/payment/alipay/notify
 * @desc    支付宝回调
 * @access  Public (Alipay Server)
 */
router.post('/alipay/notify', paymentController.alipayNotify);

/**
 * @route   GET /api/v1/payment/status/:paymentId
 * @desc    查询支付状态
 * @access  Private
 */
router.get(
  '/status/:paymentId',
  auth,
  [param('paymentId').notEmpty()],
  validate,
  paymentController.getPaymentStatus
);

export default router;
