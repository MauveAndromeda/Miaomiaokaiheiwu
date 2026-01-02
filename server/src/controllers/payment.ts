/**
 * 支付控制器
 * 安全加固版本 - 数据库幂等性 + 事务处理 + 完整充值逻辑
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/errors';
import { wechatPayService } from '../services/wechatPay';
import { alipayService } from '../services/alipay';
import { generateOrderNo } from '../utils/helpers';
import { logger } from '../utils/logger';

// 充值档位配置
const RECHARGE_OPTIONS: Record<number, { diamonds: number; bonus: number }> = {
  6: { diamonds: 60, bonus: 0 },
  30: { diamonds: 300, bonus: 30 },
  68: { diamonds: 680, bonus: 100 },
  128: { diamonds: 1280, bonus: 200 },
  328: { diamonds: 3280, bonus: 600 },
  648: { diamonds: 6480, bonus: 1500 },
};

export class PaymentController {
  /**
   * 支付订单
   */
  payOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { method } = req.body;
      const userId = req.userId!;

      // 输入验证
      if (!['balance', 'wechat', 'alipay'].includes(method)) {
        throw new ApiError(400, '不支持的支付方式');
      }

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

      // 金额验证
      if (order.totalPrice <= 0 || order.totalPrice > 100000) {
        throw new ApiError(400, '订单金额异常');
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
        }, {
          timeout: 10000, // 10秒事务超时
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
   * 充值 - 创建充值订单
   */
  recharge = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { amount, method } = req.body;
      const userId = req.userId!;

      // 输入验证
      if (!['wechat', 'alipay'].includes(method)) {
        throw new ApiError(400, '不支持的支付方式');
      }

      const rechargeOption = RECHARGE_OPTIONS[amount];
      if (!rechargeOption) {
        throw new ApiError(400, '无效的充值金额');
      }

      const rechargeOrderNo = `RC${generateOrderNo()}`;
      const amountInCents = amount * 100; // 转换为分

      // 创建充值订单记录
      const rechargeOrder = await prisma.rechargeOrder.create({
        data: {
          orderNo: rechargeOrderNo,
          userId,
          amount: amountInCents,
          diamonds: rechargeOption.diamonds,
          bonusDiamonds: rechargeOption.bonus,
          paymentMethod: method,
          status: 'pending',
        },
      });

      // 微信支付
      if (method === 'wechat') {
        const paymentResult = await wechatPayService.createOrder({
          orderId: rechargeOrder.id,
          orderNo: rechargeOrderNo,
          amount: amountInCents,
          description: `喵喵开黑屋-充值${rechargeOption.diamonds}钻石`,
        });

        return res.json({
          success: true,
          data: {
            paymentMethod: 'wechat',
            rechargeOrderNo,
            diamonds: rechargeOption.diamonds,
            bonus: rechargeOption.bonus,
            ...paymentResult,
          },
        });
      }

      // 支付宝
      if (method === 'alipay') {
        const paymentResult = await alipayService.createOrder({
          orderId: rechargeOrder.id,
          orderNo: rechargeOrderNo,
          amount: amountInCents,
          subject: `喵喵开黑屋-充值${rechargeOption.diamonds}钻石`,
        });

        return res.json({
          success: true,
          data: {
            paymentMethod: 'alipay',
            rechargeOrderNo,
            diamonds: rechargeOption.diamonds,
            bonus: rechargeOption.bonus,
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
   * 微信支付回调 - 使用数据库幂等性
   */
  wechatNotify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await wechatPayService.handleNotify(req.body, req.headers);

      if (result.success && result.orderId && result.transactionId) {
        const idempotencyKey = `wechat_${result.transactionId}`;

        // 使用数据库进行幂等性检查
        const processed = await this.checkAndSetIdempotency(idempotencyKey);
        if (processed) {
          logger.info(`微信支付回调重复处理跳过: ${result.transactionId}`);
          return res.json({ code: 'SUCCESS', message: '成功' });
        }

        try {
          await this.handlePaymentSuccess(result.orderId, 'wechat', result.transactionId);
          await this.updateIdempotencyStatus(idempotencyKey, 'success');
        } catch (error) {
          await this.updateIdempotencyStatus(idempotencyKey, 'failed', String(error));
          throw error;
        }
      }

      res.json({ code: 'SUCCESS', message: '成功' });
    } catch (error) {
      logger.error('微信支付回调处理失败:', error);
      res.status(500).json({ code: 'FAIL', message: '处理失败' });
    }
  };

  /**
   * 支付宝回调 - 使用数据库幂等性
   */
  alipayNotify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await alipayService.handleNotify(req.body);

      if (result.success && result.orderId && result.tradeNo) {
        const idempotencyKey = `alipay_${result.tradeNo}`;

        // 使用数据库进行幂等性检查
        const processed = await this.checkAndSetIdempotency(idempotencyKey);
        if (processed) {
          logger.info(`支付宝回调重复处理跳过: ${result.tradeNo}`);
          return res.send('success');
        }

        try {
          await this.handlePaymentSuccess(result.orderId, 'alipay', result.tradeNo);
          await this.updateIdempotencyStatus(idempotencyKey, 'success');
        } catch (error) {
          await this.updateIdempotencyStatus(idempotencyKey, 'failed', String(error));
          throw error;
        }
      }

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
   * 检查幂等性并设置处理中状态（原子操作）
   * 使用upsert确保并发安全，避免竞态条件
   * 返回true表示已处理，false表示首次处理
   */
  private checkAndSetIdempotency = async (idempotencyKey: string): Promise<boolean> => {
    try {
      // 使用upsert实现原子操作
      // 如果记录存在且状态为success或processing，返回已处理
      // 如果记录不存在或状态为failed，设置为processing并返回首次处理
      const result = await prisma.$transaction(async (tx) => {
        // 先查询现有记录
        const existing = await tx.paymentIdempotency.findUnique({
          where: { idempotencyKey },
        });

        if (existing) {
          // 如果已成功处理或正在处理中，跳过
          if (existing.status === 'success' || existing.status === 'processing') {
            return { alreadyProcessed: true };
          }
          // failed状态可以重试，更新为processing
          await tx.paymentIdempotency.update({
            where: { idempotencyKey },
            data: { status: 'processing', updatedAt: new Date() },
          });
          return { alreadyProcessed: false };
        }

        // 创建新记录
        await tx.paymentIdempotency.create({
          data: { idempotencyKey, status: 'processing' },
        });
        return { alreadyProcessed: false };
      }, {
        timeout: 10000,
        isolationLevel: 'Serializable', // 最高隔离级别防止并发问题
      });

      return result.alreadyProcessed;
    } catch (error: unknown) {
      // 处理唯一约束冲突（并发创建时可能发生）
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === 'P2002') {
          return true; // 视为已处理
        }
      }
      throw error;
    }
  };

  /**
   * 更新幂等性状态
   */
  private updateIdempotencyStatus = async (
    idempotencyKey: string,
    status: 'success' | 'failed',
    result?: string
  ) => {
    await prisma.paymentIdempotency.update({
      where: { idempotencyKey },
      data: { status, result },
    });
  };

  /**
   * 处理支付成功 - 使用事务保证一致性
   */
  private handlePaymentSuccess = async (
    orderId: string,
    paymentMethod: string,
    paymentId: string
  ) => {
    // 检查是否是充值订单（通过订单ID查找）
    const rechargeOrder = await prisma.rechargeOrder.findUnique({
      where: { id: orderId },
    });

    if (rechargeOrder) {
      await this.handleRechargeSuccess(rechargeOrder.orderNo, paymentMethod, paymentId);
      return;
    }

    // 普通订单支付成功处理
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error(`订单不存在: ${orderId}`);
      }

      if (order.status !== 'pending_payment') {
        logger.info(`订单已处理，跳过: ${orderId}, 当前状态: ${order.status}`);
        return;
      }

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
    }, { timeout: 30000 }); // 30秒超时，防止高并发或慢查询
  };

  /**
   * 处理充值成功 - 使用事务保证一致性
   */
  private handleRechargeSuccess = async (
    rechargeOrderNo: string,
    paymentMethod: string,
    paymentId: string
  ) => {
    await prisma.$transaction(async (tx) => {
      // 查询充值订单
      const rechargeOrder = await tx.rechargeOrder.findUnique({
        where: { orderNo: rechargeOrderNo },
      });

      if (!rechargeOrder) {
        throw new Error(`充值订单不存在: ${rechargeOrderNo}`);
      }

      if (rechargeOrder.status !== 'pending') {
        logger.info(`充值订单已处理，跳过: ${rechargeOrderNo}, 当前状态: ${rechargeOrder.status}`);
        return;
      }

      const totalDiamonds = rechargeOrder.diamonds + rechargeOrder.bonusDiamonds;

      // 1. 更新用户余额
      const user = await tx.user.update({
        where: { id: rechargeOrder.userId },
        data: {
          balance: { increment: totalDiamonds },
        },
      });

      // 2. 创建交易记录
      await tx.transaction.create({
        data: {
          userId: rechargeOrder.userId,
          type: 'recharge',
          amount: totalDiamonds,
          balance: user.balance,
          description: `充值${rechargeOrder.diamonds}钻石${rechargeOrder.bonusDiamonds > 0 ? `+赠送${rechargeOrder.bonusDiamonds}钻石` : ''}`,
          relatedId: rechargeOrder.id,
        },
      });

      // 3. 更新充值订单状态
      await tx.rechargeOrder.update({
        where: { orderNo: rechargeOrderNo },
        data: {
          status: 'success',
          paymentMethod,
          paymentId,
          paidAt: new Date(),
        },
      });

      logger.info(`充值成功: 订单=${rechargeOrderNo}, 用户=${rechargeOrder.userId}, 钻石=${totalDiamonds}, 交易号=${paymentId}`);
    }, { timeout: 30000 }); // 30秒超时，防止高并发或慢查询
  };

  /**
   * 获取充值档位列表
   */
  getRechargeOptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const options = Object.entries(RECHARGE_OPTIONS).map(([amount, { diamonds, bonus }]) => ({
        amount: parseInt(amount),
        diamonds,
        bonus,
        isHot: amount === '30',
      }));

      res.json({
        success: true,
        data: options,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取充值历史
   */
  getRechargeHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { page = 1, limit = 20 } = req.query;

      // 输入验证
      const pageNum = Math.max(1, Math.min(100, Number(page) || 1));
      const limitNum = Math.max(1, Math.min(50, Number(limit) || 20));

      const [orders, total] = await Promise.all([
        prisma.rechargeOrder.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
        }),
        prisma.rechargeOrder.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        data: {
          list: orders,
          total,
          page: pageNum,
          limit: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
