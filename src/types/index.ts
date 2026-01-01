// 用户类型
export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female' | 'unknown';
  vipLevel: number;
  balance: number;
  followCount: number;
  fansCount: number;
  likeCount: number;
  createdAt: string;
}

// 教练类型
export interface Coach {
  id: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female';
  isOnline: boolean;
  certifications: string[];
  games: GameTag[];
  price: number;
  voicePrice?: number;
  videoPrice?: number;
  rating: number;
  orderCount: number;
  fansCount: number;
  followCount: number;
  goodRate: number;
  serviceTags: string[];
  ranks: GameRank[];
  reviews: Review[];
  introduction?: string;
}

// 游戏标签
export interface GameTag {
  id: string;
  name: string;
  icon: string;
}

// 游戏段位
export interface GameRank {
  gameId: string;
  gameName: string;
  rank: string;
  rankIcon: string;
}

// 评价
export interface Review {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  rating: number;
  content: string;
  tags: string[];
  createdAt: string;
}

// 订单类型
export interface Order {
  id: string;
  orderNo: string;
  coachId: string;
  coach: Coach;
  userId: string;
  serviceType: 'play' | 'voice' | 'video';
  game: GameTag;
  quantity: number;
  unit: 'round' | 'minute' | 'hour';
  price: number;
  discount: number;
  totalPrice: number;
  status: OrderStatus;
  remark?: string;
  createdAt: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  review?: Review;
}

export type OrderStatus =
  | 'pending_payment'
  | 'pending_accept'
  | 'in_progress'
  | 'pending_review'
  | 'completed'
  | 'cancelled';

export const OrderStatusText: Record<OrderStatus, string> = {
  pending_payment: '待支付',
  pending_accept: '待接单',
  in_progress: '进行中',
  pending_review: '待评价',
  completed: '已完成',
  cancelled: '已取消',
};

// 钱包交易记录
export interface Transaction {
  id: string;
  type: 'recharge' | 'consume' | 'refund' | 'gift';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

// 消息会话
export interface Conversation {
  id: string;
  targetId: string;
  targetNickname: string;
  targetAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// 聊天消息
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'voice' | 'image' | 'system';
  voiceDuration?: number;
  createdAt: string;
}

// Banner
export interface Banner {
  id: string;
  image: string;
  title: string;
  link?: string;
}

// 视频
export interface Video {
  id: string;
  userId: string;
  userNickname: string;
  userAvatar: string;
  cover: string;
  title: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isFollowed: boolean;
}

// 直播
export interface LiveRoom {
  id: string;
  hostId: string;
  hostNickname: string;
  hostAvatar: string;
  cover: string;
  title: string;
  game: string;
  viewerCount: number;
  isLive: boolean;
}

// 礼物
export interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
}

// 优惠券
export interface Coupon {
  id: string;
  name: string;
  discount: number;
  minAmount: number;
  expireAt: string;
  isUsed: boolean;
}

// VIP等级
export interface VIPLevel {
  level: number;
  name: string;
  icon: string;
  privileges: string[];
  requiredAmount: number;
}

// 充值档位
export interface RechargeOption {
  id: string;
  amount: number;
  diamonds: number;
  bonus: number;
  isHot?: boolean;
}

// AI分析报告
export interface AIAnalysisReport {
  id: string;
  gameId: string;
  gameName: string;
  gameAccountId: string;
  overallScore: number;
  dimensions: {
    name: string;
    score: number;
    description: string;
  }[];
  suggestions: string[];
  recommendedCoaches: Coach[];
  createdAt: string;
}

// 搜索历史
export interface SearchHistory {
  keyword: string;
  searchedAt: string;
}

// 通知
export interface Notification {
  id: string;
  type: 'order' | 'system' | 'activity';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
