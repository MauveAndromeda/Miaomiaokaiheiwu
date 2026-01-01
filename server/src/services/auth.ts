/**
 * 认证服务
 */

import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/errors';

interface TokenPayload {
  userId: string;
  phone: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  generateTokens(payload: TokenPayload): Tokens {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: '2h',
    });

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 2 * 60 * 60, // 2小时（秒）
    };
  }

  /**
   * 验证访问令牌
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'Token已过期');
      }
      throw new ApiError(401, 'Token无效');
    }
  }

  /**
   * 刷新令牌
   */
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as TokenPayload & { type: string };

      if (decoded.type !== 'refresh') {
        throw new ApiError(401, '无效的刷新令牌');
      }

      return this.generateTokens({
        userId: decoded.userId,
        phone: decoded.phone,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, '刷新令牌已过期，请重新登录');
      }
      throw new ApiError(401, '刷新令牌无效');
    }
  }
}
