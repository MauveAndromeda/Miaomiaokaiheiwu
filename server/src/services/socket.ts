/**
 * WebSocket服务
 * 安全加固版本 - 实时消息推送
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { authService } from './auth';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userPhone?: string;
  connectedAt?: number;
}

// 在线用户映射 userId -> socketId
const onlineUsers = new Map<string, string>();

// 连接频率限制
const connectionAttempts = new Map<string, { count: number; resetAt: number }>();

// 消息频率限制
const messageRateLimits = new Map<string, { count: number; resetAt: number }>();

// 最大连接尝试次数（每分钟）
const MAX_CONNECTION_ATTEMPTS = 10;
// 最大消息发送次数（每分钟）
const MAX_MESSAGES_PER_MINUTE = 60;

/**
 * 检查连接频率限制
 */
function checkConnectionLimit(ip: string): boolean {
  const now = Date.now();
  const limit = connectionAttempts.get(ip);

  if (limit && now < limit.resetAt) {
    if (limit.count >= MAX_CONNECTION_ATTEMPTS) {
      return false;
    }
    limit.count++;
  } else {
    connectionAttempts.set(ip, { count: 1, resetAt: now + 60 * 1000 });
  }

  return true;
}

/**
 * 检查消息频率限制
 */
function checkMessageLimit(userId: string): boolean {
  const now = Date.now();
  const limit = messageRateLimits.get(userId);

  if (limit && now < limit.resetAt) {
    if (limit.count >= MAX_MESSAGES_PER_MINUTE) {
      return false;
    }
    limit.count++;
  } else {
    messageRateLimits.set(userId, { count: 1, resetAt: now + 60 * 1000 });
  }

  return true;
}

/**
 * 验证输入数据
 */
function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // 移除潜在的恶意字符
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .substring(0, 10000); // 限制长度
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const key of Object.keys(input)) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}

export function initSocketServer(io: SocketServer) {
  // 定期清理过期的限流记录
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of connectionAttempts) {
      if (now > value.resetAt) connectionAttempts.delete(key);
    }
    for (const [key, value] of messageRateLimits) {
      if (now > value.resetAt) messageRateLimits.delete(key);
    }
  }, 60 * 1000);

  // 连接限制中间件
  io.use((socket, next) => {
    const ip = socket.handshake.address || 'unknown';
    if (!checkConnectionLimit(ip)) {
      logger.warn(`连接被限流: ${ip}`);
      return next(new Error('连接过于频繁，请稍后再试'));
    }
    next();
  });

  // 认证中间件
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        logger.warn('WebSocket连接缺少认证令牌');
        return next(new Error('未提供认证令牌'));
      }

      // 验证令牌长度和格式
      if (typeof token !== 'string' || token.length < 10 || token.length > 2000) {
        return next(new Error('令牌格式无效'));
      }

      const payload = authService.verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.userPhone = payload.phone;
      socket.connectedAt = Date.now();

      next();
    } catch (error) {
      logger.warn('WebSocket认证失败:', error);
      next(new Error('认证失败'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    logger.info(`用户连接: ${userId}`);

    // 检查是否已有连接（防止重复连接）
    const existingSocketId = onlineUsers.get(userId);
    if (existingSocketId) {
      // 断开旧连接
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('force_disconnect', { reason: '在其他设备登录' });
        existingSocket.disconnect(true);
      }
    }

    // 记录在线状态
    onlineUsers.set(userId, socket.id);

    // 加入用户专属房间
    socket.join(`user:${userId}`);

    // 更新用户在线状态
    updateOnlineStatus(userId, true);

    // ==================== 消息相关 ====================

    // 发送私聊消息
    socket.on('chat:send', async (data) => {
      try {
        // 频率限制检查
        if (!checkMessageLimit(userId)) {
          socket.emit('chat:error', { message: '发送消息过于频繁，请稍后再试' });
          return;
        }

        // 输入验证
        const sanitizedData = sanitizeInput(data);
        const { receiverId, type, content, extra } = sanitizedData;

        if (!receiverId || typeof receiverId !== 'string') {
          socket.emit('chat:error', { message: '接收者ID无效' });
          return;
        }

        if (!content || typeof content !== 'string' || content.length === 0) {
          socket.emit('chat:error', { message: '消息内容不能为空' });
          return;
        }

        if (content.length > 5000) {
          socket.emit('chat:error', { message: '消息内容过长' });
          return;
        }

        // 验证消息类型
        const validTypes = ['text', 'image', 'voice', 'video', 'file', 'location'];
        const messageType = validTypes.includes(type) ? type : 'text';

        // 保存消息到数据库
        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId,
            type: messageType,
            content,
            extra: extra ? JSON.stringify(extra) : null,
          },
        });

        // 发送给接收者
        io.to(`user:${receiverId}`).emit('chat:message', {
          id: message.id,
          senderId: userId,
          type: message.type,
          content: message.content,
          extra: message.extra ? JSON.parse(message.extra) : null,
          createdAt: message.createdAt,
        });

        // 确认发送成功
        socket.emit('chat:sent', { messageId: message.id });

        logger.debug(`消息发送: ${userId} -> ${receiverId}`);
      } catch (error) {
        logger.error('发送消息失败:', error);
        socket.emit('chat:error', { message: '发送失败' });
      }
    });

    // 标记消息已读
    socket.on('chat:read', async (data) => {
      try {
        const { senderId } = sanitizeInput(data);

        if (!senderId || typeof senderId !== 'string') {
          return;
        }

        await prisma.message.updateMany({
          where: {
            senderId,
            receiverId: userId,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });

        // 通知发送者消息已读
        io.to(`user:${senderId}`).emit('chat:read', { userId });
      } catch (error) {
        logger.error('标记已读失败:', error);
      }
    });

    // ==================== 订单相关 ====================

    // 订单状态变更通知
    socket.on('order:subscribe', (orderId: string) => {
      if (typeof orderId === 'string' && orderId.length < 50) {
        socket.join(`order:${orderId}`);
      }
    });

    socket.on('order:unsubscribe', (orderId: string) => {
      if (typeof orderId === 'string') {
        socket.leave(`order:${orderId}`);
      }
    });

    // ==================== 通话相关 ====================

    // 发起通话
    socket.on('call:initiate', async (data) => {
      const sanitizedData = sanitizeInput(data);
      const { receiverId, type } = sanitizedData;

      if (!receiverId || typeof receiverId !== 'string') {
        socket.emit('call:error', { message: '接收者ID无效' });
        return;
      }

      // 验证通话类型
      const callType = ['voice', 'video'].includes(type) ? type : 'voice';

      // 检查对方是否在线
      const receiverOnline = onlineUsers.has(receiverId);

      if (!receiverOnline) {
        socket.emit('call:error', { message: '对方不在线' });
        return;
      }

      // 生成通话ID
      const callId = crypto.randomBytes(16).toString('hex');

      // 通知对方有来电
      io.to(`user:${receiverId}`).emit('call:incoming', {
        callId,
        callerId: userId,
        type: callType,
      });

      socket.emit('call:ringing', { callId, receiverId });
    });

    // 接听通话
    socket.on('call:accept', (data) => {
      const { callerId, callId } = sanitizeInput(data);
      if (callerId && typeof callerId === 'string') {
        io.to(`user:${callerId}`).emit('call:accepted', { callId, userId });
      }
    });

    // 拒绝通话
    socket.on('call:reject', (data) => {
      const { callerId, callId, reason } = sanitizeInput(data);
      if (callerId && typeof callerId === 'string') {
        io.to(`user:${callerId}`).emit('call:rejected', {
          callId,
          userId,
          reason: reason || '对方已拒绝'
        });
      }
    });

    // 结束通话
    socket.on('call:end', (data) => {
      const { peerId, callId } = sanitizeInput(data);
      if (peerId && typeof peerId === 'string') {
        io.to(`user:${peerId}`).emit('call:ended', { callId, userId });
      }
    });

    // WebRTC 信令
    socket.on('rtc:offer', (data) => {
      const { peerId, offer, callId } = sanitizeInput(data);
      if (peerId && typeof peerId === 'string' && offer) {
        io.to(`user:${peerId}`).emit('rtc:offer', { callId, callerId: userId, offer });
      }
    });

    socket.on('rtc:answer', (data) => {
      const { peerId, answer, callId } = sanitizeInput(data);
      if (peerId && typeof peerId === 'string' && answer) {
        io.to(`user:${peerId}`).emit('rtc:answer', { callId, userId, answer });
      }
    });

    socket.on('rtc:ice-candidate', (data) => {
      const { peerId, candidate, callId } = sanitizeInput(data);
      if (peerId && typeof peerId === 'string' && candidate) {
        io.to(`user:${peerId}`).emit('rtc:ice-candidate', { callId, userId, candidate });
      }
    });

    // ==================== 心跳检测 ====================

    socket.on('ping', () => {
      socket.emit('pong', { serverTime: Date.now() });
    });

    // ==================== 断开连接 ====================

    socket.on('disconnect', (reason) => {
      logger.info(`用户断开: ${userId}, 原因: ${reason}`);

      // 只有当前socket是记录的socket才删除
      if (onlineUsers.get(userId) === socket.id) {
        onlineUsers.delete(userId);
        updateOnlineStatus(userId, false);
      }
    });

    socket.on('error', (error) => {
      logger.error(`Socket错误 (${userId}):`, error);
    });
  });

  logger.info('WebSocket服务已初始化（安全加固版）');
}

/**
 * 更新用户在线状态
 */
async function updateOnlineStatus(userId: string, isOnline: boolean) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isCoach: true },
    });

    if (user?.isCoach) {
      await prisma.coachProfile.update({
        where: { userId },
        data: {
          onlineStatus: isOnline ? 'online' : 'offline',
          ...(isOnline ? {} : { lastOnlineAt: new Date() }),
        },
      });
    }
  } catch (error) {
    logger.error('更新在线状态失败:', error);
  }
}

/**
 * 获取用户在线状态
 */
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

/**
 * 获取在线用户数量
 */
export function getOnlineUserCount(): number {
  return onlineUsers.size;
}

/**
 * 发送系统通知
 */
export function sendNotification(userId: string, notification: any, io: SocketServer) {
  io.to(`user:${userId}`).emit('notification', sanitizeInput(notification));
}

/**
 * 广播订单状态变更
 */
export function broadcastOrderUpdate(orderId: string, status: string, io: SocketServer) {
  io.to(`order:${orderId}`).emit('order:updated', { orderId, status });
}

/**
 * 发送给多个用户
 */
export function sendToUsers(userIds: string[], event: string, data: any, io: SocketServer) {
  for (const userId of userIds) {
    io.to(`user:${userId}`).emit(event, sanitizeInput(data));
  }
}
