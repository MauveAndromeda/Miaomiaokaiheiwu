/**
 * Mock API 服务
 * 用于内部测试 - 无需后端即可运行完整功能
 */

import {
  coaches, games, banners, videos, liveRooms, gifts,
  rechargeOptions, vipLevels, coupons, defaultUser,
  conversations, orders, hotSearches
} from '@/data/mock';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟当前用户状态
let currentUser = { ...defaultUser };
let userToken: string | null = null;

// Mock API 响应包装
interface MockResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function success<T>(data: T): MockResponse<T> {
  return { success: true, data };
}

function error(message: string): MockResponse<never> {
  return { success: false, error: message };
}

// ==================== 认证相关 ====================

export const mockAuthApi = {
  // 发送验证码
  async sendSmsCode(phone: string): Promise<MockResponse<{ message: string }>> {
    await delay(500);
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return error('手机号格式不正确');
    }
    console.log(`[Mock] 发送验证码到: ${phone}, 验证码: 123456`);
    return success({ message: '验证码已发送' });
  },

  // 登录/注册
  async login(phone: string, code: string): Promise<MockResponse<{ token: string; user: typeof defaultUser }>> {
    await delay(800);
    if (code !== '123456') {
      return error('验证码错误');
    }
    userToken = 'mock_token_' + Date.now();
    currentUser = {
      ...defaultUser,
      phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
    };
    return success({ token: userToken, user: currentUser });
  },

  // 获取用户信息
  async getUserInfo(): Promise<MockResponse<typeof defaultUser>> {
    await delay(300);
    return success(currentUser);
  },

  // 更新用户信息
  async updateUserInfo(data: Partial<typeof defaultUser>): Promise<MockResponse<typeof defaultUser>> {
    await delay(500);
    currentUser = { ...currentUser, ...data };
    return success(currentUser);
  },
};

// ==================== 教练相关 ====================

export const mockCoachApi = {
  // 获取教练列表
  async getCoaches(params?: {
    gameId?: string;
    gender?: string;
    page?: number;
    limit?: number;
  }): Promise<MockResponse<{ list: typeof coaches; total: number }>> {
    await delay(600);
    let list = [...coaches];

    if (params?.gameId) {
      list = list.filter(c => c.games.some(g => g.id === params.gameId));
    }
    if (params?.gender) {
      list = list.filter(c => c.gender === params.gender);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;

    return success({
      list: list.slice(start, start + limit),
      total: list.length,
    });
  },

  // 获取教练详情
  async getCoachDetail(id: string): Promise<MockResponse<typeof coaches[0]>> {
    await delay(400);
    const coach = coaches.find(c => c.id === id);
    if (!coach) {
      return error('教练不存在');
    }
    return success(coach);
  },

  // 获取推荐教练
  async getRecommendedCoaches(): Promise<MockResponse<typeof coaches>> {
    await delay(500);
    return success(coaches.slice(0, 4));
  },

  // 搜索教练
  async searchCoaches(keyword: string): Promise<MockResponse<typeof coaches>> {
    await delay(400);
    const results = coaches.filter(c =>
      c.nickname.includes(keyword) ||
      c.games.some(g => g.name.includes(keyword)) ||
      c.serviceTags.some(t => t.includes(keyword))
    );
    return success(results);
  },
};

// ==================== 订单相关 ====================

let mockOrders = [...orders];

export const mockOrderApi = {
  // 创建订单
  async createOrder(data: {
    coachId: string;
    serviceType: string;
    gameId: string;
    quantity: number;
    remark?: string;
  }): Promise<MockResponse<typeof orders[0]>> {
    await delay(800);
    const coach = coaches.find(c => c.id === data.coachId);
    const game = games.find(g => g.id === data.gameId);

    if (!coach || !game) {
      return error('参数错误');
    }

    const price = coach.price * data.quantity;
    const newOrder = {
      id: 'o' + Date.now(),
      orderNo: Date.now().toString(),
      coachId: data.coachId,
      coach,
      userId: currentUser.id,
      serviceType: data.serviceType as 'play' | 'voice' | 'video',
      game,
      quantity: data.quantity,
      unit: 'round' as const,
      price,
      discount: 0,
      totalPrice: price,
      status: 'pending_payment' as const,
      remark: data.remark,
      createdAt: new Date().toISOString(),
    };

    mockOrders.unshift(newOrder);
    return success(newOrder);
  },

  // 获取订单列表
  async getOrders(status?: string): Promise<MockResponse<typeof orders>> {
    await delay(500);
    let list = [...mockOrders];
    if (status && status !== 'all') {
      list = list.filter(o => o.status === status);
    }
    return success(list);
  },

  // 获取订单详情
  async getOrderDetail(id: string): Promise<MockResponse<typeof orders[0]>> {
    await delay(400);
    const order = mockOrders.find(o => o.id === id);
    if (!order) {
      return error('订单不存在');
    }
    return success(order);
  },

  // 支付订单
  async payOrder(orderId: string, method: string): Promise<MockResponse<{ status: string }>> {
    await delay(1000);
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      return error('订单不存在');
    }

    if (method === 'balance') {
      if (currentUser.balance < order.totalPrice) {
        return error('余额不足');
      }
      currentUser.balance -= order.totalPrice;
    }

    order.status = 'pending_accept';
    order.paidAt = new Date().toISOString();

    return success({ status: 'success' });
  },

  // 取消订单
  async cancelOrder(orderId: string): Promise<MockResponse<{ message: string }>> {
    await delay(500);
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      return error('订单不存在');
    }
    order.status = 'cancelled';
    return success({ message: '订单已取消' });
  },

  // 评价订单
  async reviewOrder(orderId: string, rating: number, content: string): Promise<MockResponse<{ message: string }>> {
    await delay(600);
    const order = mockOrders.find(o => o.id === orderId);
    if (!order) {
      return error('订单不存在');
    }
    order.status = 'completed';
    return success({ message: '评价成功' });
  },
};

// ==================== 消息相关 ====================

export const mockMessageApi = {
  // 获取会话列表
  async getConversations(): Promise<MockResponse<typeof conversations>> {
    await delay(400);
    return success(conversations);
  },

  // 获取消息历史
  async getMessages(conversationId: string): Promise<MockResponse<any[]>> {
    await delay(500);
    return success([
      {
        id: 'm1',
        senderId: 'system',
        content: '您好，很高兴为您服务！',
        type: 'text',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'm2',
        senderId: currentUser.id,
        content: '你好，我想约一局王者',
        type: 'text',
        createdAt: new Date(Date.now() - 3000000).toISOString(),
      },
      {
        id: 'm3',
        senderId: 'coach',
        content: '好的，现在有空吗？',
        type: 'text',
        createdAt: new Date(Date.now() - 2400000).toISOString(),
      },
    ]);
  },

  // 发送消息
  async sendMessage(conversationId: string, content: string, type: string = 'text'): Promise<MockResponse<any>> {
    await delay(300);
    return success({
      id: 'm' + Date.now(),
      senderId: currentUser.id,
      content,
      type,
      createdAt: new Date().toISOString(),
    });
  },
};

// ==================== 视频/直播相关 ====================

export const mockMediaApi = {
  // 获取视频列表
  async getVideos(page: number = 1): Promise<MockResponse<typeof videos>> {
    await delay(600);
    return success(videos);
  },

  // 获取直播列表
  async getLiveRooms(): Promise<MockResponse<typeof liveRooms>> {
    await delay(500);
    return success(liveRooms);
  },

  // 点赞视频
  async likeVideo(videoId: string): Promise<MockResponse<{ liked: boolean }>> {
    await delay(200);
    const video = videos.find(v => v.id === videoId);
    if (video) {
      video.isLiked = !video.isLiked;
      video.likeCount += video.isLiked ? 1 : -1;
    }
    return success({ liked: video?.isLiked || false });
  },
};

// ==================== 支付/钱包相关 ====================

export const mockPaymentApi = {
  // 获取余额
  async getBalance(): Promise<MockResponse<{ balance: number }>> {
    await delay(300);
    return success({ balance: currentUser.balance });
  },

  // 充值
  async recharge(amount: number, method: string): Promise<MockResponse<{ orderNo: string }>> {
    await delay(800);
    const option = rechargeOptions.find(o => o.amount === amount);
    if (!option) {
      return error('无效的充值金额');
    }

    // 模拟充值成功
    currentUser.balance += option.diamonds + (option.bonus || 0);

    return success({ orderNo: 'RC' + Date.now() });
  },

  // 获取充值档位
  async getRechargeOptions(): Promise<MockResponse<typeof rechargeOptions>> {
    await delay(300);
    return success(rechargeOptions);
  },

  // 获取优惠券
  async getCoupons(): Promise<MockResponse<typeof coupons>> {
    await delay(400);
    return success(coupons);
  },
};

// ==================== 其他 ====================

export const mockMiscApi = {
  // 获取游戏列表
  async getGames(): Promise<MockResponse<typeof games>> {
    await delay(300);
    return success(games);
  },

  // 获取Banner
  async getBanners(): Promise<MockResponse<typeof banners>> {
    await delay(400);
    return success(banners);
  },

  // 获取礼物列表
  async getGifts(): Promise<MockResponse<typeof gifts>> {
    await delay(300);
    return success(gifts);
  },

  // 获取VIP等级
  async getVipLevels(): Promise<MockResponse<typeof vipLevels>> {
    await delay(300);
    return success(vipLevels);
  },

  // 热门搜索
  async getHotSearches(): Promise<MockResponse<string[]>> {
    await delay(200);
    return success(hotSearches);
  },
};

// ==================== 社交关系 ====================

const followingSet = new Set<string>();

export const mockSocialApi = {
  // 关注
  async follow(userId: string): Promise<MockResponse<{ followed: boolean }>> {
    await delay(400);
    followingSet.add(userId);
    currentUser.followCount++;
    return success({ followed: true });
  },

  // 取消关注
  async unfollow(userId: string): Promise<MockResponse<{ followed: boolean }>> {
    await delay(400);
    followingSet.delete(userId);
    currentUser.followCount--;
    return success({ followed: false });
  },

  // 检查是否关注
  async isFollowing(userId: string): Promise<MockResponse<{ followed: boolean }>> {
    await delay(200);
    return success({ followed: followingSet.has(userId) });
  },

  // 获取关注列表
  async getFollowing(): Promise<MockResponse<typeof coaches>> {
    await delay(500);
    const list = coaches.filter(c => followingSet.has(c.id));
    return success(list);
  },
};

// ==================== 统一导出 ====================

export const mockApi = {
  auth: mockAuthApi,
  coach: mockCoachApi,
  order: mockOrderApi,
  message: mockMessageApi,
  media: mockMediaApi,
  payment: mockPaymentApi,
  misc: mockMiscApi,
  social: mockSocialApi,
};

export default mockApi;
