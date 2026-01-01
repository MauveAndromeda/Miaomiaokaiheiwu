/**
 * 内容审核服务
 * 支持阿里云内容安全 / 腾讯云内容安全
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';

interface ModerationConfig {
  provider: 'aliyun' | 'tencent';
  accessKeyId: string;
  accessKeySecret: string;
  region?: string;
}

interface ModerationResult {
  pass: boolean;
  riskLevel: 'pass' | 'review' | 'block';
  labels: string[];
  suggestion: string;
  details?: any;
}

// 敏感词列表（基础过滤）
const sensitiveWords: string[] = [
  // 违禁词汇（示例，实际应从数据库加载）
  '赌博', '博彩', '六合彩', '色情', '裸聊',
  '代孕', '枪支', '毒品', '诈骗', '传销',
];

// 正则敏感模式
const sensitivePatterns: RegExp[] = [
  /微信[号:]?\s*[a-zA-Z0-9_-]+/gi,
  /QQ[号:]?\s*\d+/gi,
  /手机[号:]?\s*1[3-9]\d{9}/gi,
  /加我[微信|QQ]/gi,
  /私[聊|下|我]/gi,
];

export class ModerationService {
  private config: ModerationConfig | null = null;
  private readonly isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';

    if (process.env.MODERATION_ACCESS_KEY_ID && process.env.MODERATION_ACCESS_KEY_SECRET) {
      this.config = {
        provider: (process.env.MODERATION_PROVIDER as any) || 'aliyun',
        accessKeyId: process.env.MODERATION_ACCESS_KEY_ID,
        accessKeySecret: process.env.MODERATION_ACCESS_KEY_SECRET,
        region: process.env.MODERATION_REGION || 'cn-shanghai',
      };
      logger.info(`内容审核服务已配置: ${this.config.provider}`);
    } else {
      logger.warn('内容审核服务未配置，使用本地规则');
    }
  }

  /**
   * 审核文本内容
   */
  async moderateText(text: string): Promise<ModerationResult> {
    if (!text || text.trim().length === 0) {
      return { pass: true, riskLevel: 'pass', labels: [], suggestion: '' };
    }

    // 1. 本地敏感词过滤
    const localResult = this.localTextCheck(text);
    if (!localResult.pass) {
      return localResult;
    }

    // 2. 调用云服务审核（如果配置了）
    if (this.config && !this.isDev) {
      try {
        if (this.config.provider === 'aliyun') {
          return await this.aliyunTextModeration(text);
        } else {
          return await this.tencentTextModeration(text);
        }
      } catch (error) {
        logger.error('云审核服务调用失败，使用本地结果:', error);
      }
    }

    return localResult;
  }

  /**
   * 审核图片内容
   */
  async moderateImage(imageUrl: string): Promise<ModerationResult> {
    if (!imageUrl) {
      return { pass: false, riskLevel: 'block', labels: ['invalid'], suggestion: '图片地址无效' };
    }

    // 开发模式直接通过
    if (this.isDev || !this.config) {
      logger.info(`[DEV] 图片审核: ${imageUrl}`);
      return { pass: true, riskLevel: 'pass', labels: [], suggestion: '' };
    }

    try {
      if (this.config.provider === 'aliyun') {
        return await this.aliyunImageModeration(imageUrl);
      } else {
        return await this.tencentImageModeration(imageUrl);
      }
    } catch (error) {
      logger.error('图片审核失败:', error);
      return { pass: false, riskLevel: 'review', labels: ['error'], suggestion: '审核服务异常，需人工审核' };
    }
  }

  /**
   * 审核用户昵称
   */
  async moderateNickname(nickname: string): Promise<ModerationResult> {
    // 昵称长度检查
    if (nickname.length < 2 || nickname.length > 20) {
      return { pass: false, riskLevel: 'block', labels: ['length'], suggestion: '昵称长度应为2-20个字符' };
    }

    // 禁止纯数字或特殊字符
    if (/^[\d\s]+$/.test(nickname)) {
      return { pass: false, riskLevel: 'block', labels: ['format'], suggestion: '昵称不能为纯数字' };
    }

    // 禁止包含敏感词
    return this.moderateText(nickname);
  }

  /**
   * 审核用户简介
   */
  async moderateBio(bio: string): Promise<ModerationResult> {
    if (bio.length > 500) {
      return { pass: false, riskLevel: 'block', labels: ['length'], suggestion: '简介不能超过500字' };
    }

    return this.moderateText(bio);
  }

  /**
   * 本地文本检查
   */
  private localTextCheck(text: string): ModerationResult {
    const lowerText = text.toLowerCase();
    const foundWords: string[] = [];

    // 检查敏感词
    for (const word of sensitiveWords) {
      if (lowerText.includes(word.toLowerCase())) {
        foundWords.push(word);
      }
    }

    // 检查敏感模式
    for (const pattern of sensitivePatterns) {
      if (pattern.test(text)) {
        foundWords.push('联系方式');
        break;
      }
    }

    if (foundWords.length > 0) {
      return {
        pass: false,
        riskLevel: 'block',
        labels: foundWords,
        suggestion: `内容包含敏感词: ${foundWords.join(', ')}`,
      };
    }

    return { pass: true, riskLevel: 'pass', labels: [], suggestion: '' };
  }

  /**
   * 阿里云文本审核
   */
  private async aliyunTextModeration(text: string): Promise<ModerationResult> {
    const Core = require('@alicloud/pop-core');

    const client = new Core({
      accessKeyId: this.config!.accessKeyId,
      accessKeySecret: this.config!.accessKeySecret,
      endpoint: 'https://green.cn-shanghai.aliyuncs.com',
      apiVersion: '2022-03-02',
    });

    const params = {
      Service: 'chat_detection',
      ServiceParameters: JSON.stringify({
        content: text,
      }),
    };

    try {
      const result = await client.request('TextModeration', params, { method: 'POST' });

      if (result.Code === 200 && result.Data) {
        const labels = result.Data.labels || [];
        const riskLevel = labels.length === 0 ? 'pass' :
          labels.some((l: any) => l.label === 'block') ? 'block' : 'review';

        return {
          pass: riskLevel === 'pass',
          riskLevel,
          labels: labels.map((l: any) => l.label),
          suggestion: labels.map((l: any) => l.description).join('; '),
          details: result.Data,
        };
      }
    } catch (error) {
      logger.error('阿里云文本审核失败:', error);
    }

    return { pass: true, riskLevel: 'pass', labels: [], suggestion: '' };
  }

  /**
   * 腾讯云文本审核
   */
  private async tencentTextModeration(text: string): Promise<ModerationResult> {
    const tencentcloud = require('tencentcloud-sdk-nodejs');
    const TmsClient = tencentcloud.tms.v20201229.Client;

    const client = new TmsClient({
      credential: {
        secretId: this.config!.accessKeyId,
        secretKey: this.config!.accessKeySecret,
      },
      region: this.config!.region || 'ap-guangzhou',
    });

    try {
      const result = await client.TextModeration({
        Content: Buffer.from(text).toString('base64'),
      });

      const suggestion = result.Suggestion;
      const labels = result.Label ? [result.Label] : [];

      return {
        pass: suggestion === 'Pass',
        riskLevel: suggestion === 'Pass' ? 'pass' : suggestion === 'Review' ? 'review' : 'block',
        labels,
        suggestion: result.Keywords?.join(', ') || '',
        details: result,
      };
    } catch (error) {
      logger.error('腾讯云文本审核失败:', error);
    }

    return { pass: true, riskLevel: 'pass', labels: [], suggestion: '' };
  }

  /**
   * 阿里云图片审核
   */
  private async aliyunImageModeration(imageUrl: string): Promise<ModerationResult> {
    const Core = require('@alicloud/pop-core');

    const client = new Core({
      accessKeyId: this.config!.accessKeyId,
      accessKeySecret: this.config!.accessKeySecret,
      endpoint: 'https://green.cn-shanghai.aliyuncs.com',
      apiVersion: '2022-03-02',
    });

    const params = {
      Service: 'baselineCheck',
      ServiceParameters: JSON.stringify({
        imageUrl,
      }),
    };

    try {
      const result = await client.request('ImageModeration', params, { method: 'POST' });

      if (result.Code === 200 && result.Data) {
        const riskLevel = result.Data.RiskLevel || 'pass';

        return {
          pass: riskLevel === 'pass',
          riskLevel,
          labels: result.Data.Result?.map((r: any) => r.Label) || [],
          suggestion: '',
          details: result.Data,
        };
      }
    } catch (error) {
      logger.error('阿里云图片审核失败:', error);
    }

    return { pass: true, riskLevel: 'pass', labels: [], suggestion: '' };
  }

  /**
   * 腾讯云图片审核
   */
  private async tencentImageModeration(imageUrl: string): Promise<ModerationResult> {
    const tencentcloud = require('tencentcloud-sdk-nodejs');
    const ImsClient = tencentcloud.ims.v20201229.Client;

    const client = new ImsClient({
      credential: {
        secretId: this.config!.accessKeyId,
        secretKey: this.config!.accessKeySecret,
      },
      region: this.config!.region || 'ap-guangzhou',
    });

    try {
      const result = await client.ImageModeration({
        FileUrl: imageUrl,
      });

      const suggestion = result.Suggestion;
      const labels = result.Label ? [result.Label] : [];

      return {
        pass: suggestion === 'Pass',
        riskLevel: suggestion === 'Pass' ? 'pass' : suggestion === 'Review' ? 'review' : 'block',
        labels,
        suggestion: '',
        details: result,
      };
    } catch (error) {
      logger.error('腾讯云图片审核失败:', error);
    }

    return { pass: true, riskLevel: 'pass', labels: [], suggestion: '' };
  }

  /**
   * 替换敏感词为星号
   */
  maskSensitiveWords(text: string): string {
    let result = text;

    for (const word of sensitiveWords) {
      const regex = new RegExp(word, 'gi');
      result = result.replace(regex, '*'.repeat(word.length));
    }

    for (const pattern of sensitivePatterns) {
      result = result.replace(pattern, (match) => '*'.repeat(match.length));
    }

    return result;
  }

  /**
   * 添加自定义敏感词
   */
  addSensitiveWord(word: string): void {
    if (!sensitiveWords.includes(word)) {
      sensitiveWords.push(word);
    }
  }

  /**
   * 移除敏感词
   */
  removeSensitiveWord(word: string): void {
    const index = sensitiveWords.indexOf(word);
    if (index !== -1) {
      sensitiveWords.splice(index, 1);
    }
  }
}

export const moderationService = new ModerationService();
