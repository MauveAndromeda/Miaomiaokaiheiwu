/**
 * 订单控制器
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/errors';
import { generateOrderNo } from '../utils/helpers';

export class OrderController {
  /**
   * 创建订单
   */
  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { coachId, gameId, serviceType, quantity, remark } = req.body;
      const userId = req.userId!;

      // 检查教练是否存在
      const coach = await prisma.user.findFirst({
        where: {
          id: coachId,
          isCoach: true,
          status: 'active',
        },
        include: {
          coachProfile: {
            include: {
              services: true,
            },
          },
        },
      });

      if (!coach) {
        throw new ApiError(404, '教练不存在');
      }

      if (!coach.coachProfile?.isAccepting) {
        throw new ApiError(400, '教练暂不接单');
      }

      // 检查游戏是否存在
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        throw new ApiError(404, '游戏不存在');
      }

      // 获取服务价格
      const service = coach.coachProfile?.services.find(
        (s) => s.type === serviceType
      );

      if (!service || !service.isEnabled) {
        throw new ApiError(400, '该服务类型不可用');
      }

      const price = service.price;
      const unit = service.unit;
      const totalPrice = price * quantity;

      // 创建订单
      const order = await prisma.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId,
          coachId,
          gameId,
          serviceType,
          quantity,
          unit,
          price,
          totalPrice,
          remark,
          status: 'pending_payment',
        },
        include: {
          coach: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          game: true,
        },
      });

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取订单列表
   */
  getList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status = 'all', page = 1, limit = 20 } = req.query;
      const userId = req.userId!;

      const where: any = {
        OR: [{ userId }, { coachId: userId }],
      };

      if (status !== 'all') {
        where.status = status;
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            coach: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
            game: true,
          },
        }),
        prisma.order.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          list: orders,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取订单详情
   */
  getDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const order = await prisma.order.findFirst({
        where: {
          id,
          OR: [{ userId }, { coachId: userId }],
        },
        include: {
          coach: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              phone: true,
            },
          },
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
          game: true,
          review: true,
        },
      });

      if (!order) {
        throw new ApiError(404, '订单不存在');
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 取消订单
   */
  cancel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.userId!;

      const order = await prisma.order.findFirst({
        where: {
          id,
          userId,
          status: { in: ['pending_payment', 'pending_accept'] },
        },
      });

      if (!order) {
        throw new ApiError(400, '订单不存在或无法取消');
      }

      // 如果已支付，需要退款
      if (order.status === 'pending_accept' && order.paidAt) {
        // 退还余额
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: { increment: order.totalPrice },
          },
        });

        // 记录退款交易
        await prisma.transaction.create({
          data: {
            userId,
            type: 'refund',
            amount: order.totalPrice,
            balance: 0, // 会在查询时更新
            description: `订单退款 ${order.orderNo}`,
            relatedId: order.id,
          },
        });
      }

      // 更新订单状态
      await prisma.order.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: reason,
        },
      });

      res.json({
        success: true,
        message: '订单已取消',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 接受订单（教练）
   */
  accept = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const coachId = req.userId!;

      const order = await prisma.order.findFirst({
        where: {
          id,
          coachId,
          status: 'pending_accept',
        },
      });

      if (!order) {
        throw new ApiError(400, '订单不存在或无法接受');
      }

      await prisma.order.update({
        where: { id },
        data: {
          status: 'accepted',
          acceptedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: '已接受订单',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 完成订单
   */
  complete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const order = await prisma.order.findFirst({
        where: {
          id,
          OR: [{ userId }, { coachId: userId }],
          status: { in: ['accepted', 'in_progress'] },
        },
      });

      if (!order) {
        throw new ApiError(400, '订单不存在或无法完成');
      }

      // 更新订单状态
      await prisma.order.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // 给教练结算（扣除平台佣金后）
      const coachEarnings = Math.floor(order.totalPrice * 0.8); // 80%给教练
      await prisma.user.update({
        where: { id: order.coachId },
        data: {
          balance: { increment: coachEarnings },
        },
      });

      // 记录教练收入
      await prisma.transaction.create({
        data: {
          userId: order.coachId,
          type: 'income',
          amount: coachEarnings,
          balance: 0,
          description: `订单收入 ${order.orderNo}`,
          relatedId: order.id,
        },
      });

      // 更新教练统计
      await prisma.coachProfile.update({
        where: { userId: order.coachId },
        data: {
          completedOrders: { increment: 1 },
          totalEarnings: { increment: coachEarnings },
        },
      });

      res.json({
        success: true,
        message: '订单已完成',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 评价订单
   */
  review = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { rating, content, tags, isAnonymous } = req.body;
      const userId = req.userId!;

      const order = await prisma.order.findFirst({
        where: {
          id,
          userId,
          status: 'completed',
        },
        include: {
          review: true,
        },
      });

      if (!order) {
        throw new ApiError(400, '订单不存在或无法评价');
      }

      if (order.review) {
        throw new ApiError(400, '已经评价过了');
      }

      // 创建评价
      const review = await prisma.review.create({
        data: {
          orderId: id,
          userId,
          coachId: order.coachId,
          rating,
          content,
          tags: tags ? JSON.stringify(tags) : null,
          isAnonymous: isAnonymous || false,
        },
      });

      // 更新教练评分（简单平均）
      const allReviews = await prisma.review.findMany({
        where: { coachId: order.coachId },
        select: { rating: true },
      });

      const avgRating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      await prisma.coachProfile.update({
        where: { userId: order.coachId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
        },
      });

      res.json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };
}
