/**
 * 认证控制器
 */

import { Request, Response, NextFunction } from 'express';
import { SmsService } from '../services/sms';
import { AuthService } from '../services/auth';
import { prisma } from '../utils/prisma';
import { ApiError } from '../utils/errors';
import { generateNickname, generateAvatar } from '../utils/helpers';

export class AuthController {
  private smsService = new SmsService();
  private authService = new AuthService();

  /**
   * 发送验证码
   */
  sendCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone } = req.body;

      // 检查发送频率
      const lastCode = await prisma.verificationCode.findFirst({
        where: {
          phone,
          createdAt: {
            gte: new Date(Date.now() - 60 * 1000), // 1分钟内
          },
        },
      });

      if (lastCode) {
        throw new ApiError(429, '发送太频繁，请稍后再试');
      }

      // 生成并发送验证码
      const code = await this.smsService.sendVerificationCode(phone);

      // 存储验证码
      await prisma.verificationCode.create({
        data: {
          phone,
          code,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟后过期
        },
      });

      res.json({
        success: true,
        message: '验证码已发送',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 登录
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { phone, code } = req.body;

      // 验证验证码
      const verificationCode = await prisma.verificationCode.findFirst({
        where: {
          phone,
          code,
          isUsed: false,
          expiresAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (!verificationCode) {
        throw new ApiError(400, '验证码错误或已过期');
      }

      // 标记验证码已使用
      await prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { isUsed: true, usedAt: new Date() },
      });

      // 查找或创建用户
      let user = await prisma.user.findUnique({
        where: { phone },
      });

      const isNewUser = !user;

      if (!user) {
        // 创建新用户
        user = await prisma.user.create({
          data: {
            phone,
            nickname: generateNickname(),
            avatar: generateAvatar(),
          },
        });
      }

      // 更新登录信息
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          lastLoginIp: req.ip,
        },
      });

      // 生成Token
      const tokens = this.authService.generateTokens({
        userId: user.id,
        phone: user.phone,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            phone: user.phone,
            nickname: user.nickname,
            avatar: user.avatar,
            gender: user.gender,
            level: user.level,
            isVip: user.isVip,
            isCoach: user.isCoach,
            balance: user.balance,
          },
          tokens,
          isNewUser,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 刷新Token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError(400, '缺少refreshToken');
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * 退出登录
   */
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 这里可以实现Token黑名单或删除设备推送Token
      res.json({
        success: true,
        message: '已退出登录',
      });
    } catch (error) {
      next(error);
    }
  };
}
