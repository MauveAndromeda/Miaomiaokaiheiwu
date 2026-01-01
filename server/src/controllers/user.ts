/**
 * 用户控制器
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/errors';

export class UserController {
  /**
   * 获取用户资料
   */
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: {
          coachProfile: true,
        },
      });

      if (!user) {
        throw new ApiError(404, '用户不存在');
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          phone: user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
          nickname: user.nickname,
          avatar: user.avatar,
          gender: user.gender,
          birthday: user.birthday,
          bio: user.bio,
          level: user.level,
          experience: user.experience,
          balance: user.balance,
          isVip: user.isVip,
          vipExpireAt: user.vipExpireAt,
          isCoach: user.isCoach,
          coachProfile: user.coachProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 更新用户资料
   */
  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { nickname, avatar, gender, birthday, bio } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: {
          ...(nickname && { nickname }),
          ...(avatar && { avatar }),
          ...(gender && { gender }),
          ...(birthday && { birthday: new Date(birthday) }),
          ...(bio !== undefined && { bio }),
        },
      });

      res.json({
        success: true,
        data: {
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          gender: user.gender,
          birthday: user.birthday,
          bio: user.bio,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取钱包信息
   */
  getWallet = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          balance: true,
          isVip: true,
          vipExpireAt: true,
        },
      });

      if (!user) {
        throw new ApiError(404, '用户不存在');
      }

      // 获取收入统计（如果是教练）
      const earnings = await prisma.transaction.aggregate({
        where: {
          userId: req.userId,
          type: 'income',
        },
        _sum: {
          amount: true,
        },
      });

      res.json({
        success: true,
        data: {
          balance: user.balance,
          isVip: user.isVip,
          vipExpireAt: user.vipExpireAt,
          totalEarnings: earnings._sum.amount || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取交易记录
   */
  getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20, type } = req.query;

      const where: any = { userId: req.userId };
      if (type && type !== 'all') {
        where.type = type;
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.transaction.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          list: transactions,
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
   * 获取收藏列表
   */
  getFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { page = 1, limit = 20 } = req.query;

      const [favorites, total] = await Promise.all([
        prisma.favorite.findMany({
          where: { userId: req.userId },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            user: false, // 需要关联查询教练信息
          },
        }),
        prisma.favorite.count({ where: { userId: req.userId } }),
      ]);

      // 获取教练详情
      const coachIds = favorites.map((f) => f.coachId);
      const coaches = await prisma.user.findMany({
        where: { id: { in: coachIds } },
        include: {
          coachProfile: {
            include: {
              services: true,
              games: {
                include: {
                  game: true,
                },
              },
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          list: coaches.map((coach) => ({
            id: coach.id,
            nickname: coach.nickname,
            avatar: coach.avatar,
            gender: coach.gender,
            level: coach.level,
            isVip: coach.isVip,
            profile: coach.coachProfile,
          })),
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
   * 添加收藏
   */
  addFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { coachId } = req.params;

      // 检查是否已收藏
      const existing = await prisma.favorite.findUnique({
        where: {
          userId_coachId: {
            userId: req.userId!,
            coachId,
          },
        },
      });

      if (existing) {
        throw new ApiError(400, '已经收藏过了');
      }

      await prisma.favorite.create({
        data: {
          userId: req.userId!,
          coachId,
        },
      });

      res.json({
        success: true,
        message: '收藏成功',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 取消收藏
   */
  removeFavorite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { coachId } = req.params;

      await prisma.favorite.delete({
        where: {
          userId_coachId: {
            userId: req.userId!,
            coachId,
          },
        },
      });

      res.json({
        success: true,
        message: '已取消收藏',
      });
    } catch (error) {
      next(error);
    }
  };
}
