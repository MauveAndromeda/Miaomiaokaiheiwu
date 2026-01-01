/**
 * API 服务层 - 统一的数据请求接口
 * 支持真实后端API和Mock数据双模式，自动降级
 */

import { Coach, Order, User, Conversation, Video, LiveRoom, Banner } from '@/types';
import { coaches, orders, conversations, videos, liveRooms, banners, defaultUser } from '@/data/mock';
import { apiClient, socketClient, shouldUseMock, setUseMock, ApiError } from '@/lib/apiClient';

// 模拟网络延迟（仅Mock模式）
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API 响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// 分页响应
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 服务端响应格式转换
function transformResponse<T>(response: any): ApiResponse<T> {
  if (response.success !== undefined) {
    return response;
  }
  return {
    success: true,
    data: response.data || response,
  };
}

// 错误处理包装器
async function apiCall<T>(
  realFn: () => Promise<T>,
  mockFn: () => Promise<ApiResponse<T>>
): Promise<ApiResponse<T>> {
  if (shouldUseMock()) {
    return mockFn();
  }

  try {
    const result = await realFn();
    return transformResponse(result);
  } catch (error) {
    if (error instanceof ApiError) {
      // 连接失败，切换到Mock模式
      if (error.status === 0 || error.status === 500) {
        console.warn('API调用失败，降级到Mock模式');
        setUseMock(true);
        return mockFn();
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: '未知错误' };
  }
}

// ==================== 教练相关 API ====================

export const coachApi = {
  // 获取推荐教练列表
  async getRecommended(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Coach>>> {
    const { page = 1, pageSize = 10 } = params || {};

    return apiCall(
      () => apiClient.get(`/coaches?page=${page}&limit=${pageSize}`),
      async () => {
        await delay(300);
        const start = (page - 1) * pageSize;
        const items = coaches.slice(start, start + pageSize);
        return {
          success: true,
          data: {
            items,
            total: coaches.length,
            page,
            pageSize,
            hasMore: start + pageSize < coaches.length,
          },
        };
      }
    );
  },

  // 获取在线教练
  async getOnline(): Promise<ApiResponse<Coach[]>> {
    return apiCall(
      () => apiClient.get('/coaches?online=true'),
      async () => {
        await delay(200);
        return {
          success: true,
          data: coaches.filter(c => c.isOnline),
        };
      }
    );
  },

  // 获取教练详情
  async getDetail(id: string): Promise<ApiResponse<Coach>> {
    return apiCall(
      () => apiClient.get(`/coaches/${id}`),
      async () => {
        await delay(200);
        const coach = coaches.find(c => c.id === id);
        if (!coach) {
          return { success: false, error: '教练不存在' };
        }
        return { success: true, data: coach };
      }
    );
  },

  // 搜索教练
  async search(keyword: string): Promise<ApiResponse<Coach[]>> {
    return apiCall(
      () => apiClient.get(`/coaches/search?q=${encodeURIComponent(keyword)}`),
      async () => {
        await delay(300);
        const results = coaches.filter(c =>
          c.nickname.includes(keyword) ||
          c.games.some(g => g.name.includes(keyword))
        );
        return { success: true, data: results };
      }
    );
  },

  // 关注/取消关注教练
  async toggleFollow(coachId: string, isFollow: boolean): Promise<ApiResponse<boolean>> {
    return apiCall(
      () => apiClient.post(`/users/follow/${coachId}`, { follow: isFollow }),
      async () => {
        await delay(200);
        return {
          success: true,
          data: isFollow,
          message: isFollow ? '关注成功' : '已取消关注',
        };
      }
    );
  },
};

// ==================== 订单相关 API ====================

export const orderApi = {
  // 获取订单列表
  async getList(status?: string): Promise<ApiResponse<Order[]>> {
    return apiCall(
      () => apiClient.get(`/orders${status && status !== 'all' ? `?status=${status}` : ''}`),
      async () => {
        await delay(300);
        let filtered = orders;
        if (status && status !== 'all') {
          filtered = orders.filter(o => o.status === status);
        }
        return { success: true, data: filtered };
      }
    );
  },

  // 创建订单
  async create(params: {
    coachId: string;
    serviceType: string;
    quantity: number;
    totalPrice: number;
  }): Promise<ApiResponse<Partial<Order>>> {
    return apiCall(
      () => apiClient.post('/orders', params),
      async () => {
        await delay(500);
        const coach = coaches.find(c => c.id === params.coachId);
        const newOrder: Partial<Order> = {
          id: `order_${Date.now()}`,
          orderNo: `NO${Date.now()}`,
          coachId: params.coachId,
          coach: coach,
          serviceType: params.serviceType as 'play' | 'voice' | 'video',
          status: 'pending_payment',
          quantity: params.quantity,
          totalPrice: params.totalPrice,
          createdAt: new Date().toISOString(),
        };
        return { success: true, data: newOrder, message: '订单创建成功' };
      }
    );
  },

  // 支付订单
  async pay(orderId: string, payMethod: string): Promise<ApiResponse<boolean>> {
    return apiCall(
      () => apiClient.post(`/orders/${orderId}/pay`, { method: payMethod }),
      async () => {
        await delay(800);
        return { success: true, data: true, message: '支付成功' };
      }
    );
  },

  // 取消订单
  async cancel(orderId: string): Promise<ApiResponse<boolean>> {
    return apiCall(
      () => apiClient.post(`/orders/${orderId}/cancel`),
      async () => {
        await delay(300);
        return { success: true, data: true, message: '订单已取消' };
      }
    );
  },

  // 评价订单
  async review(orderId: string, rating: number, content: string, tags: string[]): Promise<ApiResponse<boolean>> {
    return apiCall(
      () => apiClient.post(`/orders/${orderId}/review`, { rating, content, tags }),
      async () => {
        await delay(400);
        return { success: true, data: true, message: '评价成功' };
      }
    );
  },
};

// ==================== 用户相关 API ====================

export const userApi = {
  // 发送验证码
  async sendCode(phone: string): Promise<ApiResponse<boolean>> {
    return apiCall(
      () => apiClient.post('/auth/send-code', { phone }),
      async () => {
        await delay(300);
        return { success: true, data: true, message: '验证码已发送' };
      }
    );
  },

  // 登录
  async login(phone: string, code: string): Promise<ApiResponse<User & { token?: string }>> {
    return apiCall(
      async () => {
        const response: any = await apiClient.post('/auth/login', { phone, code });
        if (response.data?.token) {
          apiClient.setToken(response.data.token);
          // 连接WebSocket
          socketClient.connect(response.data.token);
        }
        return response;
      },
      async () => {
        await delay(500);
        // Mock模式：开发环境允许固定验证码
        const isDev = process.env.NODE_ENV === 'development';
        const validCode = isDev ? '123456' : null;

        if (!isDev) {
          return { success: false, error: '验证服务未配置' };
        }

        if (code !== validCode) {
          return { success: false, error: '验证码错误' };
        }
        return { success: true, data: defaultUser, message: '登录成功' };
      }
    );
  },

  // 获取用户信息
  async getProfile(): Promise<ApiResponse<User>> {
    return apiCall(
      () => apiClient.get('/users/profile'),
      async () => {
        await delay(200);
        return { success: true, data: defaultUser };
      }
    );
  },

  // 更新用户信息
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiCall(
      () => apiClient.put('/users/profile', data),
      async () => {
        await delay(300);
        return { success: true, data: { ...defaultUser, ...data } };
      }
    );
  },

  // 充值
  async recharge(amount: number, payMethod: string): Promise<ApiResponse<{ balance: number }>> {
    return apiCall(
      () => apiClient.post('/payment/recharge', { amount, method: payMethod }),
      async () => {
        await delay(600);
        return {
          success: true,
          data: { balance: defaultUser.balance + amount },
          message: '充值成功',
        };
      }
    );
  },

  // 登出
  async logout(): Promise<ApiResponse<boolean>> {
    apiClient.setToken(null);
    socketClient.disconnect();
    return { success: true, data: true };
  },
};

// ==================== 消息相关 API ====================

export const messageApi = {
  // 获取会话列表
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return apiCall(
      () => apiClient.get('/messages/conversations'),
      async () => {
        await delay(200);
        return { success: true, data: conversations };
      }
    );
  },

  // 获取聊天记录
  async getMessages(conversationId: string): Promise<ApiResponse<any[]>> {
    return apiCall(
      () => apiClient.get(`/messages/conversations/${conversationId}/messages`),
      async () => {
        await delay(200);
        return { success: true, data: [] };
      }
    );
  },

  // 发送消息
  async sendMessage(conversationId: string, content: string, type: string): Promise<ApiResponse<any>> {
    return apiCall(
      () => apiClient.post(`/messages/conversations/${conversationId}/messages`, { content, type }),
      async () => {
        await delay(100);
        return {
          success: true,
          data: {
            id: `msg_${Date.now()}`,
            content,
            type,
            senderId: 'self',
            createdAt: new Date().toISOString(),
          },
        };
      }
    );
  },

  // 实时消息订阅
  onNewMessage(callback: (message: any) => void) {
    return socketClient.on('new_message', callback);
  },

  // 发送实时消息
  sendRealtimeMessage(receiverId: string, content: string, type: string) {
    socketClient.emit('send_message', { receiverId, content, type });
  },
};

// ==================== 直播相关 API ====================

export const liveApi = {
  // 获取直播列表
  async getList(): Promise<ApiResponse<LiveRoom[]>> {
    return apiCall(
      () => apiClient.get('/live/rooms'),
      async () => {
        await delay(300);
        return { success: true, data: liveRooms };
      }
    );
  },

  // 获取直播详情
  async getDetail(roomId: string): Promise<ApiResponse<LiveRoom>> {
    return apiCall(
      () => apiClient.get(`/live/rooms/${roomId}`),
      async () => {
        await delay(200);
        const room = liveRooms.find(r => r.id === roomId);
        if (!room) {
          return { success: false, error: '直播间不存在' };
        }
        return { success: true, data: room };
      }
    );
  },

  // 进入直播间
  async enter(roomId: string): Promise<ApiResponse<boolean>> {
    return apiCall(
      () => apiClient.post(`/live/rooms/${roomId}/enter`),
      async () => {
        await delay(200);
        return { success: true, data: true };
      }
    );
  },

  // 发送弹幕
  async sendDanmaku(roomId: string, content: string): Promise<ApiResponse<boolean>> {
    // 使用WebSocket发送弹幕
    socketClient.emit('live_danmaku', { roomId, content });
    return { success: true, data: true };
  },

  // 送礼物
  async sendGift(roomId: string, giftId: string): Promise<ApiResponse<boolean>> {
    return apiCall(
      () => apiClient.post(`/live/rooms/${roomId}/gift`, { giftId }),
      async () => {
        await delay(300);
        return { success: true, data: true, message: '礼物发送成功' };
      }
    );
  },

  // 订阅直播间事件
  onDanmaku(callback: (data: any) => void) {
    return socketClient.on('live_danmaku', callback);
  },

  onGift(callback: (data: any) => void) {
    return socketClient.on('live_gift', callback);
  },

  onViewerUpdate(callback: (data: any) => void) {
    return socketClient.on('live_viewers', callback);
  },
};

// ==================== 视频相关 API ====================

export const videoApi = {
  // 获取视频流
  async getFeed(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Video>>> {
    const { page = 1, pageSize = 10 } = params || {};

    return apiCall(
      () => apiClient.get(`/videos?page=${page}&limit=${pageSize}`),
      async () => {
        await delay(400);
        const start = (page - 1) * pageSize;
        const items = videos.slice(start, start + pageSize);
        return {
          success: true,
          data: {
            items,
            total: videos.length,
            page,
            pageSize,
            hasMore: start + pageSize < videos.length,
          },
        };
      }
    );
  },

  // 点赞视频
  async like(videoId: string): Promise<ApiResponse<boolean>> {
    return apiCall(
      () => apiClient.post(`/videos/${videoId}/like`),
      async () => {
        await delay(100);
        return { success: true, data: true };
      }
    );
  },
};

// ==================== 首页数据 API ====================

export const homeApi = {
  // 获取Banner
  async getBanners(): Promise<ApiResponse<Banner[]>> {
    return apiCall(
      () => apiClient.get('/home/banners'),
      async () => {
        await delay(200);
        return { success: true, data: banners };
      }
    );
  },

  // 获取首页聚合数据
  async getHomeData(): Promise<ApiResponse<{
    banners: Banner[];
    onlineCoaches: Coach[];
    recommendedCoaches: Coach[];
  }>> {
    return apiCall(
      () => apiClient.get('/home'),
      async () => {
        await delay(400);
        return {
          success: true,
          data: {
            banners,
            onlineCoaches: coaches.filter(c => c.isOnline).slice(0, 8),
            recommendedCoaches: coaches.slice(0, 10),
          },
        };
      }
    );
  },
};

// ==================== AI 分析 API ====================

export const aiApi = {
  // 上传截图分析
  async analyzeScreenshot(imageData: string): Promise<ApiResponse<any>> {
    return apiCall(
      () => apiClient.post('/ai/analyze', { image: imageData }),
      async () => {
        await delay(2000);
        return {
          success: true,
          data: {
            overallScore: 85,
            dimensions: {
              awareness: 82,
              mechanics: 88,
              teamwork: 80,
              economy: 85,
            },
            suggestions: [
              '地图意识可以进一步加强，建议多关注小地图',
              '团战时机把握较好，继续保持',
              '经济处理效率高，优势滚雪球能力强',
            ],
          },
        };
      }
    );
  },

  // 获取分析报告
  async getReport(reportId: string): Promise<ApiResponse<any>> {
    return apiCall(
      () => apiClient.get(`/ai/reports/${reportId}`),
      async () => {
        await delay(300);
        return { success: true, data: {} };
      }
    );
  },
};

// ==================== 支付相关 API ====================

export const paymentApi = {
  // 创建支付订单
  async createPayment(params: {
    orderId: string;
    amount: number;
    method: 'wechat' | 'alipay' | 'balance';
  }): Promise<ApiResponse<{ paymentUrl?: string; orderId: string }>> {
    return apiCall(
      () => apiClient.post('/payment/create', params),
      async () => {
        await delay(500);
        return {
          success: true,
          data: { orderId: params.orderId },
          message: '支付创建成功',
        };
      }
    );
  },

  // 查询支付状态
  async queryStatus(orderId: string): Promise<ApiResponse<{ status: string }>> {
    return apiCall(
      () => apiClient.get(`/payment/status/${orderId}`),
      async () => {
        await delay(200);
        return { success: true, data: { status: 'success' } };
      }
    );
  },
};

// ==================== WebSocket 连接管理 ====================

export const socketApi = {
  // 连接WebSocket
  connect(token: string) {
    socketClient.connect(token);
  },

  // 断开连接
  disconnect() {
    socketClient.disconnect();
  },

  // 检查连接状态
  get connected() {
    return socketClient.connected;
  },

  // 通用事件监听
  on(event: string, callback: (...args: unknown[]) => void) {
    return socketClient.on(event, callback);
  },

  // 发送事件
  emit(event: string, data?: any) {
    socketClient.emit(event, data);
  },
};

// 统一导出
export const api = {
  coach: coachApi,
  order: orderApi,
  user: userApi,
  message: messageApi,
  live: liveApi,
  video: videoApi,
  home: homeApi,
  ai: aiApi,
  payment: paymentApi,
  socket: socketApi,
};

export default api;
