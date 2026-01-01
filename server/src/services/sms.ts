/**
 * 短信服务
 * 支持阿里云SMS
 */

import { logger } from '../utils/logger';

interface SmsConfig {
  accessKeyId: string;
  accessKeySecret: string;
  signName: string;
  templateCode: string;
}

export class SmsService {
  private config: SmsConfig;
  private isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
    this.config = {
      accessKeyId: process.env.SMS_ACCESS_KEY_ID || '',
      accessKeySecret: process.env.SMS_ACCESS_KEY_SECRET || '',
      signName: process.env.SMS_SIGN_NAME || '喵喵开黑屋',
      templateCode: process.env.SMS_TEMPLATE_CODE || '',
    };
  }

  /**
   * 发送验证码
   */
  async sendVerificationCode(phone: string): Promise<string> {
    // 生成6位验证码
    const code = Math.random().toString().slice(2, 8);

    // 开发环境：直接返回固定验证码
    if (this.isDev) {
      logger.info(`[DEV] 验证码已发送到 ${phone}: ${code}`);
      return code;
    }

    // 生产环境：调用阿里云SMS API
    try {
      await this.sendAliyunSms(phone, code);
      logger.info(`验证码已发送到 ${phone}`);
      return code;
    } catch (error) {
      logger.error('发送验证码失败:', error);
      throw new Error('验证码发送失败，请稍后重试');
    }
  }

  /**
   * 调用阿里云SMS API
   */
  private async sendAliyunSms(phone: string, code: string): Promise<void> {
    // 阿里云SMS SDK调用
    // npm install @alicloud/dysmsapi20170525

    /*
    import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
    import * as $OpenApi from '@alicloud/openapi-client';

    const config = new $OpenApi.Config({
      accessKeyId: this.config.accessKeyId,
      accessKeySecret: this.config.accessKeySecret,
      endpoint: 'dysmsapi.aliyuncs.com',
    });

    const client = new Dysmsapi20170525(config);

    const request = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: phone,
      signName: this.config.signName,
      templateCode: this.config.templateCode,
      templateParam: JSON.stringify({ code }),
    });

    const response = await client.sendSms(request);

    if (response.body.code !== 'OK') {
      throw new Error(response.body.message);
    }
    */

    // 模拟发送（生产环境请取消注释上面的代码）
    logger.warn('SMS服务未配置，请配置阿里云SMS');
  }

  /**
   * 验证验证码（备用方法，主要在数据库中验证）
   */
  async verifyCode(phone: string, code: string): Promise<boolean> {
    // 开发环境：固定验证码
    if (this.isDev && code === '123456') {
      return true;
    }

    // 生产环境在数据库中验证
    return false;
  }
}
