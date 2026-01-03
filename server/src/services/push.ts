/**
 * 推送通知服务
 * 支持极光推送 / 个推 / Firebase
 */

import { logger } from '../utils/logger';

interface PushConfig {
  provider: 'jpush' | 'getui' | 'firebase';
  appKey: string;
  masterSecret: string;
  production?: boolean;
}

interface PushMessage {
  title: string;
  content: string;
  extras?: Record<string, any>;
  badge?: number;
  sound?: string;
}

interface PushTarget {
  userId?: string;
  userIds?: string[];
  tags?: string[];
  alias?: string[];
  all?: boolean;
}

interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class PushService {
  private config: PushConfig | null = null;
  private readonly isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';

    if (process.env.PUSH_APP_KEY && process.env.PUSH_MASTER_SECRET) {
      this.config = {
        provider: (process.env.PUSH_PROVIDER as any) || 'jpush',
        appKey: process.env.PUSH_APP_KEY,
        masterSecret: process.env.PUSH_MASTER_SECRET,
        production: !this.isDev,
      };
      logger.info(`推送服务已配置: ${this.config.provider}`);
    } else {
      logger.warn('推送服务未配置');
    }
  }

  /**
   * 发送推送通知给单个用户
   */
  async sendToUser(userId: string, message: PushMessage): Promise<PushResult> {
    return this.send({ userId }, message);
  }

  /**
   * 发送推送通知给多个用户
   */
  async sendToUsers(userIds: string[], message: PushMessage): Promise<PushResult> {
    return this.send({ userIds }, message);
  }

  /**
   * 发送推送通知给所有用户
   */
  async sendToAll(message: PushMessage): Promise<PushResult> {
    return this.send({ all: true }, message);
  }

  /**
   * 发送推送通知给标签用户
   */
  async sendToTags(tags: string[], message: PushMessage): Promise<PushResult> {
    return this.send({ tags }, message);
  }

  /**
   * 核心发送方法
   */
  private async send(target: PushTarget, message: PushMessage): Promise<PushResult> {
    // 开发模式下模拟发送
    if (this.isDev || !this.config) {
      logger.info('[DEV] 推送通知:', { target, message });
      return {
        success: true,
        messageId: `dev_msg_${Date.now()}`,
      };
    }

    try {
      switch (this.config.provider) {
        case 'jpush':
          return await this.sendViaJPush(target, message);
        case 'getui':
          return await this.sendViaGetui(target, message);
        case 'firebase':
          return await this.sendViaFirebase(target, message);
        default:
          throw new Error(`不支持的推送服务: ${this.config.provider}`);
      }
    } catch (error) {
      logger.error('推送发送失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '推送失败',
      };
    }
  }

  /**
   * 极光推送
   */
  private async sendViaJPush(target: PushTarget, message: PushMessage): Promise<PushResult> {
    const JPush = require('jpush-sdk');

    const client = JPush.buildClient(
      this.config!.appKey,
      this.config!.masterSecret
    );

    let audience: any;
    if (target.all) {
      audience = JPush.ALL;
    } else if (target.userId) {
      audience = JPush.alias(target.userId);
    } else if (target.userIds) {
      audience = JPush.alias(...target.userIds);
    } else if (target.tags) {
      audience = JPush.tag(...target.tags);
    }

    const notification = JPush.android(message.content, message.title, null, message.extras)
      .ios(message.content, message.sound || 'default', message.badge, null, message.extras);

    const payload = client.push()
      .setPlatform(JPush.ALL)
      .setAudience(audience)
      .setNotification(notification)
      .setOptions(null, 60, null, !this.config!.production);

    return new Promise((resolve) => {
      payload.send((err: any, res: any) => {
        if (err) {
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, messageId: res.msg_id });
        }
      });
    });
  }

  /**
   * 个推推送
   */
  private async sendViaGetui(target: PushTarget, message: PushMessage): Promise<PushResult> {
    const GeTui = require('getui-push');

    const options = {
      appId: this.config!.appKey,
      appSecret: this.config!.masterSecret,
      appKey: process.env.GETUI_APP_KEY,
      masterSecret: this.config!.masterSecret,
    };

    const client = new GeTui(options);

    const template = {
      title: message.title,
      body: message.content,
      payload: JSON.stringify(message.extras || {}),
    };

    let result;
    if (target.all) {
      result = await client.pushToApp(template);
    } else if (target.userId || target.userIds) {
      const cids = target.userIds || [target.userId!];
      result = await client.pushToSingle(cids, template);
    }

    return {
      success: result?.code === 'Success',
      messageId: result?.taskId,
    };
  }

  /**
   * Firebase 推送
   */
  private async sendViaFirebase(target: PushTarget, message: PushMessage): Promise<PushResult> {
    const admin = require('firebase-admin');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }

    const notification = {
      title: message.title,
      body: message.content,
    };

    let response;
    if (target.all) {
      response = await admin.messaging().send({
        topic: 'all',
        notification,
        data: message.extras,
      });
    } else if (target.userId) {
      response = await admin.messaging().send({
        token: target.userId, // 需要是FCM token
        notification,
        data: message.extras,
      });
    } else if (target.userIds) {
      response = await admin.messaging().sendMulticast({
        tokens: target.userIds,
        notification,
        data: message.extras,
      });
    }

    return {
      success: true,
      messageId: response,
    };
  }

  /**
   * 设置用户标签
   */
  async setUserTags(userId: string, tags: string[]): Promise<boolean> {
    if (this.isDev || !this.config) {
      logger.info(`[DEV] 设置用户标签: ${userId} -> ${tags.join(', ')}`);
      return true;
    }

    try {
      if (this.config.provider === 'jpush') {
        const JPush = require('jpush-sdk');
        const client = JPush.buildClient(this.config.appKey, this.config.masterSecret);

        return new Promise((resolve) => {
          client.updateDeviceTagAlias(null, userId, tags, null, (err: any) => {
            resolve(!err);
          });
        });
      }

      return true;
    } catch (error) {
      logger.error('设置用户标签失败:', error);
      return false;
    }
  }

  /**
   * 发送订单相关通知
   */
  async sendOrderNotification(userId: string, orderStatus: string, orderInfo: any): Promise<void> {
    const statusMessages: Record<string, { title: string; content: string }> = {
      pending: { title: '订单待支付', content: '您的订单已创建，请尽快完成支付' },
      paid: { title: '支付成功', content: '您的订单已支付成功，等待教练接单' },
      accepted: { title: '订单已接单', content: '教练已接受您的订单，即将开始指导' },
      in_progress: { title: '指导进行中', content: '您的电竞指导服务已开始' },
      completed: { title: '指导完成', content: '本次指导服务已完成，欢迎评价' },
      cancelled: { title: '订单已取消', content: '您的订单已取消' },
      refunded: { title: '退款成功', content: '您的订单已成功退款' },
    };

    const msg = statusMessages[orderStatus];
    if (msg) {
      await this.sendToUser(userId, {
        ...msg,
        extras: {
          type: 'order',
          orderId: orderInfo.id,
          status: orderStatus,
        },
      });
    }
  }

  /**
   * 发送聊天消息通知
   */
  async sendChatNotification(userId: string, senderId: string, senderName: string, content: string): Promise<void> {
    await this.sendToUser(userId, {
      title: senderName,
      content: content.length > 50 ? content.substring(0, 50) + '...' : content,
      extras: {
        type: 'chat',
        senderId,
      },
    });
  }

  /**
   * 发送系统公告
   */
  async sendSystemAnnouncement(title: string, content: string): Promise<void> {
    await this.sendToAll({
      title,
      content,
      extras: {
        type: 'announcement',
      },
    });
  }
}

export const pushService = new PushService();
