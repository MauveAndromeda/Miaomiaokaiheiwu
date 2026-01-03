/**
 * 推荐算法服务
 * 基于用户行为、内容特征的智能推荐
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface UserPreference {
  games: string[];
  tags: string[];
  priceRange: { min: number; max: number };
  gender?: string;
  recentViews: string[];
  favorites: string[];
  orderHistory: string[];
}

interface RecommendationScore {
  coachId: string;
  score: number;
  reasons: string[];
}

interface RecommendationOptions {
  limit?: number;
  excludeIds?: string[];
  gameFilter?: string;
  sortBy?: 'score' | 'rating' | 'orderCount' | 'price';
}

export class RecommendationService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private recommendationCache = new Map<string, { data: any[]; timestamp: number }>();

  /**
   * 获取用户偏好
   */
  private async getUserPreference(userId: string): Promise<UserPreference> {
    try {
      // 获取用户浏览历史
      const recentViews = await prisma.userBehavior.findMany({
        where: {
          userId,
          action: 'view',
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { targetId: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // 获取用户收藏
      const favorites = await prisma.favorite.findMany({
        where: { userId },
        select: { coachId: true },
        take: 50,
      });

      // 获取用户订单历史
      const orders = await prisma.order.findMany({
        where: { userId, status: 'completed' },
        select: { coachId: true, totalAmount: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // 分析用户偏好的游戏和标签
      const viewedCoachIds = recentViews.map(v => v.targetId);
      const favCoachIds = favorites.map(f => f.coachId);
      const orderedCoachIds = orders.map(o => o.coachId);

      const allCoachIds = [...new Set([...viewedCoachIds, ...favCoachIds, ...orderedCoachIds])];

      const coaches = await prisma.coachProfile.findMany({
        where: { userId: { in: allCoachIds } },
        select: { userId: true, games: true, tags: true },
      });

      // 统计游戏和标签频率
      const gameCount = new Map<string, number>();
      const tagCount = new Map<string, number>();

      for (const coach of coaches) {
        if (coach.games) {
          try {
            const games = JSON.parse(coach.games as string);
            for (const game of games) {
              gameCount.set(game, (gameCount.get(game) || 0) + 1);
            }
          } catch {}
        }
        if (coach.tags) {
          try {
            const tags = JSON.parse(coach.tags as string);
            for (const tag of tags) {
              tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
            }
          } catch {}
        }
      }

      // 获取前5个最常见的游戏和标签
      const topGames = [...gameCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([game]) => game);

      const topTags = [...tagCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      // 计算价格范围偏好
      const prices = orders.map(o => o.totalAmount);
      const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 5000;

      return {
        games: topGames,
        tags: topTags,
        priceRange: {
          min: Math.max(0, avgPrice - 3000),
          max: avgPrice + 5000,
        },
        recentViews: viewedCoachIds,
        favorites: favCoachIds,
        orderHistory: orderedCoachIds,
      };
    } catch (error) {
      logger.error('获取用户偏好失败:', error);
      return {
        games: [],
        tags: [],
        priceRange: { min: 0, max: 100000 },
        recentViews: [],
        favorites: [],
        orderHistory: [],
      };
    }
  }

  /**
   * 计算教练推荐分数
   */
  private calculateScore(
    coach: any,
    preference: UserPreference
  ): RecommendationScore {
    let score = 0;
    const reasons: string[] = [];

    // 1. 游戏匹配度 (权重: 30%)
    if (coach.games) {
      try {
        const coachGames = JSON.parse(coach.games);
        const matchedGames = coachGames.filter((g: string) => preference.games.includes(g));
        const gameScore = (matchedGames.length / Math.max(preference.games.length, 1)) * 30;
        score += gameScore;
        if (matchedGames.length > 0) {
          reasons.push(`擅长您喜欢的游戏: ${matchedGames.slice(0, 2).join(', ')}`);
        }
      } catch {}
    }

    // 2. 标签匹配度 (权重: 20%)
    if (coach.tags) {
      try {
        const coachTags = JSON.parse(coach.tags);
        const matchedTags = coachTags.filter((t: string) => preference.tags.includes(t));
        const tagScore = (matchedTags.length / Math.max(preference.tags.length, 1)) * 20;
        score += tagScore;
        if (matchedTags.length > 0) {
          reasons.push(`特点: ${matchedTags.slice(0, 3).join(', ')}`);
        }
      } catch {}
    }

    // 3. 评分因素 (权重: 20%)
    const ratingScore = (coach.rating / 5) * 20;
    score += ratingScore;
    if (coach.rating >= 4.5) {
      reasons.push(`高评分: ${coach.rating.toFixed(1)}分`);
    }

    // 4. 订单量因素 (权重: 10%)
    const orderScore = Math.min(coach.orderCount / 100, 1) * 10;
    score += orderScore;
    if (coach.orderCount > 50) {
      reasons.push(`人气教练: ${coach.orderCount}单`);
    }

    // 5. 价格匹配度 (权重: 10%)
    if (coach.price >= preference.priceRange.min && coach.price <= preference.priceRange.max) {
      score += 10;
      reasons.push('价格符合您的预算');
    }

    // 6. 在线状态 (权重: 5%)
    if (coach.onlineStatus === 'online') {
      score += 5;
      reasons.push('当前在线');
    }

    // 7. 新鲜度 (权重: 5%)
    // 避免重复推荐最近看过的
    if (!preference.recentViews.includes(coach.userId)) {
      score += 3;
    }
    // 偏好收藏过的
    if (preference.favorites.includes(coach.userId)) {
      score += 2;
      reasons.push('您收藏的教练');
    }

    return {
      coachId: coach.userId,
      score: Math.round(score * 100) / 100,
      reasons,
    };
  }

  /**
   * 获取个性化推荐
   */
  async getRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<any[]> {
    const { limit = 20, excludeIds = [], gameFilter, sortBy = 'score' } = options;

    // 检查缓存
    const cacheKey = `${userId}_${gameFilter || 'all'}_${sortBy}`;
    const cached = this.recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data.filter(c => !excludeIds.includes(c.userId)).slice(0, limit);
    }

    try {
      // 获取用户偏好
      const preference = await this.getUserPreference(userId);

      // 构建查询条件
      const where: any = {
        isVerified: true,
      };

      if (gameFilter) {
        where.games = { contains: gameFilter };
      }

      // 排除已下单但未完成的教练
      const pendingOrders = await prisma.order.findMany({
        where: {
          userId,
          status: { in: ['pending', 'paid', 'accepted', 'in_progress'] },
        },
        select: { coachId: true },
      });
      const busyCoachIds = pendingOrders.map(o => o.coachId);

      // 获取候选教练
      const candidates = await prisma.coachProfile.findMany({
        where: {
          ...where,
          userId: { notIn: [...excludeIds, ...busyCoachIds] },
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              gender: true,
            },
          },
        },
        take: 100,
      });

      // 计算推荐分数
      const scoredCandidates = candidates.map(coach => {
        const scoreResult = this.calculateScore(coach, preference);
        return {
          ...coach,
          user: coach.user,
          recommendScore: scoreResult.score,
          recommendReasons: scoreResult.reasons,
        };
      });

      // 排序
      let sorted;
      switch (sortBy) {
        case 'rating':
          sorted = scoredCandidates.sort((a, b) => b.rating - a.rating);
          break;
        case 'orderCount':
          sorted = scoredCandidates.sort((a, b) => b.orderCount - a.orderCount);
          break;
        case 'price':
          sorted = scoredCandidates.sort((a, b) => a.price - b.price);
          break;
        default:
          sorted = scoredCandidates.sort((a, b) => b.recommendScore - a.recommendScore);
      }

      const result = sorted.slice(0, limit);

      // 更新缓存
      this.recommendationCache.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      logger.error('获取推荐失败:', error);
      return [];
    }
  }

  /**
   * 获取相似教练推荐
   */
  async getSimilarCoaches(coachId: string, limit: number = 6): Promise<any[]> {
    try {
      const coach = await prisma.coachProfile.findUnique({
        where: { userId: coachId },
        select: { games: true, tags: true, price: true },
      });

      if (!coach) return [];

      let coachGames: string[] = [];
      let coachTags: string[] = [];

      try {
        coachGames = JSON.parse(coach.games as string);
        coachTags = JSON.parse(coach.tags as string);
      } catch {}

      // 查找游戏或标签相似的教练
      const similar = await prisma.coachProfile.findMany({
        where: {
          userId: { not: coachId },
          isVerified: true,
          OR: [
            ...coachGames.map(game => ({ games: { contains: game } })),
            ...coachTags.slice(0, 3).map(tag => ({ tags: { contains: tag } })),
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
        take: 20,
      });

      // 按价格相似度和评分排序
      const sorted = similar.sort((a, b) => {
        const priceDiffA = Math.abs(a.price - coach.price);
        const priceDiffB = Math.abs(b.price - coach.price);
        const scoreA = b.rating * 10 - priceDiffA / 100;
        const scoreB = a.rating * 10 - priceDiffB / 100;
        return scoreB - scoreA;
      });

      return sorted.slice(0, limit);
    } catch (error) {
      logger.error('获取相似教练失败:', error);
      return [];
    }
  }

  /**
   * 获取热门教练
   */
  async getPopularCoaches(gameId?: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `popular_${gameId || 'all'}`;
    const cached = this.recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data.slice(0, limit);
    }

    try {
      const where: any = { isVerified: true };
      if (gameId) {
        where.games = { contains: gameId };
      }

      const popular = await prisma.coachProfile.findMany({
        where,
        orderBy: [
          { orderCount: 'desc' },
          { rating: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
        take: limit,
      });

      this.recommendationCache.set(cacheKey, { data: popular, timestamp: Date.now() });

      return popular;
    } catch (error) {
      logger.error('获取热门教练失败:', error);
      return [];
    }
  }

  /**
   * 获取新人教练
   */
  async getNewCoaches(limit: number = 10): Promise<any[]> {
    try {
      const newCoaches = await prisma.coachProfile.findMany({
        where: {
          isVerified: true,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
        take: limit,
      });

      return newCoaches;
    } catch (error) {
      logger.error('获取新人教练失败:', error);
      return [];
    }
  }

  /**
   * 记录用户行为（用于改进推荐）
   */
  async recordUserBehavior(
    userId: string,
    action: 'view' | 'like' | 'share' | 'order',
    targetId: string,
    extra?: any
  ): Promise<void> {
    try {
      await prisma.userBehavior.create({
        data: {
          userId,
          action,
          targetId,
          extra: extra ? JSON.stringify(extra) : null,
        },
      });

      // 清除该用户的推荐缓存
      for (const key of this.recommendationCache.keys()) {
        if (key.startsWith(userId)) {
          this.recommendationCache.delete(key);
        }
      }
    } catch (error) {
      logger.error('记录用户行为失败:', error);
    }
  }

  /**
   * 清除缓存
   */
  clearCache(userId?: string): void {
    if (userId) {
      for (const key of this.recommendationCache.keys()) {
        if (key.startsWith(userId)) {
          this.recommendationCache.delete(key);
        }
      }
    } else {
      this.recommendationCache.clear();
    }
  }
}

export const recommendationService = new RecommendationService();
