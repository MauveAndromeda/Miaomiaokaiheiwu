/**
 * 监控和日志服务
 * 性能监控、错误追踪、业务指标
 */

import { logger } from '../utils/logger';

interface MetricData {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

interface ErrorReport {
  error: Error;
  context?: Record<string, any>;
  userId?: string;
  requestId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

// 指标存储（生产环境应使用时序数据库如InfluxDB/Prometheus）
const metrics: MetricData[] = [];
const MAX_METRICS = 10000;

// 错误计数器
const errorCounts = new Map<string, number>();

// API响应时间统计
const apiLatencies = new Map<string, number[]>();

export class MonitoringService {
  private readonly isDev: boolean;
  private readonly serviceName: string;

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
    this.serviceName = process.env.SERVICE_NAME || 'miaomiao-server';

    // 定期清理过期数据
    setInterval(() => this.cleanup(), 60 * 1000);

    // 定期输出统计信息
    setInterval(() => this.logStats(), 5 * 60 * 1000);
  }

  /**
   * 记录指标
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    metrics.push(metric);

    // 保持数组大小
    if (metrics.length > MAX_METRICS) {
      metrics.splice(0, metrics.length - MAX_METRICS);
    }

    // 开发模式下输出日志
    if (this.isDev) {
      logger.debug(`Metric: ${name}=${value}`, tags);
    }
  }

  /**
   * 记录计数器
   */
  incrementCounter(name: string, increment: number = 1, tags?: Record<string, string>): void {
    this.recordMetric(name, increment, { ...tags, type: 'counter' });
  }

  /**
   * 记录API请求
   */
  recordAPIRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
  ): void {
    // 记录延迟
    const key = `${method}:${path}`;
    if (!apiLatencies.has(key)) {
      apiLatencies.set(key, []);
    }
    const latencies = apiLatencies.get(key)!;
    latencies.push(duration);
    if (latencies.length > 1000) {
      latencies.splice(0, latencies.length - 1000);
    }

    // 记录指标
    this.recordMetric('api_request', 1, {
      method,
      path: this.normalizePath(path),
      status: statusCode.toString(),
      userId: userId || 'anonymous',
    });

    this.recordMetric('api_latency', duration, {
      method,
      path: this.normalizePath(path),
    });

    // 记录慢请求
    if (duration > 1000) {
      logger.warn(`慢请求: ${method} ${path} ${duration}ms`);
    }
  }

  /**
   * 记录错误
   */
  recordError(report: ErrorReport): void {
    const { error, context, userId, requestId, severity } = report;

    // 错误计数
    const errorKey = error.name || 'UnknownError';
    errorCounts.set(errorKey, (errorCounts.get(errorKey) || 0) + 1);

    // 记录指标
    this.recordMetric('error_count', 1, {
      type: errorKey,
      severity,
    });

    // 日志记录
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      userId,
      requestId,
      severity,
    };

    switch (severity) {
      case 'critical':
        logger.error('CRITICAL ERROR:', logData);
        // 生产环境发送告警
        this.sendAlert(error, logData);
        break;
      case 'high':
        logger.error('High severity error:', logData);
        break;
      case 'medium':
        logger.warn('Medium severity error:', logData);
        break;
      default:
        logger.info('Low severity error:', logData);
    }
  }

  /**
   * 记录业务事件
   */
  recordBusinessEvent(
    event: string,
    data?: Record<string, any>
  ): void {
    this.incrementCounter(`business_event.${event}`, 1, data as any);
    logger.info(`业务事件: ${event}`, data);
  }

  /**
   * 记录用户行为
   */
  recordUserAction(
    userId: string,
    action: string,
    details?: Record<string, any>
  ): void {
    this.incrementCounter(`user_action.${action}`, 1, { userId });
    logger.debug(`用户行为: ${userId} - ${action}`, details);
  }

  /**
   * 性能追踪
   */
  startTrace(operation: string): () => PerformanceMetric {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      const metric: PerformanceMetric = {
        operation,
        duration,
        success: true,
      };

      this.recordMetric('operation_duration', duration, { operation });

      return metric;
    };
  }

  /**
   * 异步操作追踪
   */
  async trace<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      this.recordMetric('operation_duration', duration, { operation, success: 'true' });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric('operation_duration', duration, { operation, success: 'false' });
      throw error;
    }
  }

  /**
   * 获取API延迟统计
   */
  getAPIStats(): Record<string, { avg: number; p95: number; p99: number; count: number }> {
    const stats: Record<string, any> = {};

    for (const [key, latencies] of apiLatencies) {
      if (latencies.length === 0) continue;

      const sorted = [...latencies].sort((a, b) => a - b);
      const count = sorted.length;
      const avg = sorted.reduce((a, b) => a + b, 0) / count;
      const p95 = sorted[Math.floor(count * 0.95)] || sorted[count - 1];
      const p99 = sorted[Math.floor(count * 0.99)] || sorted[count - 1];

      stats[key] = { avg: Math.round(avg), p95, p99, count };
    }

    return stats;
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(errorCounts);
  }

  /**
   * 获取系统健康状态
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    metrics: Record<string, any>;
  }> {
    const checks: Record<string, boolean> = {};

    // 检查数据库连接
    try {
      const { prisma } = await import('../utils/prisma');
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch {
      checks.database = false;
    }

    // 检查内存使用
    const memUsage = process.memoryUsage();
    const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
    checks.memory = heapUsedPercent < 0.9;

    // 检查错误率
    const totalErrors = [...errorCounts.values()].reduce((a, b) => a + b, 0);
    checks.errorRate = totalErrors < 100;

    // 计算总体状态
    const allHealthy = Object.values(checks).every(v => v);
    const anyUnhealthy = Object.values(checks).some(v => !v);

    return {
      status: allHealthy ? 'healthy' : anyUnhealthy ? 'degraded' : 'unhealthy',
      checks,
      metrics: {
        uptime: process.uptime(),
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
        },
        errorCount: totalErrors,
        apiStats: this.getAPIStats(),
      },
    };
  }

  /**
   * 发送告警（生产环境）
   */
  private sendAlert(error: Error, context: any): void {
    if (this.isDev) return;

    // 这里可以集成告警服务（钉钉/企业微信/Slack等）
    logger.error('[ALERT] Critical error occurred:', {
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
    });

    // 示例：发送钉钉告警
    /*
    const webhookUrl = process.env.DINGTALK_WEBHOOK;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msgtype: 'text',
          text: {
            content: `[告警] ${this.serviceName}\n错误: ${error.message}\n时间: ${new Date().toISOString()}`
          }
        })
      }).catch(e => logger.error('发送告警失败:', e));
    }
    */
  }

  /**
   * 标准化路径（移除动态参数）
   */
  private normalizePath(path: string): string {
    return path
      .replace(/\/[a-f0-9-]{36}/g, '/:id') // UUID
      .replace(/\/\d+/g, '/:id'); // 数字ID
  }

  /**
   * 定期清理
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    // 清理过期指标
    while (metrics.length > 0 && metrics[0].timestamp < oneHourAgo) {
      metrics.shift();
    }
  }

  /**
   * 输出统计信息
   */
  private logStats(): void {
    const stats = {
      metricsCount: metrics.length,
      errorStats: this.getErrorStats(),
      apiStats: this.getAPIStats(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      },
    };

    logger.info('服务统计信息:', stats);
  }
}

export const monitoringService = new MonitoringService();

/**
 * Express中间件 - 请求追踪
 */
export function requestTracker() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      monitoringService.recordAPIRequest(
        req.method,
        req.path,
        res.statusCode,
        duration,
        req.user?.id
      );
    });

    next();
  };
}

/**
 * Express中间件 - 错误追踪
 */
export function errorTracker() {
  return (err: Error, req: any, res: any, next: any) => {
    monitoringService.recordError({
      error: err,
      context: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
      },
      userId: req.user?.id,
      requestId: req.requestId,
      severity: res.statusCode >= 500 ? 'high' : 'medium',
    });

    next(err);
  };
}
