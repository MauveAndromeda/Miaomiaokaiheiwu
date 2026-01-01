/**
 * 实时音视频RTC服务
 * 支持声网Agora / 腾讯云TRTC / 即构ZEGO
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';

interface RTCConfig {
  provider: 'agora' | 'trtc' | 'zego';
  appId: string;
  appSecret: string;
  appSign?: string; // ZEGO专用
}

interface RTCToken {
  token: string;
  channelId: string;
  userId: string;
  expiresAt: number;
}

interface CallRecord {
  callId: string;
  channelId: string;
  callerId: string;
  receiverId: string;
  type: 'voice' | 'video';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'accepted' | 'rejected' | 'ended' | 'missed';
}

// 活跃通话记录
const activeCalls = new Map<string, CallRecord>();

export class RTCService {
  private config: RTCConfig | null = null;
  private readonly isDev: boolean;
  private readonly TOKEN_EXPIRE_SECONDS = 3600; // Token有效期1小时

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';

    if (process.env.RTC_APP_ID && process.env.RTC_APP_SECRET) {
      this.config = {
        provider: (process.env.RTC_PROVIDER as any) || 'agora',
        appId: process.env.RTC_APP_ID,
        appSecret: process.env.RTC_APP_SECRET,
        appSign: process.env.RTC_APP_SIGN,
      };
      logger.info(`RTC服务已配置: ${this.config.provider}`);
    } else {
      logger.warn('RTC服务未配置');
    }

    // 定期清理过期通话记录
    setInterval(() => this.cleanupExpiredCalls(), 60 * 1000);
  }

  /**
   * 生成频道ID
   */
  generateChannelId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return crypto.createHash('md5').update(sorted.join('_')).digest('hex').substring(0, 16);
  }

  /**
   * 生成RTC Token
   */
  async generateToken(userId: string, channelId: string): Promise<RTCToken> {
    const expireTime = Math.floor(Date.now() / 1000) + this.TOKEN_EXPIRE_SECONDS;

    if (this.isDev || !this.config) {
      logger.info(`[DEV] 生成RTC Token: userId=${userId}, channel=${channelId}`);
      return {
        token: `dev_token_${channelId}_${userId}_${expireTime}`,
        channelId,
        userId,
        expiresAt: expireTime * 1000,
      };
    }

    try {
      switch (this.config.provider) {
        case 'agora':
          return this.generateAgoraToken(userId, channelId, expireTime);
        case 'trtc':
          return this.generateTRTCToken(userId, channelId, expireTime);
        case 'zego':
          return this.generateZegoToken(userId, channelId, expireTime);
        default:
          throw new Error(`不支持的RTC服务: ${this.config.provider}`);
      }
    } catch (error) {
      logger.error('生成RTC Token失败:', error);
      throw error;
    }
  }

  /**
   * 生成声网Agora Token
   */
  private generateAgoraToken(userId: string, channelId: string, expireTime: number): RTCToken {
    const RtcTokenBuilder = require('agora-access-token').RtcTokenBuilder;
    const RtcRole = require('agora-access-token').RtcRole;

    // 将userId转换为整数UID（Agora要求）
    const uid = this.stringToUid(userId);

    const token = RtcTokenBuilder.buildTokenWithUid(
      this.config!.appId,
      this.config!.appSecret,
      channelId,
      uid,
      RtcRole.PUBLISHER,
      expireTime
    );

    return {
      token,
      channelId,
      userId,
      expiresAt: expireTime * 1000,
    };
  }

  /**
   * 生成腾讯云TRTC Token (UserSig)
   */
  private generateTRTCToken(userId: string, channelId: string, expireTime: number): RTCToken {
    const TLSSigAPIv2 = require('tls-sig-api-v2');

    const api = new TLSSigAPIv2.Api(
      parseInt(this.config!.appId),
      this.config!.appSecret
    );

    const token = api.genUserSig(userId, this.TOKEN_EXPIRE_SECONDS);

    return {
      token,
      channelId,
      userId,
      expiresAt: expireTime * 1000,
    };
  }

  /**
   * 生成即构ZEGO Token
   */
  private generateZegoToken(userId: string, channelId: string, expireTime: number): RTCToken {
    // ZEGO Token生成需要使用特定算法
    const payload = {
      app_id: parseInt(this.config!.appId),
      user_id: userId,
      nonce: Math.floor(Math.random() * 2147483647),
      ctime: Math.floor(Date.now() / 1000),
      expire: this.TOKEN_EXPIRE_SECONDS,
    };

    const payloadStr = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadStr).toString('base64');

    const hmac = crypto.createHmac('sha256', this.config!.appSecret);
    hmac.update(payloadStr);
    const signature = hmac.digest('base64');

    const token = `04${payloadBase64}.${signature}`;

    return {
      token,
      channelId,
      userId,
      expiresAt: expireTime * 1000,
    };
  }

  /**
   * 创建通话记录
   */
  createCall(callerId: string, receiverId: string, type: 'voice' | 'video'): CallRecord {
    const callId = crypto.randomBytes(16).toString('hex');
    const channelId = this.generateChannelId(callerId, receiverId);

    const call: CallRecord = {
      callId,
      channelId,
      callerId,
      receiverId,
      type,
      startTime: Date.now(),
      status: 'pending',
    };

    activeCalls.set(callId, call);
    logger.info(`创建通话: ${callId}, ${callerId} -> ${receiverId}, 类型: ${type}`);

    // 30秒未接听自动设为未接
    setTimeout(() => {
      const activeCall = activeCalls.get(callId);
      if (activeCall && activeCall.status === 'pending') {
        activeCall.status = 'missed';
        activeCall.endTime = Date.now();
        logger.info(`通话未接听: ${callId}`);
      }
    }, 30 * 1000);

    return call;
  }

  /**
   * 接听通话
   */
  acceptCall(callId: string): CallRecord | null {
    const call = activeCalls.get(callId);
    if (!call) {
      logger.warn(`通话不存在: ${callId}`);
      return null;
    }

    if (call.status !== 'pending') {
      logger.warn(`通话状态异常: ${callId}, status=${call.status}`);
      return null;
    }

    call.status = 'accepted';
    call.startTime = Date.now(); // 重置开始时间为实际通话开始时间
    logger.info(`通话已接听: ${callId}`);

    return call;
  }

  /**
   * 拒绝通话
   */
  rejectCall(callId: string): CallRecord | null {
    const call = activeCalls.get(callId);
    if (!call) return null;

    call.status = 'rejected';
    call.endTime = Date.now();
    logger.info(`通话已拒绝: ${callId}`);

    return call;
  }

  /**
   * 结束通话
   */
  endCall(callId: string): CallRecord | null {
    const call = activeCalls.get(callId);
    if (!call) return null;

    call.status = 'ended';
    call.endTime = Date.now();
    call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    logger.info(`通话已结束: ${callId}, 时长: ${call.duration}秒`);

    return call;
  }

  /**
   * 获取通话记录
   */
  getCall(callId: string): CallRecord | undefined {
    return activeCalls.get(callId);
  }

  /**
   * 获取用户当前通话
   */
  getUserActiveCall(userId: string): CallRecord | undefined {
    for (const call of activeCalls.values()) {
      if ((call.callerId === userId || call.receiverId === userId) &&
          (call.status === 'pending' || call.status === 'accepted')) {
        return call;
      }
    }
    return undefined;
  }

  /**
   * 清理过期通话记录
   */
  private cleanupExpiredCalls(): void {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2小时

    for (const [callId, call] of activeCalls) {
      if (call.endTime && now - call.endTime > maxAge) {
        activeCalls.delete(callId);
      } else if (!call.endTime && now - call.startTime > maxAge) {
        // 超时未结束的通话
        call.status = 'ended';
        call.endTime = now;
        activeCalls.delete(callId);
      }
    }
  }

  /**
   * 字符串转UID（用于Agora）
   */
  private stringToUid(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * 获取RTC服务配置信息（用于客户端）
   */
  getClientConfig(): { provider: string; appId: string } | null {
    if (!this.config) {
      return null;
    }
    return {
      provider: this.config.provider,
      appId: this.config.appId,
    };
  }

  /**
   * 计算通话费用（按分钟计费）
   */
  calculateCallCost(duration: number, type: 'voice' | 'video'): number {
    const ratePerMinute = type === 'voice' ? 1 : 2; // 语音1元/分钟，视频2元/分钟
    const minutes = Math.ceil(duration / 60);
    return minutes * ratePerMinute * 100; // 返回分
  }
}

export const rtcService = new RTCService();
