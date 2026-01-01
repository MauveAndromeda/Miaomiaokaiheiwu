/**
 * 限流中间件
 */

import rateLimit from 'express-rate-limit';

/**
 * 通用API限流
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每IP最多100次请求
  message: {
    success: false,
    error: '请求过于频繁，请稍后再试',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 短信验证码限流
 */
export const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 1, // 每IP每分钟1次
  message: {
    success: false,
    error: '发送太频繁，请1分钟后再试',
  },
  keyGenerator: (req) => {
    // 按手机号+IP限流
    return `${req.body.phone || ''}_${req.ip}`;
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
});
