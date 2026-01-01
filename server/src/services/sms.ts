/**
 * 短信服务
 * 支持阿里云SMS / 腾讯云SMS
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';

interface SmsConfig {
  provider: 'aliyun' | 'tencent';
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
  region?: string;
}

interface VerificationCode {
  code: string;
  phone: string;
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

// 验证码存储（生产环境应使用Redis）
const verificationCodes = new Map<string, VerificationCode>();

// 发送频率限制
const sendLimits = new Map<string, { count: number; resetAt: number }>();

export class SmsService {
  private config: SmsConfig | null = null;
  private isDev: boolean;
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRE_MINUTES = 5;
  private readonly MAX_ATTEMPTS = 5;
  private readonly SEND_LIMIT_PER_HOUR = 5;
  private readonly SEND_LIMIT_PER_DAY = 10;

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';

    // 加载配置
    if (process.env.SMS_ACCESS_KEY_ID && process.env.SMS_ACCESS_KEY_SECRET) {
      this.config = {
        provider: (process.env.SMS_PROVIDER as 'aliyun' | 'tencent') || 'aliyun',
        accessKeyId: process.env.SMS_ACCESS_KEY_ID,
        accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET,
        signName: process.env.SMS_SIGN_NAME || '喵喵开黑屋',
        templateCode: process.env.SMS_TEMPLATE_CODE || '',
        region: process.env.SMS_REGION || 'cn-hangzhou',
      };
      logger.info(`SMS服务已配置: ${this.config.provider}`);
    } else {
      logger.warn('SMS服务未配置，将使用开发模式（验证码:123456）');
    }

    // 定期清理过期验证码
    setInterval(() => this.cleanupExpiredCodes(), 60 * 1000);
  }

  /**
   * 生成安全的验证码
   */
  private generateSecureCode(): string {
    const min = Math.pow(10, this.CODE_LENGTH - 1);
    const max = Math.pow(10, this.CODE_LENGTH) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * 检查发送频率限制
   */
  private checkSendLimit(phone: string): void {
    const now = Date.now();
    const hourKey = `${phone}_hour`;
    const dayKey = `${phone}_day`;

    const hourLimit = sendLimits.get(hourKey);
    if (hourLimit && now < hourLimit.resetAt && hourLimit.count >= this.SEND_LIMIT_PER_HOUR) {
      throw new ApiError(429, '发送过于频繁，请1小时后再试');
    }

    const dayLimit = sendLimits.get(dayKey);
    if (dayLimit && now < dayLimit.resetAt && dayLimit.count >= this.SEND_LIMIT_PER_DAY) {
      throw new ApiError(429, '今日发送次数已达上限');
    }
  }

  /**
   * 更新发送计数
   */
  private updateSendCount(phone: string): void {
    const now = Date.now();
    const hourKey = `${phone}_hour`;
    const dayKey = `${phone}_day`;

    const hourLimit = sendLimits.get(hourKey);
    if (hourLimit && now < hourLimit.resetAt) {
      hourLimit.count++;
    } else {
      sendLimits.set(hourKey, { count: 1, resetAt: now + 60 * 60 * 1000 });
    }

    const dayLimit = sendLimits.get(dayKey);
    if (dayLimit && now < dayLimit.resetAt) {
      dayLimit.count++;
    } else {
      sendLimits.set(dayKey, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    }
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(phone: string): Promise<string> {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      throw new ApiError(400, '手机号格式不正确');
    }

    this.checkSendLimit(phone);

    const existing = verificationCodes.get(phone);
    if (existing && Date.now() - existing.createdAt < 60 * 1000) {
      throw new ApiError(429, '请60秒后再试');
    }

    const code = this.generateSecureCode();
    const now = Date.now();

    verificationCodes.set(phone, {
      code,
      phone,
      createdAt: now,
      expiresAt: now + this.CODE_EXPIRE_MINUTES * 60 * 1000,
      attempts: 0,
    });

    this.updateSendCount(phone);

    if (this.isDev || !this.config) {
      logger.info(`[DEV] 验证码已发送到 ${phone}: ${code}`);
      return code;
    }

    try {
      if (this.config.provider === 'aliyun') {
        await this.sendAliyunSms(phone, code);
      } else {
        await this.sendTencentSms(phone, code);
      }
      logger.info(`验证码已发送到 ${phone}`);
      return code;
    } catch (error) {
      logger.error('短信发送失败:', error);
      verificationCodes.delete(phone);
      throw new ApiError(500, '短信发送失败，请稍后重试');
    }
  }

  /**
   * 验证验证码
   */
  verifyCode(phone: string, code: string): boolean {
    const stored = verificationCodes.get(phone);

    if (!stored) {
      throw new ApiError(400, '请先获取验证码');
    }

    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(phone);
      throw new ApiError(400, '验证码已过期');
    }

    if (stored.attempts >= this.MAX_ATTEMPTS) {
      verificationCodes.delete(phone);
      throw new ApiError(400, '验证码已失效，请重新获取');
    }

    stored.attempts++;

    if (this.isDev && code === '123456') {
      verificationCodes.delete(phone);
      return true;
    }

    try {
      const isValid = crypto.timingSafeEqual(
        Buffer.from(code.padStart(6, '0')),
        Buffer.from(stored.code.padStart(6, '0'))
      );

      if (isValid) {
        verificationCodes.delete(phone);
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }

  /**
   * 阿里云短信发送
   */
  private async sendAliyunSms(phone: string, code: string): Promise<void> {
    if (!this.config) throw new Error('SMS配置缺失');

    const Core = require('@alicloud/pop-core');

    const client = new Core({
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
      endpoint: 'https://dysmsapi.aliyuncs.com',
      apiVersion: '2017-05-25',
    });

    const params = {
      PhoneNumbers: phone,
      SignName: this.config.signName,
      TemplateCode: this.config.templateCode,
      TemplateParam: JSON.stringify({ code }),
    };

    const result = await client.request('SendSms', params, { method: 'POST' });

    if (result.Code !== 'OK') {
      throw new Error(result.Message || '短信发送失败');
    }
  }

  /**
   * 腾讯云短信发送
   */
  private async sendTencentSms(phone: string, code: string): Promise<void> {
    if (!this.config) throw new Error('SMS配置缺失');

    const tencentcloud = require('tencentcloud-sdk-nodejs');
    const SmsClient = tencentcloud.sms.v20210111.Client;

    const client = new SmsClient({
      credential: {
        secretId: this.config.accessKeyId,
        secretKey: this.config.accessKeySecret,
      },
      region: this.config.region || 'ap-guangzhou',
    });

    const params = {
      SmsSdkAppId: process.env.SMS_SDK_APP_ID,
      SignName: this.config.signName,
      TemplateId: this.config.templateCode,
      PhoneNumberSet: [`+86${phone}`],
      TemplateParamSet: [code, String(this.CODE_EXPIRE_MINUTES)],
    };

    const result = await client.SendSms(params);

    if (result.SendStatusSet?.[0]?.Code !== 'Ok') {
      throw new Error(result.SendStatusSet?.[0]?.Message || '短信发送失败');
    }
  }

  /**
   * 清理过期验证码
   */
  private cleanupExpiredCodes(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [phone, data] of verificationCodes) {
      if (now > data.expiresAt) {
        verificationCodes.delete(phone);
        cleaned++;
      }
    }

    for (const [key, data] of sendLimits) {
      if (now > data.resetAt) {
        sendLimits.delete(key);
      }
    }

    if (cleaned > 0) {
      logger.debug(`清理了 ${cleaned} 个过期验证码`);
    }
  }

  getCodeTTL(phone: string): number {
    const stored = verificationCodes.get(phone);
    if (!stored) return 0;
    return Math.max(0, Math.floor((stored.expiresAt - Date.now()) / 1000));
  }
}

export const smsService = new SmsService();
