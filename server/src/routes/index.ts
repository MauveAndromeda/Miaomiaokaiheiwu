/**
 * API 路由汇总
 */

import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import coachRoutes from './coach';
import orderRoutes from './order';
import paymentRoutes from './payment';
import uploadRoutes from './upload';

const router = Router();

// 认证相关
router.use('/auth', authRoutes);

// 用户相关
router.use('/user', userRoutes);

// 教练相关
router.use('/coaches', coachRoutes);

// 订单相关
router.use('/orders', orderRoutes);

// 支付相关
router.use('/payment', paymentRoutes);

// 文件上传
router.use('/upload', uploadRoutes);

export default router;
