/**
 * API 服务层 - 统一的数据请求接口
 * 目前使用 mock 数据，后期可轻松替换为真实 API
 */

import { Coach, Order, User, Conversation, Video, LiveRoom, Banner } from '@/types';
import { coaches, orders, conversations, videos, liveRooms, banners, defaultUser } from '@/data/mock';

// 模拟网络延迟
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

// ==================== 教练相关 API ====================

export const coachApi = {
  // 获取推荐教练列表
  async getRecommended(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Coach>>> {
    await delay(300);
    const { page = 1, pageSize = 10 } = params || {};
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
  },

  // 获取在线教练
  async getOnline(): Promise<ApiResponse<Coach[]>> {
    await delay(200);
    return {
      success: true,
      data: coaches.filter(c => c.isOnline),
    };
  },

  // 获取教练详情
  async getDetail(id: string): Promise<ApiResponse<Coach>> {
    await delay(200);
    const coach = coaches.find(c => c.id === id);
    if (!coach) {
      return { success: false, error: '教练不存在' };
    }
    return { success: true, data: coach };
  },

  // 搜索教练
  async search(keyword: string): Promise<ApiResponse<Coach[]>> {
    await delay(300);
    const results = coaches.filter(c =>
      c.nickname.includes(keyword) ||
      c.games.some(g => g.name.includes(keyword))
    );
    return { success: true, data: results };
  },

  // 关注/取消关注教练
  async toggleFollow(coachId: string, isFollow: boolean): Promise<ApiResponse<boolean>> {
    await delay(200);
    return {
      success: true,
      data: isFollow,
      message: isFollow ? '关注成功' : '已取消关注',
    };
  },
};

// ==================== 订单相关 API ====================

export const orderApi = {
  // 获取订单列表
  async getList(status?: string): Promise<ApiResponse<Order[]>> {
    await delay(300);
    let filtered = orders;
    if (status && status !== 'all') {
      filtered = orders.filter(o => o.status === status);
    }
    return { success: true, data: filtered };
  },

  // 创建订单
  async create(params: {
    coachId: string;
    serviceType: string;
    quantity: number;
    totalPrice: number;
  }): Promise<ApiResponse<Partial<Order>>> {
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
  },

  // 支付订单
  async pay(orderId: string, payMethod: string): Promise<ApiResponse<boolean>> {
    await delay(800);
    return { success: true, data: true, message: '支付成功' };
  },

  // 取消订单
  async cancel(orderId: string): Promise<ApiResponse<boolean>> {
    await delay(300);
    return { success: true, data: true, message: '订单已取消' };
  },

  // 评价订单
  async review(orderId: string, rating: number, content: string, tags: string[]): Promise<ApiResponse<boolean>> {
    await delay(400);
    return { success: true, data: true, message: '评价成功' };
  },
};

// ==================== 用户相关 API ====================

export const userApi = {
  // 登录
  async login(phone: string, code: string): Promise<ApiResponse<User>> {
    await delay(500);
    if (code !== '123456') {
      return { success: false, error: '验证码错误' };
    }
    return { success: true, data: defaultUser, message: '登录成功' };
  },

  // 发送验证码
  async sendCode(phone: string): Promise<ApiResponse<boolean>> {
    await delay(300);
    return { success: true, data: true, message: '验证码已发送' };
  },

  // 获取用户信息
  async getProfile(): Promise<ApiResponse<User>> {
    await delay(200);
    return { success: true, data: defaultUser };
  },

  // 更新用户信息
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    await delay(300);
    return { success: true, data: { ...defaultUser, ...data } };
  },

  // 充值
  async recharge(amount: number, payMethod: string): Promise<ApiResponse<{ balance: number }>> {
    await delay(600);
    return {
      success: true,
      data: { balance: defaultUser.balance + amount },
      message: '充值成功',
    };
  },
};

// ==================== 消息相关 API ====================

export const messageApi = {
  // 获取会话列表
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    await delay(200);
    return { success: true, data: conversations };
  },

  // 获取聊天记录
  async getMessages(conversationId: string): Promise<ApiResponse<any[]>> {
    await delay(200);
    // Mock messages
    return { success: true, data: [] };
  },

  // 发送消息
  async sendMessage(conversationId: string, content: string, type: string): Promise<ApiResponse<any>> {
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
  },
};

// ==================== 直播相关 API ====================

export const liveApi = {
  // 获取直播列表
  async getList(): Promise<ApiResponse<LiveRoom[]>> {
    await delay(300);
    return { success: true, data: liveRooms };
  },

  // 获取直播详情
  async getDetail(roomId: string): Promise<ApiResponse<LiveRoom>> {
    await delay(200);
    const room = liveRooms.find(r => r.id === roomId);
    if (!room) {
      return { success: false, error: '直播间不存在' };
    }
    return { success: true, data: room };
  },

  // 进入直播间
  async enter(roomId: string): Promise<ApiResponse<boolean>> {
    await delay(200);
    return { success: true, data: true };
  },

  // 发送弹幕
  async sendDanmaku(roomId: string, content: string): Promise<ApiResponse<boolean>> {
    await delay(50);
    return { success: true, data: true };
  },

  // 送礼物
  async sendGift(roomId: string, giftId: string): Promise<ApiResponse<boolean>> {
    await delay(300);
    return { success: true, data: true, message: '礼物发送成功' };
  },
};

// ==================== 视频相关 API ====================

export const videoApi = {
  // 获取视频流
  async getFeed(params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<Video>>> {
    await delay(400);
    const { page = 1, pageSize = 10 } = params || {};
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
  },

  // 点赞视频
  async like(videoId: string): Promise<ApiResponse<boolean>> {
    await delay(100);
    return { success: true, data: true };
  },
};

// ==================== 首页数据 API ====================

export const homeApi = {
  // 获取Banner
  async getBanners(): Promise<ApiResponse<Banner[]>> {
    await delay(200);
    return { success: true, data: banners };
  },

  // 获取首页聚合数据
  async getHomeData(): Promise<ApiResponse<{
    banners: Banner[];
    onlineCoaches: Coach[];
    recommendedCoaches: Coach[];
  }>> {
    await delay(400);
    return {
      success: true,
      data: {
        banners,
        onlineCoaches: coaches.filter(c => c.isOnline).slice(0, 8),
        recommendedCoaches: coaches.slice(0, 10),
      },
    };
  },
};

// ==================== AI 分析 API ====================

export const aiApi = {
  // 上传截图分析
  async analyzeScreenshot(imageData: string): Promise<ApiResponse<any>> {
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
  },

  // 获取分析报告
  async getReport(reportId: string): Promise<ApiResponse<any>> {
    await delay(300);
    return { success: true, data: {} };
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
};

export default api;
