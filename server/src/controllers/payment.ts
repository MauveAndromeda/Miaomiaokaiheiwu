/**
 * 支付控制器
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/errors';
import { WechatPayService } from '../services/wechatPay';
import { AlipayService } from '../services/alipay';
import { generateOrderNo } from '../utils/helpers';

export class PaymentController {
  private wechatPay = new WechatPayService();
  private alipay = new AlipayService();

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

      // 余额支付
      if (method === 'balance') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (!user || user.balance < order.totalPrice) {
          throw new ApiError(400, '余额不足');
        }

        // 扣除余额
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: { decrement: order.totalPrice },
          },
        });

        // 记录消费交易
        await prisma.transaction.create({
          data: {
            userId,
            type: 'consume',
            amount: -order.totalPrice,
            balance: user.balance - order.totalPrice,
            description: `订单支付 ${order.orderNo}`,
            relatedId: order.id,
          },
        });

        // 更新订单状态
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'pending_accept',
            paymentMethod: 'balance',
            paidAt: new Date(),
          },
        });

        return res.json({
          success: true,
          data: {
            paymentMethod: 'balance',
            status: 'success',
          },
        });
      }

      // 微信支付
      if (method === 'wechat') {
        const paymentResult = await this.wechatPay.createOrder({
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
        const paymentResult = await this.alipay.createOrder({
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
        const paymentResult = await this.wechatPay.createOrder({
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
        const paymentResult = await this.alipay.createOrder({
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
   * 微信支付回调
   */
  wechatNotify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.wechatPay.handleNotify(req.body, req.headers);

      if (result.success && result.orderId) {
        await this.handlePaymentSuccess(result.orderId, 'wechat', result.transactionId);
      }

      // 返回微信要求的格式
      res.json({ code: 'SUCCESS', message: '成功' });
    } catch (error) {
      res.status(500).json({ code: 'FAIL', message: '处理失败' });
    }
  };

  /**
   * 支付宝回调
   */
  alipayNotify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.alipay.handleNotify(req.body);

      if (result.success && result.orderId) {
        await this.handlePaymentSuccess(result.orderId, 'alipay', result.tradeNo);
      }

      // 返回支付宝要求的格式
      res.send('success');
    } catch (error) {
      res.send('fail');
    }
  };

  /**
   * 查询支付状态
   */
  getPaymentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { paymentId } = req.params;

      // 这里可以查询第三方支付状态
      // 简化实现：查询订单状态

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
   * 处理支付成功
   */
  private handlePaymentSuccess = async (
    orderId: string,
    paymentMethod: string,
    paymentId: string
  ) => {
    // 检查是否是充值订单
    if (orderId.startsWith('RC')) {
      // 处理充值订单逻辑
      return;
    }

    // 更新订单状态
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'pending_accept',
        paymentMethod,
        paymentId,
        paidAt: new Date(),
      },
    });
  };
}
