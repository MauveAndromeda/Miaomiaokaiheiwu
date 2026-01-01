import {
  User, Coach, GameTag, Banner, Video, LiveRoom, Gift,
  Coupon, RechargeOption, VIPLevel, Conversation, Order
} from '@/types';

// 游戏列表
export const games: GameTag[] = [
  { id: '1', name: '王者荣耀', icon: '👑' },
  { id: '2', name: '和平精英', icon: '🔫' },
  { id: '3', name: '英雄联盟', icon: '⚔️' },
  { id: '4', name: '永劫无间', icon: '🗡️' },
  { id: '5', name: '原神', icon: '🌟' },
  { id: '6', name: 'CSGO', icon: '💣' },
  { id: '7', name: '第五人格', icon: '🎭' },
  { id: '8', name: '更多', icon: '➕' },
];

// Banner数据
export const banners: Banner[] = [
  { id: '1', image: '', title: '🎮 新用户专享 首单5折', link: '' },
  { id: '2', image: '', title: '🏆 王者荣耀 大神带飞', link: '' },
  { id: '3', image: '', title: '🎁 邀请好友 各得100钻', link: '' },
  { id: '4', image: '', title: '⭐ VIP会员 尊享特权', link: '' },
];

// 教练数据
export const coaches: Coach[] = [
  {
    id: '1',
    nickname: '甜甜',
    avatar: '',
    gender: 'female',
    isOnline: true,
    certifications: ['女神', '声优'],
    games: [games[0], games[1]],
    price: 30,
    voicePrice: 5,
    videoPrice: 10,
    rating: 4.9,
    orderCount: 2580,
    fansCount: 12800,
    followCount: 88,
    goodRate: 99,
    serviceTags: ['声音好听', '有耐心', '技术强'],
    ranks: [
      { gameId: '1', gameName: '王者荣耀', rank: '王者50星', rankIcon: '👑' },
      { gameId: '2', gameName: '和平精英', rank: '无敌战神', rankIcon: '🏆' },
    ],
    reviews: [
      {
        id: 'r1',
        userId: 'u1',
        userNickname: '快乐玩家',
        userAvatar: '',
        rating: 5,
        content: '小姐姐声音超好听，技术也很棒，带我连赢5把！',
        tags: ['声音好听', '技术很棒'],
        createdAt: '2024-12-30T10:00:00Z',
      },
    ],
    introduction: '哈喽～我是甜甜，王者巅峰赛2000分，擅长中单和打野，保证带你上分！声音甜美，性格温柔，快来找我开黑吧～',
  },
  {
    id: '2',
    nickname: '剑无双',
    avatar: '',
    gender: 'male',
    isOnline: true,
    certifications: ['大神', '主播'],
    games: [games[0], games[2]],
    price: 50,
    rating: 4.8,
    orderCount: 5200,
    fansCount: 28000,
    followCount: 120,
    goodRate: 98,
    serviceTags: ['上分快', '技术强', '幽默风趣'],
    ranks: [
      { gameId: '1', gameName: '王者荣耀', rank: '荣耀100星', rankIcon: '👑' },
      { gameId: '3', gameName: '英雄联盟', rank: '王者', rankIcon: '💎' },
    ],
    reviews: [],
    introduction: '职业选手退役，带你体验最强操作！',
  },
  {
    id: '3',
    nickname: '小鹿',
    avatar: '',
    gender: 'female',
    isOnline: false,
    certifications: ['女神', '治愈'],
    games: [games[4], games[6]],
    price: 25,
    voicePrice: 3,
    rating: 4.7,
    orderCount: 1280,
    fansCount: 6500,
    followCount: 200,
    goodRate: 97,
    serviceTags: ['有耐心', '声音好听', '治愈系'],
    ranks: [
      { gameId: '5', gameName: '原神', rank: '60级', rankIcon: '⭐' },
    ],
    reviews: [],
    introduction: '原神深渊满星玩家，带你探索提瓦特大陆～',
  },
  {
    id: '4',
    nickname: '战神归来',
    avatar: '',
    gender: 'male',
    isOnline: true,
    certifications: ['大神', '战队'],
    games: [games[1], games[5]],
    price: 45,
    rating: 4.9,
    orderCount: 3800,
    fansCount: 15000,
    followCount: 50,
    goodRate: 99,
    serviceTags: ['上分快', '技术强', '教学向'],
    ranks: [
      { gameId: '2', gameName: '和平精英', rank: '无敌战神', rankIcon: '🏆' },
      { gameId: '6', gameName: 'CSGO', rank: '全球精英', rankIcon: '🌟' },
    ],
    reviews: [],
    introduction: 'FPS游戏专业玩家，带你吃鸡！',
  },
  {
    id: '5',
    nickname: '萌萌',
    avatar: '',
    gender: 'female',
    isOnline: true,
    certifications: ['声优', '治愈'],
    games: [games[0], games[4]],
    price: 20,
    voicePrice: 8,
    videoPrice: 15,
    rating: 4.6,
    orderCount: 890,
    fansCount: 4200,
    followCount: 300,
    goodRate: 96,
    serviceTags: ['声音好听', '有耐心', '幽默风趣'],
    ranks: [
      { gameId: '1', gameName: '王者荣耀', rank: '星耀', rankIcon: '⭐' },
    ],
    reviews: [],
    introduction: '专业配音演员，陪你聊天开黑～',
  },
  {
    id: '6',
    nickname: '影子',
    avatar: '',
    gender: 'male',
    isOnline: false,
    certifications: ['大神'],
    games: [games[3], games[2]],
    price: 60,
    rating: 4.8,
    orderCount: 2100,
    fansCount: 9800,
    followCount: 45,
    goodRate: 98,
    serviceTags: ['技术强', '上分快'],
    ranks: [
      { gameId: '4', gameName: '永劫无间', rank: '修罗', rankIcon: '🗡️' },
    ],
    reviews: [],
    introduction: '永劫无间修罗级玩家，教你成为武道宗师！',
  },
];

// 视频数据
export const videos: Video[] = [
  {
    id: 'v1',
    userId: '1',
    userNickname: '甜甜',
    userAvatar: '',
    cover: '',
    title: '王者荣耀超神五杀！这波操作你给几分？',
    likeCount: 12800,
    commentCount: 580,
    shareCount: 230,
    isLiked: false,
    isFollowed: false,
  },
  {
    id: 'v2',
    userId: '2',
    userNickname: '剑无双',
    userAvatar: '',
    cover: '',
    title: '教你如何成为峡谷最靓的仔',
    likeCount: 8900,
    commentCount: 420,
    shareCount: 180,
    isLiked: false,
    isFollowed: true,
  },
  {
    id: 'v3',
    userId: '4',
    userNickname: '战神归来',
    userAvatar: '',
    cover: '',
    title: '和平精英 - 一个人团灭一个队',
    likeCount: 25600,
    commentCount: 1200,
    shareCount: 560,
    isLiked: true,
    isFollowed: false,
  },
];

// 直播数据
export const liveRooms: LiveRoom[] = [
  {
    id: 'l1',
    hostId: '1',
    hostNickname: '甜甜',
    hostAvatar: '',
    cover: '',
    title: '王者上分中～来聊天呀',
    game: '王者荣耀',
    viewerCount: 2580,
    isLive: true,
  },
  {
    id: 'l2',
    hostId: '2',
    hostNickname: '剑无双',
    hostAvatar: '',
    cover: '',
    title: '巅峰赛冲分！目标3000分',
    game: '王者荣耀',
    viewerCount: 8900,
    isLive: true,
  },
  {
    id: 'l3',
    hostId: '4',
    hostNickname: '战神归来',
    hostAvatar: '',
    cover: '',
    title: '吃鸡教学 有问必答',
    game: '和平精英',
    viewerCount: 5600,
    isLive: true,
  },
  {
    id: 'l4',
    hostId: '5',
    hostNickname: '萌萌',
    hostAvatar: '',
    cover: '',
    title: '原神探险～一起抽卡',
    game: '原神',
    viewerCount: 1200,
    isLive: true,
  },
];

// 礼物数据
export const gifts: Gift[] = [
  { id: 'g1', name: '鲜花', icon: '🌹', price: 1 },
  { id: 'g2', name: '棒棒糖', icon: '🍭', price: 5 },
  { id: 'g3', name: '爱心', icon: '❤️', price: 10 },
  { id: 'g4', name: '皇冠', icon: '👑', price: 50 },
  { id: 'g5', name: '火箭', icon: '🚀', price: 100 },
  { id: 'g6', name: '城堡', icon: '🏰', price: 500 },
];

// 充值档位
export const rechargeOptions: RechargeOption[] = [
  { id: 'r1', amount: 6, diamonds: 60, bonus: 0 },
  { id: 'r2', amount: 30, diamonds: 300, bonus: 30, isHot: true },
  { id: 'r3', amount: 68, diamonds: 680, bonus: 100 },
  { id: 'r4', amount: 128, diamonds: 1280, bonus: 200 },
  { id: 'r5', amount: 328, diamonds: 3280, bonus: 600 },
  { id: 'r6', amount: 648, diamonds: 6480, bonus: 1500 },
];

// VIP等级
export const vipLevels: VIPLevel[] = [
  {
    level: 1,
    name: 'VIP1',
    icon: '💫',
    privileges: ['专属标识', '优先匹配'],
    requiredAmount: 100,
  },
  {
    level: 2,
    name: 'VIP2',
    icon: '⭐',
    privileges: ['专属标识', '优先匹配', '9.5折优惠'],
    requiredAmount: 500,
  },
  {
    level: 3,
    name: 'VIP3',
    icon: '🌟',
    privileges: ['专属标识', '优先匹配', '9折优惠', '专属客服'],
    requiredAmount: 2000,
  },
  {
    level: 4,
    name: 'VIP4',
    icon: '💎',
    privileges: ['专属标识', '优先匹配', '8.5折优惠', '专属客服', '生日礼包'],
    requiredAmount: 5000,
  },
  {
    level: 5,
    name: 'VIP5',
    icon: '👑',
    privileges: ['专属标识', '优先匹配', '8折优惠', '专属客服', '生日礼包', '专属活动'],
    requiredAmount: 10000,
  },
];

// 优惠券
export const coupons: Coupon[] = [
  {
    id: 'c1',
    name: '新人专享券',
    discount: 10,
    minAmount: 30,
    expireAt: '2025-01-31T23:59:59Z',
    isUsed: false,
  },
  {
    id: 'c2',
    name: '满减券',
    discount: 20,
    minAmount: 100,
    expireAt: '2025-01-15T23:59:59Z',
    isUsed: false,
  },
];

// 默认用户
export const defaultUser: User = {
  id: 'u1',
  phone: '138****8888',
  nickname: '游戏达人',
  avatar: '',
  gender: 'unknown',
  vipLevel: 2,
  balance: 500,
  followCount: 28,
  fansCount: 156,
  likeCount: 892,
  createdAt: '2024-01-01T00:00:00Z',
};

// 会话列表
export const conversations: Conversation[] = [
  {
    id: 'conv1',
    targetId: '1',
    targetNickname: '甜甜',
    targetAvatar: '',
    lastMessage: '好的，那我们开始吧～',
    lastMessageTime: '2024-12-31T10:30:00Z',
    unreadCount: 2,
  },
  {
    id: 'conv2',
    targetId: '2',
    targetNickname: '剑无双',
    targetAvatar: '',
    lastMessage: '等下再开一把？',
    lastMessageTime: '2024-12-31T09:15:00Z',
    unreadCount: 0,
  },
  {
    id: 'conv3',
    targetId: 'system',
    targetNickname: '系统通知',
    targetAvatar: '',
    lastMessage: '您的订单已完成，快去评价吧！',
    lastMessageTime: '2024-12-30T18:00:00Z',
    unreadCount: 1,
  },
];

// 订单数据
export const orders: Order[] = [
  {
    id: 'o1',
    orderNo: '202412310001',
    coachId: '1',
    coach: coaches[0],
    userId: 'u1',
    serviceType: 'play',
    game: games[0],
    quantity: 3,
    unit: 'round',
    price: 90,
    discount: 10,
    totalPrice: 80,
    status: 'completed',
    remark: '希望能上星耀',
    createdAt: '2024-12-30T14:00:00Z',
    paidAt: '2024-12-30T14:01:00Z',
    completedAt: '2024-12-30T16:30:00Z',
  },
  {
    id: 'o2',
    orderNo: '202412310002',
    coachId: '2',
    coach: coaches[1],
    userId: 'u1',
    serviceType: 'play',
    game: games[0],
    quantity: 5,
    unit: 'round',
    price: 250,
    discount: 0,
    totalPrice: 250,
    status: 'pending_review',
    createdAt: '2024-12-31T10:00:00Z',
    paidAt: '2024-12-31T10:02:00Z',
    completedAt: '2024-12-31T12:00:00Z',
  },
];

// 热门搜索
export const hotSearches = [
  '王者荣耀',
  '女神陪玩',
  '上分',
  '和平精英',
  '声音好听',
  '代练',
];
