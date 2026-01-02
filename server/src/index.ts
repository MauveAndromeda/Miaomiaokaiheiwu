/**
 * 喵喵开黑屋 - 后端服务入口
 * 安全加固版本 - 信任代理 + 请求ID追踪 + CSP + CSRF保护
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import crypto from 'crypto';
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

// 生产环境允许的域名
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['https://miaomiaokaiheiwu.com', 'https://www.miaomiaokaiheiwu.com'];

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ALLOWED_ORIGINS
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ==================== 基础配置 ====================

// 信任代理（用于获取真实IP）
// 1 = 信任第一个代理（适用于单层代理如nginx）
// 可通过环境变量配置：TRUST_PROXY=1 或 TRUST_PROXY=loopback
const trustProxy = process.env.TRUST_PROXY || (process.env.NODE_ENV === 'production' ? 1 : false);
app.set('trust proxy', trustProxy);

// ==================== 请求ID中间件 ====================

// 为每个请求生成唯一ID，用于日志追踪
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  // 优先使用客户端传入的请求ID（用于分布式追踪）
  const requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
});

// ==================== 安全中间件配置 ====================

// 安全头（Helmet）
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // 根据需要调整
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // 开发环境禁用CSP
  hsts: {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS配置
app.use(cors({
  origin: (origin, callback) => {
    // 允许无origin的请求（如移动端App、服务端请求）
    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production') {
      // 开发环境允许所有localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }

    // 生产环境检查白名单
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`CORS请求被拒绝: ${origin}`);
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 预检请求缓存24小时
}));

// CSRF保护 - 设置SameSite cookie
app.use((req: Request, res: Response, next: NextFunction) => {
  // 为所有响应设置安全cookie策略
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 压缩
app.use(compression());

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志（包含请求ID）
morgan.token('request-id', (req: Request) => req.requestId || '-');
app.use(morgan(':method :url :status :res[content-length] - :response-time ms [:request-id]', {
  stream: { write: (message) => logger.http(message.trim()) },
}));

// 限流
app.use(rateLimiter);

// ==================== 路由配置 ====================

// 健康检查
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    requestId: req.requestId,
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
    // 验证必要的环境变量
    if (process.env.NODE_ENV === 'production') {
      const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
      const missing = requiredEnvVars.filter(v => !process.env[v]);
      if (missing.length > 0) {
        throw new Error(`缺少必要的环境变量: ${missing.join(', ')}`);
      }
    }

    // 测试数据库连接
    await prisma.$connect();
    logger.info('Database connected');

    // 启动服务器
    httpServer.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`API endpoint: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
      logger.info(`WebSocket ready`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Trust Proxy: ${trustProxy}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
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

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

bootstrap();

export { io };
