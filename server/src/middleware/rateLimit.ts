/**
 * 限流中间件
 * 多层次限流保护
 */

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * 通用API限流
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 200, // 每IP最多200次请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 跳过健康检查
    return req.path === '/health' || req.path === '/api/health';
  },
  handler: (req, res) => {
    logger.warn(`IP限流触发: ${req.ip}, 路径: ${req.path}`);
    res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
    });
  },
});

/**
 * 严格API限流（敏感操作）
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 20, // 每IP每小时20次
  message: {
    success: false,
    error: '操作过于频繁，请1小时后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`严格限流触发: ${req.ip}, 路径: ${req.path}`);
    res.status(429).json({
      success: false,
      error: '操作过于频繁，请1小时后再试',
    });
  },
});

/**
 * 短信验证码限流
 */
export const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 每分钟1次
  message: {
    success: false,
    error: '发送太频繁，请1分钟后再试',
  },
  keyGenerator: (req) => {
    // 按手机号+IP限流
    return `${req.body?.phone || ''}_${req.ip}`;
  },
  handler: (req, res) => {
    logger.warn(`短信限流触发: ${req.ip}, 手机号: ${req.body?.phone?.substring(0, 7)}****`);
    res.status(429).json({
      success: false,
      error: '发送太频繁，请1分钟后再试',
    });
  },
});

/**
 * 登录限流
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 每IP最多5次登录尝试
  message: {
    success: false,
    error: '登录尝试过多，请15分钟后再试',
  },
  handler: (req, res) => {
    logger.warn(`登录限流触发: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: '登录尝试过多，请15分钟后再试',
    });
  },
});

/**
 * 支付接口限流
 */
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟10次
  message: {
    success: false,
    error: '支付请求过于频繁，请稍后再试',
  },
  keyGenerator: (req) => {
    // 按用户ID限流
    return (req as any).user?.id || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`支付限流触发: ${(req as any).user?.id || req.ip}`);
    res.status(429).json({
      success: false,
      error: '支付请求过于频繁，请稍后再试',
    });
  },
});

/**
 * 文件上传限流
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 100, // 每小时100次
  message: {
    success: false,
    error: '上传过于频繁，请稍后再试',
  },
  keyGenerator: (req) => {
    return (req as any).user?.id || req.ip;
  },
});

/**
 * 搜索限流（防止暴力搜索攻击）
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 每分钟10次搜索
  message: {
    success: false,
    error: '搜索过于频繁，请稍后再试',
  },
  keyGenerator: (req) => {
    // 按用户ID或IP限流
    return (req as any).userId || req.ip || 'unknown';
  },
  handler: (req, res) => {
    logger.warn(`搜索限流触发: ${(req as any).userId || req.ip}`);
    res.status(429).json({
      success: false,
      error: '搜索过于频繁，请稍后再试',
    });
  },
});

/**
 * 用户级别的限流存储
 */
const userRateLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * 基于用户ID的自定义限流中间件
 */
export function userRateLimit(options: {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      return next();
    }

    const now = Date.now();
    const key = `${options.keyPrefix || 'user'}_${userId}`;
    const limit = userRateLimits.get(key);

    if (limit && now < limit.resetAt) {
      if (limit.count >= options.max) {
        logger.warn(`用户限流触发: ${userId}, 前缀: ${options.keyPrefix}`);
        return res.status(429).json({
          success: false,
          error: '操作过于频繁，请稍后再试',
        });
      }
      limit.count++;
    } else {
      userRateLimits.set(key, { count: 1, resetAt: now + options.windowMs });
    }

    next();
  };
}

/**
 * IP黑名单检查
 */
const ipBlacklist = new Set<string>();

export function loadIpBlacklist(ips: string[]): void {
  ips.forEach(ip => ipBlacklist.add(ip));
}

export function addToBlacklist(ip: string): void {
  ipBlacklist.add(ip);
  logger.info(`IP已加入黑名单: ${ip}`);
}

export function removeFromBlacklist(ip: string): void {
  ipBlacklist.delete(ip);
}

export function ipBlacklistMiddleware(req: Request, res: Response, next: NextFunction) {
  if (ipBlacklist.has(req.ip || '')) {
    logger.warn(`黑名单IP访问: ${req.ip}`);
    return res.status(403).json({
      success: false,
      error: '访问被拒绝',
    });
  }
  next();
}

/**
 * 并发请求限制
 */
const concurrentRequests = new Map<string, number>();
const MAX_CONCURRENT = 10;

export function concurrencyLimit(req: Request, res: Response, next: NextFunction) {
  const key = (req as any).user?.id || req.ip || 'unknown';
  const current = concurrentRequests.get(key) || 0;

  if (current >= MAX_CONCURRENT) {
    logger.warn(`并发限制触发: ${key}`);
    return res.status(429).json({
      success: false,
      error: '请求过多，请稍后再试',
    });
  }

  concurrentRequests.set(key, current + 1);

  res.on('finish', () => {
    const count = concurrentRequests.get(key) || 1;
    if (count <= 1) {
      concurrentRequests.delete(key);
    } else {
      concurrentRequests.set(key, count - 1);
    }
  });

  next();
}

/**
 * 定期清理过期数据
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userRateLimits) {
    if (now > value.resetAt) {
      userRateLimits.delete(key);
    }
  }
}, 60 * 1000);
