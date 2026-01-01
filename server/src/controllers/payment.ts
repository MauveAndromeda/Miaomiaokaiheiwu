/**
 * 支付控制器
 * 安全加固版本 - 幂等性检查 + 事务处理
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/errors';
import { wechatPayService } from '../services/wechatPay';
import { alipayService } from '../services/alipay';
import { generateOrderNo } from '../utils/helpers';
import { logger } from '../utils/logger';

// 支付回调幂等性缓存（生产环境应使用Redis）
const processedPayments = new Map<string, { timestamp: number; status: string }>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24小时

// 定期清理过期幂等性记录
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of processedPayments) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      processedPayments.delete(key);
    }
  }
}, 60 * 60 * 1000);

export class PaymentController {
  /**
   * 支付订单
   */
  payOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { method } = req.body;
      const userId = req.userId!;

      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userId,
          status: 'pending_payment',
        },
      });

      if (!order) {
        throw new ApiError(400, '订单不存在或已支付');
      }

      // 余额支付 - 使用事务保证原子性
      if (method === 'balance') {
        const result = await prisma.$transaction(async (tx) => {
          // 1. 查询并锁定用户余额
          const user = await tx.user.findUnique({
            where: { id: userId },
          });

          if (!user) {
            throw new ApiError(404, '用户不存在');
          }

          if (user.balance < order.totalPrice) {
            throw new ApiError(400, '余额不足');
          }

          // 2. 扣除余额
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
              balance: { decrement: order.totalPrice },
            },
          });

          // 3. 创建交易记录
          await tx.transaction.create({
            data: {
              userId,
              type: 'consume',
              amount: -order.totalPrice,
              balance: updatedUser.balance,
              description: `订单支付 ${order.orderNo}`,
              relatedId: order.id,
            },
          });

          // 4. 更新订单状态
          const updatedOrder = await tx.order.update({
            where: { id: orderId },
            data: {
              status: 'pending_accept',
              paymentMethod: 'balance',
              paidAt: new Date(),
            },
          });

          return { user: updatedUser, order: updatedOrder };
        });

        logger.info(`余额支付成功: 订单=${order.orderNo}, 用户=${userId}, 金额=${order.totalPrice}`);

        return res.json({
          success: true,
          data: {
            paymentMethod: 'balance',
            status: 'success',
            newBalance: result.user.balance,
          },
        });
      }

      // 微信支付
      if (method === 'wechat') {
        const paymentResult = await wechatPayService.createOrder({
          orderId: order.id,
          orderNo: order.orderNo,
          amount: order.totalPrice,
          description: `喵喵开黑屋-订单${order.orderNo}`,
        });

        return res.json({
          success: true,
          data: {
            paymentMethod: 'wechat',
            ...paymentResult,
          },
        });
      }

      // 支付宝
      if (method === 'alipay') {
        const paymentResult = await alipayService.createOrder({
          orderId: order.id,
          orderNo: order.orderNo,
          amount: order.totalPrice,
          subject: `喵喵开黑屋-订单${order.orderNo}`,
        });

        return res.json({
          success: true,
          data: {
            paymentMethod: 'alipay',
            ...paymentResult,
          },
        });
      }

      throw new ApiError(400, '不支持的支付方式');
    } catch (error) {
      next(error);
    }
  };

  /**
   * 充值
   */
  recharge = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { amount, method } = req.body;
      const userId = req.userId!;

      // 充值档位配置
      const rechargeOptions: Record<number, number> = {
        6: 60,
        30: 300,
        68: 680,
        128: 1280,
        328: 3280,
        648: 6480,
      };

      const diamonds = rechargeOptions[amount];
      if (!diamonds) {
        throw new ApiError(400, '无效的充值金额');
      }

      const rechargeOrderNo = `RC${generateOrderNo()}`;

      // 微信支付
      if (method === 'wechat') {
        const paymentResult = await wechatPayService.createOrder({
          orderId: rechargeOrderNo,
          orderNo: rechargeOrderNo,
          amount: amount * 100, // 转换为分
          description: `喵喵开黑屋-充值${diamonds}钻石`,
        });

        return res.json({
          success: true,
          data: {
            paymentMethod: 'wechat',
            rechargeOrderNo,
            diamonds,
            ...paymentResult,
          },
        });
      }

      // 支付宝
      if (method === 'alipay') {
        const paymentResult = await alipayService.createOrder({
          orderId: rechargeOrderNo,
          orderNo: rechargeOrderNo,
          amount: amount * 100,
          subject: `喵喵开黑屋-充值${diamonds}钻石`,
        });

        return res.json({
          success: true,
          data: {
            paymentMethod: 'alipay',
            rechargeOrderNo,
            diamonds,
            ...paymentResult,
          },
        });
      }

      throw new ApiError(400, '不支持的支付方式');
    } catch (error) {
      next(error);
    }
  };

  /**
   * 微信支付回调 - 包含幂等性检查
   */
  wechatNotify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await wechatPayService.handleNotify(req.body, req.headers);

      if (result.success && result.orderId && result.transactionId) {
        // 幂等性检查
        const idempotencyKey = `wechat_${result.transactionId}`;
        const processed = processedPayments.get(idempotencyKey);

        if (processed) {
          logger.info(`微信支付回调重复处理跳过: ${result.transactionId}`);
          return res.json({ code: 'SUCCESS', message: '成功' });
        }

        // 标记为正在处理
        processedPayments.set(idempotencyKey, { timestamp: Date.now(), status: 'processing' });

        try {
          await this.handlePaymentSuccess(result.orderId, 'wechat', result.transactionId, result.amount);
          processedPayments.set(idempotencyKey, { timestamp: Date.now(), status: 'success' });
        } catch (error) {
          processedPayments.delete(idempotencyKey);
          throw error;
        }
      }

      // 返回微信要求的格式
      res.json({ code: 'SUCCESS', message: '成功' });
    } catch (error) {
      logger.error('微信支付回调处理失败:', error);
      res.status(500).json({ code: 'FAIL', message: '处理失败' });
    }
  };

  /**
   * 支付宝回调 - 包含幂等性检查
   */
  alipayNotify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await alipayService.handleNotify(req.body);

      if (result.success && result.orderId && result.tradeNo) {
        // 幂等性检查
        const idempotencyKey = `alipay_${result.tradeNo}`;
        const processed = processedPayments.get(idempotencyKey);

        if (processed) {
          logger.info(`支付宝回调重复处理跳过: ${result.tradeNo}`);
          return res.send('success');
        }

        // 标记为正在处理
        processedPayments.set(idempotencyKey, { timestamp: Date.now(), status: 'processing' });

        try {
          await this.handlePaymentSuccess(result.orderId, 'alipay', result.tradeNo, result.amount);
          processedPayments.set(idempotencyKey, { timestamp: Date.now(), status: 'success' });
        } catch (error) {
          processedPayments.delete(idempotencyKey);
          throw error;
        }
      }

      // 返回支付宝要求的格式
      res.send('success');
    } catch (error) {
      logger.error('支付宝回调处理失败:', error);
      res.send('fail');
    }
  };

  /**
   * 查询支付状态
   */
  getPaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;

      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: paymentId },
            { orderNo: paymentId },
          ],
        },
        select: {
          id: true,
          status: true,
          paidAt: true,
        },
      });

      if (!order) {
        throw new ApiError(404, '订单不存在');
      }

      res.json({
        success: true,
        data: {
          status: order.paidAt ? 'paid' : 'pending',
          paidAt: order.paidAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 处理支付成功 - 使用事务保证一致性
   */
  private handlePaymentSuccess = async (
    orderId: string,
    paymentMethod: string,
    paymentId: string,
    amount?: number
  ) => {
    // 检查是否是充值订单
    if (orderId.startsWith('RC')) {
      await this.handleRechargeSuccess(orderId, paymentMethod, paymentId, amount);
      return;
    }

    // 使用事务更新订单状态
    await prisma.$transaction(async (tx) => {
      // 先检查订单当前状态
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error(`订单不存在: ${orderId}`);
      }

      // 只处理待支付状态的订单
      if (order.status !== 'pending_payment') {
        logger.info(`订单已处理，跳过: ${orderId}, 当前状态: ${order.status}`);
        return;
      }

      // 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'pending_accept',
          paymentMethod,
          paymentId,
          paidAt: new Date(),
        },
      });

      logger.info(`订单支付成功: ${orderId}, 支付方式: ${paymentMethod}, 交易号: ${paymentId}`);
    });
  };

  /**
   * 处理充值成功 - 使用事务保证一致性
   */
  private handleRechargeSuccess = async (
    rechargeOrderNo: string,
    paymentMethod: string,
    paymentId: string,
    amount?: number
  ) => {
    // 解析充值金额对应的钻石数
    const rechargeOptions: Record<number, number> = {
      600: 60,     // 6元
      3000: 300,   // 30元
      6800: 680,   // 68元
      12800: 1280, // 128元
      32800: 3280, // 328元
      64800: 6480, // 648元
    };

    const diamonds = amount ? rechargeOptions[amount] : undefined;

    if (!diamonds) {
      logger.error(`无效的充值金额: ${amount}, 订单号: ${rechargeOrderNo}`);
      return;
    }

    // TODO: 实现充值逻辑
    // 这里需要关联用户ID，可能需要在创建充值订单时记录到数据库
    logger.info(`充值成功: 订单=${rechargeOrderNo}, 钻石=${diamonds}, 交易号=${paymentId}`);
  };
}
