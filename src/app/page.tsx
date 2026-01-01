'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import { Toast } from '@/components/ui';
import { TabBar } from '@/components/layout';

// Auth
import { Onboarding, Login } from '@/components/auth';

// Main Tabs
import { HomePage } from '@/components/home';
import { VideoFeed } from '@/components/discover';
import { LiveList, LiveRoom } from '@/components/live';
import { MessageList, Chat, VoiceCall, VideoCall } from '@/components/message';
import { Profile, Settings } from '@/components/profile';

// Other Pages
import { CoachDetail } from '@/components/coach';
import { OrderCreate, Payment, OrderList, Review } from '@/components/order';
import { Wallet, Recharge, VIP } from '@/components/wallet';
import { AIAnalysis, AIReport } from '@/components/ai';
import { Search } from '@/components/search';

function AppContent() {
  const { currentPage, isLoggedIn, hasSeenOnboarding } = useApp();

  // 未完成引导
  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  // 未登录
  if (!isLoggedIn) {
    return <Login />;
  }

  // 需要显示TabBar的页面
  const tabPages = ['home', 'discover', 'live', 'messages', 'profile'];
  const showTabBar = tabPages.includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      // 主Tab页面
      case 'home':
        return <HomePage />;
      case 'discover':
        return <VideoFeed />;
      case 'live':
        return <LiveList />;
      case 'messages':
        return <MessageList />;
      case 'profile':
        return <Profile />;

      // 教练相关
      case 'coach-detail':
        return <CoachDetail />;

      // 订单相关
      case 'order-create':
        return <OrderCreate />;
      case 'payment':
        return <Payment />;
      case 'orders':
        return <OrderList />;
      case 'review':
        return <Review />;

      // 钱包相关
      case 'wallet':
        return <Wallet />;
      case 'recharge':
        return <Recharge />;
      case 'vip':
        return <VIP />;

      // 消息相关
      case 'chat':
        return <Chat />;
      case 'voice-call':
        return <VoiceCall />;
      case 'video-call':
        return <VideoCall />;

      // 直播
      case 'live-room':
        return <LiveRoom />;

      // AI分析
      case 'ai-analysis':
        return <AIAnalysis />;
      case 'ai-report':
        return <AIReport />;

      // 搜索
      case 'search':
        return <Search />;

      // 设置
      case 'settings':
        return <Settings />;

      default:
        return <HomePage />;
    }
  };

  return (
    <>
      {renderPage()}
      {showTabBar && <TabBar />}
      <Toast />
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
