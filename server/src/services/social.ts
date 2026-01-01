/**
 * 社交关系链服务
 * 关注/粉丝/好友关系管理
 */

import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface FollowStats {
  followingCount: number;
  followerCount: number;
  mutualCount: number;
}

interface RelationshipStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isMutual: boolean;
  isFriend: boolean;
  isBlocked: boolean;
}

export class SocialService {
  /**
   * 关注用户
   */
  async follow(userId: string, targetUserId: string): Promise<boolean> {
    if (userId === targetUserId) {
      throw new Error('不能关注自己');
    }

    try {
      // 检查是否已关注
      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });

      if (existing) {
        return true; // 已关注
      }

      // 检查是否被对方拉黑
      const blocked = await prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: targetUserId,
            blockedId: userId,
          },
        },
      });

      if (blocked) {
        throw new Error('操作失败');
      }

      // 创建关注关系
      await prisma.follow.create({
        data: {
          followerId: userId,
          followingId: targetUserId,
        },
      });

      // 检查是否互相关注（自动成为好友）
      const isFollowedBack = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: userId,
          },
        },
      });

      if (isFollowedBack) {
        // 创建好友关系
        await this.createFriendship(userId, targetUserId);
      }

      logger.info(`用户关注: ${userId} -> ${targetUserId}`);
      return true;
    } catch (error) {
      logger.error('关注失败:', error);
      throw error;
    }
  }

  /**
   * 取消关注
   */
  async unfollow(userId: string, targetUserId: string): Promise<boolean> {
    try {
      await prisma.follow.deleteMany({
        where: {
          followerId: userId,
          followingId: targetUserId,
        },
      });

      // 移除好友关系（如果存在）
      await prisma.friendship.deleteMany({
        where: {
          OR: [
            { userId1: userId, userId2: targetUserId },
            { userId1: targetUserId, userId2: userId },
          ],
        },
      });

      logger.info(`取消关注: ${userId} -> ${targetUserId}`);
      return true;
    } catch (error) {
      logger.error('取消关注失败:', error);
      return false;
    }
  }

  /**
   * 创建好友关系（互关）
   */
  private async createFriendship(userId1: string, userId2: string): Promise<void> {
    const [first, second] = [userId1, userId2].sort();

    const existing = await prisma.friendship.findUnique({
      where: {
        userId1_userId2: {
          userId1: first,
          userId2: second,
        },
      },
    });

    if (!existing) {
      await prisma.friendship.create({
        data: {
          userId1: first,
          userId2: second,
        },
      });
      logger.info(`成为好友: ${userId1} <-> ${userId2}`);
    }
  }

  /**
   * 拉黑用户
   */
  async block(userId: string, targetUserId: string): Promise<boolean> {
    if (userId === targetUserId) {
      throw new Error('不能拉黑自己');
    }

    try {
      // 先取消关注关系
      await this.unfollow(userId, targetUserId);
      await this.unfollow(targetUserId, userId);

      // 创建拉黑记录
      await prisma.block.upsert({
        where: {
          blockerId_blockedId: {
            blockerId: userId,
            blockedId: targetUserId,
          },
        },
        create: {
          blockerId: userId,
          blockedId: targetUserId,
        },
        update: {},
      });

      logger.info(`用户拉黑: ${userId} -> ${targetUserId}`);
      return true;
    } catch (error) {
      logger.error('拉黑失败:', error);
      return false;
    }
  }

  /**
   * 取消拉黑
   */
  async unblock(userId: string, targetUserId: string): Promise<boolean> {
    try {
      await prisma.block.deleteMany({
        where: {
          blockerId: userId,
          blockedId: targetUserId,
        },
      });

      logger.info(`取消拉黑: ${userId} -> ${targetUserId}`);
      return true;
    } catch (error) {
      logger.error('取消拉黑失败:', error);
      return false;
    }
  }

  /**
   * 获取关系状态
   */
  async getRelationshipStatus(userId: string, targetUserId: string): Promise<RelationshipStatus> {
    try {
      const [isFollowing, isFollowedBy, isBlocked, isBlockedBy] = await Promise.all([
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: targetUserId,
            },
          },
        }),
        prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: targetUserId,
              followingId: userId,
            },
          },
        }),
        prisma.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: userId,
              blockedId: targetUserId,
            },
          },
        }),
        prisma.block.findUnique({
          where: {
            blockerId_blockedId: {
              blockerId: targetUserId,
              blockedId: userId,
            },
          },
        }),
      ]);

      const isMutual = !!isFollowing && !!isFollowedBy;

      return {
        isFollowing: !!isFollowing,
        isFollowedBy: !!isFollowedBy,
        isMutual,
        isFriend: isMutual,
        isBlocked: !!isBlocked || !!isBlockedBy,
      };
    } catch (error) {
      logger.error('获取关系状态失败:', error);
      return {
        isFollowing: false,
        isFollowedBy: false,
        isMutual: false,
        isFriend: false,
        isBlocked: false,
      };
    }
  }

  /**
   * 获取关注/粉丝统计
   */
  async getFollowStats(userId: string): Promise<FollowStats> {
    try {
      const [followingCount, followerCount] = await Promise.all([
        prisma.follow.count({ where: { followerId: userId } }),
        prisma.follow.count({ where: { followingId: userId } }),
      ]);

      // 计算互关数
      const [first] = [userId].sort();
      const mutualCount = await prisma.friendship.count({
        where: {
          OR: [
            { userId1: userId },
            { userId2: userId },
          ],
        },
      });

      return {
        followingCount,
        followerCount,
        mutualCount,
      };
    } catch (error) {
      logger.error('获取关注统计失败:', error);
      return { followingCount: 0, followerCount: 0, mutualCount: 0 };
    }
  }

  /**
   * 获取关注列表
   */
  async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    try {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              isCoach: true,
              coachProfile: {
                select: {
                  onlineStatus: true,
                  games: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return follows.map(f => ({
        ...f.following,
        followedAt: f.createdAt,
      }));
    } catch (error) {
      logger.error('获取关注列表失败:', error);
      return [];
    }
  }

  /**
   * 获取粉丝列表
   */
  async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    try {
      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
              isCoach: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });

      // 检查是否互相关注
      const followerIds = followers.map(f => f.followerId);
      const mutualFollows = await prisma.follow.findMany({
        where: {
          followerId: userId,
          followingId: { in: followerIds },
        },
        select: { followingId: true },
      });
      const mutualSet = new Set(mutualFollows.map(f => f.followingId));

      return followers.map(f => ({
        ...f.follower,
        followedAt: f.createdAt,
        isMutual: mutualSet.has(f.followerId),
      }));
    } catch (error) {
      logger.error('获取粉丝列表失败:', error);
      return [];
    }
  }

  /**
   * 获取好友列表（互相关注）
   */
  async getFriends(userId: string, page: number = 1, limit: number = 20): Promise<any[]> {
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { userId1: userId },
            { userId2: userId },
          ],
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      const friendIds = friendships.map(f =>
        f.userId1 === userId ? f.userId2 : f.userId1
      );

      const friends = await prisma.user.findMany({
        where: { id: { in: friendIds } },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          isCoach: true,
          coachProfile: {
            select: {
              onlineStatus: true,
            },
          },
        },
      });

      return friends;
    } catch (error) {
      logger.error('获取好友列表失败:', error);
      return [];
    }
  }

  /**
   * 获取黑名单
   */
  async getBlockList(userId: string): Promise<any[]> {
    try {
      const blocks = await prisma.block.findMany({
        where: { blockerId: userId },
        include: {
          blocked: {
            select: {
              id: true,
              nickname: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return blocks.map(b => ({
        ...b.blocked,
        blockedAt: b.createdAt,
      }));
    } catch (error) {
      logger.error('获取黑名单失败:', error);
      return [];
    }
  }

  /**
   * 推荐关注（基于共同关注）
   */
  async getRecommendedFollows(userId: string, limit: number = 10): Promise<any[]> {
    try {
      // 获取我关注的人
      const myFollowing = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const myFollowingIds = myFollowing.map(f => f.followingId);

      // 获取我关注的人关注的人（二度关系）
      const secondDegree = await prisma.follow.findMany({
        where: {
          followerId: { in: myFollowingIds },
          followingId: { notIn: [...myFollowingIds, userId] },
        },
        select: { followingId: true },
      });

      // 统计被关注次数
      const followCount = new Map<string, number>();
      for (const f of secondDegree) {
        followCount.set(f.followingId, (followCount.get(f.followingId) || 0) + 1);
      }

      // 排序获取推荐
      const recommended = [...followCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      if (recommended.length === 0) {
        // 如果没有二度关系，推荐热门用户
        const popular = await prisma.user.findMany({
          where: {
            id: { notIn: [...myFollowingIds, userId] },
            isCoach: true,
          },
          select: {
            id: true,
            nickname: true,
            avatar: true,
            coachProfile: {
              select: {
                orderCount: true,
                rating: true,
              },
            },
          },
          orderBy: {
            coachProfile: {
              orderCount: 'desc',
            },
          },
          take: limit,
        });
        return popular;
      }

      const users = await prisma.user.findMany({
        where: { id: { in: recommended } },
        select: {
          id: true,
          nickname: true,
          avatar: true,
          isCoach: true,
          coachProfile: {
            select: {
              games: true,
              rating: true,
            },
          },
        },
      });

      return users.map(u => ({
        ...u,
        mutualFollowCount: followCount.get(u.id) || 0,
      }));
    } catch (error) {
      logger.error('获取推荐关注失败:', error);
      return [];
    }
  }
}

export const socialService = new SocialService();
