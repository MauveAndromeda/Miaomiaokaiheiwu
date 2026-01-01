/**
 * API 客户端配置
 * 支持连接真实后端或使用Mock数据
 */

// Socket.io 类型定义（避免依赖未安装时的类型错误）
type SocketType = {
  connected: boolean;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  emit: (event: string, data?: unknown) => void;
  disconnect: () => void;
  onAny: (callback: (event: string, ...args: unknown[]) => void) => void;
};

// 动态导入 socket.io-client
let io: ((url: string, options: Record<string, unknown>) => SocketType) | null = null;

// 尝试加载 socket.io-client
if (typeof window !== 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const socketIo = require('socket.io-client');
    io = socketIo.io;
  } catch {
    console.warn('socket.io-client 未安装，WebSocket 功能不可用');
  }
}

// ==================== 配置 ====================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
const IS_DEV = process.env.NEXT_PUBLIC_ENV === 'development';

// 是否使用Mock数据
// 生产环境默认关闭，开发环境可通过环境变量启用
// 设置 NEXT_PUBLIC_USE_MOCK=true 启用Mock模式
let USE_MOCK: boolean = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// ==================== HTTP 客户端 ====================

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // 从localStorage恢复token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, timeout = 10000 } = config;

    const url = `${this.baseUrl}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (this.token) {
      requestHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(response.status, data.error || '请求失败', data);
      }

      return data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, '请求超时');
      }

      if (error instanceof ApiError) {
        throw error;
      }

      // 网络错误，可能后端未启动，启用Mock模式
      const errorMessage = error instanceof Error ? error.message : '';
      if (IS_DEV && errorMessage.includes('fetch')) {
        console.warn('后端未连接，启用Mock模式');
        USE_MOCK = true;
        throw new ApiError(0, '后端服务未启动，已切换到Mock模式');
      }

      throw new ApiError(500, errorMessage || '网络错误');
    }
  }

  // 便捷方法
  get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// API错误类
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = 'ApiError';
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient(API_BASE_URL);

// ==================== WebSocket 客户端 ====================

type ListenerFn = (...args: unknown[]) => void;

class SocketClient {
  private socket: SocketType | null = null;
  private listeners: Map<string, Set<ListenerFn>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    if (!io) {
      console.warn('socket.io-client 未加载，无法连接 WebSocket');
      return;
    }

    this.socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', (reason: unknown) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
    });

    // 转发所有事件到监听器
    this.socket.onAny((event: string, ...args: unknown[]) => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach((listener) => listener(...args));
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, listener: ListenerFn): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // 返回取消监听函数
    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  off(event: string, listener?: ListenerFn): void {
    if (listener) {
      this.listeners.get(event)?.delete(listener);
    } else {
      this.listeners.delete(event);
    }
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }
}

// 创建Socket客户端实例
export const socketClient = new SocketClient();

// ==================== 检查是否使用Mock ====================

export function shouldUseMock(): boolean {
  return USE_MOCK;
}

export function setUseMock(value: boolean): void {
  USE_MOCK = value;
}

// ==================== 导出配置 ====================

export const config = {
  apiBaseUrl: API_BASE_URL,
  wsUrl: WS_URL,
  isDev: IS_DEV,
};
