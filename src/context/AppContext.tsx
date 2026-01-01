'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Order, Conversation, Coupon, Coach } from '@/types';
import { defaultUser, orders as mockOrders, conversations as mockConversations, coupons as mockCoupons, coaches } from '@/data/mock';

// 页面类型
export type PageType =
  | 'home'
  | 'discover'
  | 'live'
  | 'messages'
  | 'profile'
  | 'login'
  | 'onboarding'
  | 'search'
  | 'coach-detail'
  | 'order-create'
  | 'payment'
  | 'orders'
  | 'order-detail'
  | 'review'
  | 'wallet'
  | 'recharge'
  | 'transactions'
  | 'vip'
  | 'chat'
  | 'voice-call'
  | 'video-call'
  | 'live-room'
  | 'ai-analysis'
  | 'ai-report'
  | 'settings'
  | 'favorites';

interface AppState {
  // 用户状态
  isLoggedIn: boolean;
  hasSeenOnboarding: boolean;
  user: User | null;

  // 导航状态
  currentPage: PageType;
  currentTab: number;
  pageParams: Record<string, any>;
  pageHistory: { page: PageType; params: Record<string, any> }[];

  // 数据
  orders: Order[];
  conversations: Conversation[];
  coupons: Coupon[];
  favorites: string[];
  searchHistory: string[];

  // UI状态
  isLoading: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  modal: { type: string; data?: any } | null;
  unreadMessages: number;
}

interface AppContextType extends AppState {
  // 用户操作
  login: (phone: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  updateUser: (updates: Partial<User>) => void;

  // 导航操作
  navigateTo: (page: PageType, params?: Record<string, any>) => void;
  goBack: () => void;
  setTab: (index: number) => void;

  // 订单操作
  createOrder: (order: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'status'>) => Order;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;

  // 余额操作
  recharge: (amount: number, diamonds: number) => void;
  consume: (amount: number, description: string) => void;

  // 收藏操作
  toggleFavorite: (coachId: string) => void;
  isFavorite: (coachId: string) => boolean;

  // 搜索历史
  addSearchHistory: (keyword: string) => void;
  clearSearchHistory: () => void;

  // UI操作
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  showModal: (type: string, data?: any) => void;
  hideModal: () => void;
  setLoading: (loading: boolean) => void;

  // 消息操作
  markConversationRead: (conversationId: string) => void;

  // 获取教练
  getCoach: (coachId: string) => Coach | undefined;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    isLoggedIn: false,
    hasSeenOnboarding: false,
    user: null,
    currentPage: 'home',
    currentTab: 0,
    pageParams: {},
    pageHistory: [],
    orders: mockOrders,
    conversations: mockConversations,
    coupons: mockCoupons,
    favorites: [],
    searchHistory: [],
    isLoading: false,
    toast: null,
    modal: null,
    unreadMessages: 3,
  });

  // 从localStorage恢复状态
  useEffect(() => {
    const savedState = localStorage.getItem('miaomiao_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(prev => ({
          ...prev,
          isLoggedIn: parsed.isLoggedIn || false,
          hasSeenOnboarding: parsed.hasSeenOnboarding || false,
          user: parsed.user || null,
          favorites: parsed.favorites || [],
          searchHistory: parsed.searchHistory || [],
          orders: parsed.orders || mockOrders,
        }));

        // 如果未登录且未看过引导，显示引导页
        if (!parsed.isLoggedIn && !parsed.hasSeenOnboarding) {
          setState(prev => ({ ...prev, currentPage: 'onboarding' }));
        } else if (!parsed.isLoggedIn) {
          setState(prev => ({ ...prev, currentPage: 'login' }));
        }
      } catch (e) {
        console.error('Failed to parse saved state:', e);
      }
    } else {
      // 首次打开显示引导页
      setState(prev => ({ ...prev, currentPage: 'onboarding' }));
    }
  }, []);

  // 保存状态到localStorage
  useEffect(() => {
    const stateToSave = {
      isLoggedIn: state.isLoggedIn,
      hasSeenOnboarding: state.hasSeenOnboarding,
      user: state.user,
      favorites: state.favorites,
      searchHistory: state.searchHistory,
      orders: state.orders,
    };
    localStorage.setItem('miaomiao_state', JSON.stringify(stateToSave));
  }, [state.isLoggedIn, state.hasSeenOnboarding, state.user, state.favorites, state.searchHistory, state.orders]);

  // 用户操作
  const login = (phone: string) => {
    const user = { ...defaultUser, phone: phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') };
    setState(prev => ({
      ...prev,
      isLoggedIn: true,
      user,
      currentPage: 'home',
      currentTab: 0,
    }));
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      isLoggedIn: false,
      user: null,
      currentPage: 'login',
    }));
  };

  const completeOnboarding = () => {
    setState(prev => ({
      ...prev,
      hasSeenOnboarding: true,
      currentPage: 'login',
    }));
  };

  const updateUser = (updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

  // 导航操作
  const navigateTo = (page: PageType, params: Record<string, any> = {}) => {
    setState(prev => ({
      ...prev,
      currentPage: page,
      pageParams: params,
      pageHistory: [...prev.pageHistory, { page: prev.currentPage, params: prev.pageParams }],
    }));
  };

  const goBack = () => {
    setState(prev => {
      if (prev.pageHistory.length === 0) {
        // 返回到对应的Tab页面
        const tabPages: PageType[] = ['home', 'discover', 'live', 'messages', 'profile'];
        return { ...prev, currentPage: tabPages[prev.currentTab], pageParams: {} };
      }
      const history = [...prev.pageHistory];
      const last = history.pop()!;
      return {
        ...prev,
        currentPage: last.page,
        pageParams: last.params,
        pageHistory: history,
      };
    });
  };

  const setTab = (index: number) => {
    const tabPages: PageType[] = ['home', 'discover', 'live', 'messages', 'profile'];
    setState(prev => ({
      ...prev,
      currentTab: index,
      currentPage: tabPages[index],
      pageParams: {},
      pageHistory: [],
    }));
  };

  // 订单操作
  const createOrder = (orderData: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'status'>) => {
    const newOrder: Order = {
      ...orderData,
      id: `o${Date.now()}`,
      orderNo: `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(state.orders.length + 1).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      status: 'pending_payment',
    };
    setState(prev => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
    }));
    return newOrder;
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setState(prev => ({
      ...prev,
      orders: prev.orders.map(o => o.id === orderId ? { ...o, ...updates } : o),
    }));
  };

  // 余额操作
  const recharge = (amount: number, diamonds: number) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, balance: prev.user.balance + diamonds } : null,
    }));
  };

  const consume = (amount: number, description: string) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, balance: prev.user.balance - amount } : null,
    }));
  };

  // 收藏操作
  const toggleFavorite = (coachId: string) => {
    setState(prev => ({
      ...prev,
      favorites: prev.favorites.includes(coachId)
        ? prev.favorites.filter(id => id !== coachId)
        : [...prev.favorites, coachId],
    }));
  };

  const isFavorite = (coachId: string) => state.favorites.includes(coachId);

  // 搜索历史
  const addSearchHistory = (keyword: string) => {
    setState(prev => ({
      ...prev,
      searchHistory: [keyword, ...prev.searchHistory.filter(k => k !== keyword)].slice(0, 10),
    }));
  };

  const clearSearchHistory = () => {
    setState(prev => ({ ...prev, searchHistory: [] }));
  };

  // UI操作
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setState(prev => ({ ...prev, toast: { message, type } }));
    setTimeout(() => {
      setState(prev => ({ ...prev, toast: null }));
    }, 2000);
  };

  const hideToast = () => {
    setState(prev => ({ ...prev, toast: null }));
  };

  const showModal = (type: string, data?: any) => {
    setState(prev => ({ ...prev, modal: { type, data } }));
  };

  const hideModal = () => {
    setState(prev => ({ ...prev, modal: null }));
  };

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  // 消息操作
  const markConversationRead = (conversationId: string) => {
    setState(prev => {
      const conversations = prev.conversations.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      return { ...prev, conversations, unreadMessages };
    });
  };

  // 获取教练
  const getCoach = (coachId: string) => coaches.find(c => c.id === coachId);

  const value: AppContextType = {
    ...state,
    login,
    logout,
    completeOnboarding,
    updateUser,
    navigateTo,
    goBack,
    setTab,
    createOrder,
    updateOrder,
    recharge,
    consume,
    toggleFavorite,
    isFavorite,
    addSearchHistory,
    clearSearchHistory,
    showToast,
    hideToast,
    showModal,
    hideModal,
    setLoading,
    markConversationRead,
    getCoach,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
