/**
 * 认证服务
 * 安全加固版本
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';

interface TokenPayload {
  userId: string;
  phone: string;
  iat?: number;
  exp?: number;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TokenBlacklist {
  [token: string]: number; // token -> expiry timestamp
}

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private tokenBlacklist: TokenBlacklist = {};
  private readonly isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';

    // 生产环境必须设置JWT_SECRET
    if (this.isProduction && !process.env.JWT_SECRET) {
      logger.error('CRITICAL: JWT_SECRET环境变量未设置！');
      throw new Error('生产环境必须设置JWT_SECRET环境变量');
    }

    // 使用强随机密钥作为开发环境默认值
    const devSecret = crypto.randomBytes(64).toString('hex');
    this.jwtSecret = process.env.JWT_SECRET || devSecret;

    if (!process.env.JWT_SECRET) {
      logger.warn('警告: 使用随机生成的JWT密钥，服务重启后所有token将失效');
    }

    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    // 定期清理过期的黑名单token
    setInterval(() => this.cleanupBlacklist(), 60 * 60 * 1000); // 每小时清理
  }

  /**
   * 生成安全的随机字符串
   */
  generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成访问令牌和刷新令牌
   */
  generateTokens(payload: TokenPayload): Tokens {
    const jti = this.generateSecureRandom(16); // JWT ID 防止重放攻击

    const accessToken = jwt.sign(
      { ...payload, jti, type: 'access' },
      this.jwtSecret,
      { expiresIn: '2h', algorithm: 'HS256' }
    );

    const refreshJti = this.generateSecureRandom(16);
    const refreshToken = jwt.sign(
      { ...payload, jti: refreshJti, type: 'refresh' },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn, algorithm: 'HS256' }
    );

    logger.info(`用户 ${payload.userId} 生成新token`);

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
    // 检查黑名单
    if (this.isTokenBlacklisted(token)) {
      throw new ApiError(401, 'Token已被撤销');
    }

    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload & { type: string; jti: string };

      if (decoded.type !== 'access') {
        throw new ApiError(401, 'Token类型错误');
      }

      return {
        userId: decoded.userId,
        phone: decoded.phone,
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, 'Token已过期');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new ApiError(401, 'Token无效');
      }
      throw new ApiError(401, 'Token验证失败');
    }
  }

  /**
   * 刷新令牌
   */
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    // 检查黑名单
    if (this.isTokenBlacklisted(refreshToken)) {
      throw new ApiError(401, '刷新令牌已被撤销');
    }

    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload & { type: string; jti: string };

      if (decoded.type !== 'refresh') {
        throw new ApiError(401, '无效的刷新令牌');
      }

      // 将旧的refreshToken加入黑名单（防止重复使用）
      this.blacklistToken(refreshToken);

      logger.info(`用户 ${decoded.userId} 刷新token`);

      return this.generateTokens({
        userId: decoded.userId,
        phone: decoded.phone,
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof jwt.TokenExpiredError) {
        throw new ApiError(401, '刷新令牌已过期，请重新登录');
      }
      throw new ApiError(401, '刷新令牌无效');
    }
  }

  /**
   * 撤销令牌（登出时使用）
   */
  revokeToken(token: string): void {
    this.blacklistToken(token);
    logger.info('Token已撤销');
  }

  /**
   * 将token加入黑名单
   */
  private blacklistToken(token: string): void {
    try {
      const decoded = jwt.decode(token) as { exp?: number };
      if (decoded?.exp) {
        this.tokenBlacklist[token] = decoded.exp;
      }
    } catch {
      // 忽略解码错误
    }
  }

  /**
   * 检查token是否在黑名单中
   */
  private isTokenBlacklisted(token: string): boolean {
    return token in this.tokenBlacklist;
  }

  /**
   * 清理过期的黑名单token
   */
  private cleanupBlacklist(): void {
    const now = Math.floor(Date.now() / 1000);
    let cleaned = 0;

    for (const [token, expiry] of Object.entries(this.tokenBlacklist)) {
      if (expiry < now) {
        delete this.tokenBlacklist[token];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`清理了 ${cleaned} 个过期的黑名单token`);
    }
  }

  /**
   * 验证密码强度
   */
  validatePasswordStrength(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: '密码长度至少8位' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: '密码需包含大写字母' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: '密码需包含小写字母' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: '密码需包含数字' };
    }
    return { valid: true };
  }

  /**
   * 生成密码哈希
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  /**
   * 验证密码
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const [salt, key] = hash.split(':');
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
        if (err) reject(err);
        resolve(key === derivedKey.toString('hex'));
      });
    });
  }
}

export const authService = new AuthService();
