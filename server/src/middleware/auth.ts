/**
 * 认证中间件
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { ApiError } from '../utils/errors';

export interface AuthRequest extends Request {
  userId?: string;
  phone?: string;
}

const authService = new AuthService();

/**
 * 必须认证
 */
export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, '未提供认证令牌');
    }

    const token = authHeader.split(' ')[1];
    const payload = authService.verifyAccessToken(token);

    req.userId = payload.userId;
    req.phone = payload.phone;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 可选认证（不强制）
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = authService.verifyAccessToken(token);
      req.userId = payload.userId;
      req.phone = payload.phone;
    }

    next();
  } catch (error) {
    // 可选认证，忽略错误
    next();
  }
};

/**
 * 教练权限检查
 */
export const coachOnly = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      throw new ApiError(401, '未认证');
    }

    // 检查是否是教练
    const { prisma } = await import('../utils/prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isCoach: true },
    });

    if (!user?.isCoach) {
      throw new ApiError(403, '需要教练权限');
    }

    next();
  } catch (error) {
    next(error);
  }
};
