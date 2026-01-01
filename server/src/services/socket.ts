/**
 * WebSocket服务
 * 用于实时消息推送
 */

import { Server as SocketServer, Socket } from 'socket.io';
import { AuthService } from './auth';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

const authService = new AuthService();

// 在线用户映射 userId -> socketId
const onlineUsers = new Map<string, string>();

export function initSocketServer(io: SocketServer) {
  // 认证中间件
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('未提供认证令牌'));
      }

      const payload = authService.verifyAccessToken(token as string);
      socket.userId = payload.userId;
      next();
    } catch (error) {
      next(new Error('认证失败'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    logger.info(`用户连接: ${userId}`);

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
        const { receiverId, type, content, extra } = data;

        // 保存消息到数据库
        const message = await prisma.message.create({
          data: {
            senderId: userId,
            receiverId,
            type: type || 'text',
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
      } catch (error) {
        logger.error('发送消息失败:', error);
        socket.emit('chat:error', { message: '发送失败' });
      }
    });

    // 标记消息已读
    socket.on('chat:read', async (data) => {
      try {
        const { senderId } = data;

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
      socket.join(`order:${orderId}`);
    });

    socket.on('order:unsubscribe', (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    // ==================== 通话相关 ====================

    // 发起通话
    socket.on('call:initiate', async (data) => {
      const { receiverId, type } = data; // type: voice/video

      // 检查对方是否在线
      const receiverOnline = onlineUsers.has(receiverId);

      if (!receiverOnline) {
        socket.emit('call:error', { message: '对方不在线' });
        return;
      }

      // 通知对方有来电
      io.to(`user:${receiverId}`).emit('call:incoming', {
        callerId: userId,
        type,
      });

      socket.emit('call:ringing', { receiverId });
    });

    // 接听通话
    socket.on('call:accept', (data) => {
      const { callerId } = data;
      io.to(`user:${callerId}`).emit('call:accepted', { userId });
    });

    // 拒绝通话
    socket.on('call:reject', (data) => {
      const { callerId, reason } = data;
      io.to(`user:${callerId}`).emit('call:rejected', { userId, reason });
    });

    // 结束通话
    socket.on('call:end', (data) => {
      const { peerId } = data;
      io.to(`user:${peerId}`).emit('call:ended', { userId });
    });

    // ==================== 断开连接 ====================

    socket.on('disconnect', () => {
      logger.info(`用户断开: ${userId}`);
      onlineUsers.delete(userId);
      updateOnlineStatus(userId, false);
    });
  });

  logger.info('WebSocket服务已初始化');
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
        },
      });
    }
  } catch (error) {
    logger.error('更新在线状态失败:', error);
  }
}

/**
 * 发送系统通知
 */
export function sendNotification(userId: string, notification: any, io: SocketServer) {
  io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * 广播订单状态变更
 */
export function broadcastOrderUpdate(orderId: string, status: string, io: SocketServer) {
  io.to(`order:${orderId}`).emit('order:updated', { orderId, status });
}
