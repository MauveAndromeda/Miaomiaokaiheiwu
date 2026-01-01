/**
 * 教练控制器
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/errors';

export class CoachController {
  /**
   * 获取教练列表
   */
  getList = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        page = 1,
        limit = 20,
        gameId,
        serviceType,
        gender,
        sort = 'popular',
        minPrice,
        maxPrice,
      } = req.query;

      // 构建查询条件
      const where: any = {
        isCoach: true,
        status: 'active',
        coachProfile: {
          isVerified: true,
        },
      };

      if (gender) {
        where.gender = gender;
      }

      // 排序条件
      let orderBy: any = {};
      switch (sort) {
        case 'rating':
          orderBy = { coachProfile: { rating: 'desc' } };
          break;
        case 'price_asc':
          orderBy = { coachProfile: { sortOrder: 'asc' } };
          break;
        case 'price_desc':
          orderBy = { coachProfile: { sortOrder: 'desc' } };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        default: // popular
          orderBy = { coachProfile: { totalOrders: 'desc' } };
      }

      const [coaches, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
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
        }),
        prisma.user.count({ where }),
      ]);

      // 检查是否已收藏
      let favoriteIds: string[] = [];
      if (req.userId) {
        const favorites = await prisma.favorite.findMany({
          where: {
            userId: req.userId,
            coachId: { in: coaches.map((c) => c.id) },
          },
          select: { coachId: true },
        });
        favoriteIds = favorites.map((f) => f.coachId);
      }

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
            rating: coach.coachProfile?.rating || 5,
            totalOrders: coach.coachProfile?.totalOrders || 0,
            onlineStatus: coach.coachProfile?.onlineStatus || 'offline',
            tags: coach.coachProfile?.tags ? JSON.parse(coach.coachProfile.tags) : [],
            services: coach.coachProfile?.services || [],
            games: coach.coachProfile?.games || [],
            isFavorite: favoriteIds.includes(coach.id),
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
   * 获取热门教练
   */
  getHotCoaches = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const coaches = await prisma.user.findMany({
        where: {
          isCoach: true,
          status: 'active',
          coachProfile: {
            isVerified: true,
          },
        },
        orderBy: {
          coachProfile: {
            totalOrders: 'desc',
          },
        },
        take: 10,
        include: {
          coachProfile: {
            include: {
              services: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: coaches.map((coach) => ({
          id: coach.id,
          nickname: coach.nickname,
          avatar: coach.avatar,
          gender: coach.gender,
          rating: coach.coachProfile?.rating || 5,
          tags: coach.coachProfile?.tags ? JSON.parse(coach.coachProfile.tags) : [],
          services: coach.coachProfile?.services || [],
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取推荐教练
   */
  getRecommended = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // 简单实现：随机获取在线教练
      const coaches = await prisma.user.findMany({
        where: {
          isCoach: true,
          status: 'active',
          coachProfile: {
            isVerified: true,
            onlineStatus: 'online',
          },
        },
        take: 20,
        include: {
          coachProfile: {
            include: {
              services: true,
            },
          },
        },
      });

      // 随机打乱
      const shuffled = coaches.sort(() => Math.random() - 0.5).slice(0, 6);

      res.json({
        success: true,
        data: shuffled.map((coach) => ({
          id: coach.id,
          nickname: coach.nickname,
          avatar: coach.avatar,
          gender: coach.gender,
          rating: coach.coachProfile?.rating || 5,
          tags: coach.coachProfile?.tags ? JSON.parse(coach.coachProfile.tags) : [],
          services: coach.coachProfile?.services || [],
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取教练详情
   */
  getDetail = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const coach = await prisma.user.findFirst({
        where: {
          id,
          isCoach: true,
        },
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

      if (!coach) {
        throw new ApiError(404, '教练不存在');
      }

      // 检查是否已收藏
      let isFavorite = false;
      if (req.userId) {
        const favorite = await prisma.favorite.findUnique({
          where: {
            userId_coachId: {
              userId: req.userId,
              coachId: id,
            },
          },
        });
        isFavorite = !!favorite;
      }

      res.json({
        success: true,
        data: {
          id: coach.id,
          nickname: coach.nickname,
          avatar: coach.avatar,
          gender: coach.gender,
          level: coach.level,
          bio: coach.bio,
          isVip: coach.isVip,
          rating: coach.coachProfile?.rating || 5,
          totalOrders: coach.coachProfile?.totalOrders || 0,
          completedOrders: coach.coachProfile?.completedOrders || 0,
          responseRate: coach.coachProfile?.responseRate || 100,
          acceptRate: coach.coachProfile?.acceptRate || 100,
          onlineStatus: coach.coachProfile?.onlineStatus || 'offline',
          isAccepting: coach.coachProfile?.isAccepting || false,
          tags: coach.coachProfile?.tags ? JSON.parse(coach.coachProfile.tags) : [],
          images: coach.coachProfile?.images ? JSON.parse(coach.coachProfile.images) : [],
          voiceIntro: coach.coachProfile?.voiceIntro,
          services: coach.coachProfile?.services || [],
          games: coach.coachProfile?.games || [],
          isFavorite,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 获取教练评价
   */
  getReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { coachId: id },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatar: true,
              },
            },
            order: {
              select: {
                game: {
                  select: {
                    name: true,
                  },
                },
                serviceType: true,
              },
            },
          },
        }),
        prisma.review.count({ where: { coachId: id } }),
      ]);

      res.json({
        success: true,
        data: {
          list: reviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            content: review.content,
            tags: review.tags ? JSON.parse(review.tags) : [],
            images: review.images ? JSON.parse(review.images) : [],
            user: review.isAnonymous
              ? { nickname: '匿名用户', avatar: null }
              : review.user,
            game: review.order?.game?.name,
            serviceType: review.order?.serviceType,
            reply: review.reply,
            createdAt: review.createdAt,
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
   * 获取教练可预约时间
   */
  getAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const coach = await prisma.user.findFirst({
        where: {
          id,
          isCoach: true,
        },
        include: {
          coachProfile: true,
        },
      });

      if (!coach) {
        throw new ApiError(404, '教练不存在');
      }

      // 简化实现：返回在线状态和是否接单
      res.json({
        success: true,
        data: {
          onlineStatus: coach.coachProfile?.onlineStatus || 'offline',
          isAccepting: coach.coachProfile?.isAccepting || false,
          // 可以扩展为具体的时间段
          availableSlots: [],
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
