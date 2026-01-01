/**
 * 喵喵开黑屋 - 后端服务入口
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler, notFoundHandler } from './middleware/error';
import { rateLimiter } from './middleware/rateLimit';
import routes from './routes';
import { initSocketServer } from './services/socket';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';

// 加载环境变量
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://yourdomain.com']
      : ['http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// ==================== 中间件配置 ====================

// 安全头
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://yourdomain.com']
    : true,
  credentials: true,
}));

// 压缩
app.use(compression());

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志
app.use(morgan('combined', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// 限流
app.use(rateLimiter);

// ==================== 路由配置 ====================

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API路由
app.use(process.env.API_PREFIX || '/api/v1', routes);

// 404处理
app.use(notFoundHandler);

// 错误处理
app.use(errorHandler);

// ==================== Socket.io 初始化 ====================

initSocketServer(io);

// ==================== 服务器启动 ====================

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    // 测试数据库连接
    await prisma.$connect();
    logger.info('✅ Database connected');

    // 启动服务器
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`📡 API endpoint: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
      logger.info(`🔌 WebSocket ready`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

bootstrap();

export { io };
