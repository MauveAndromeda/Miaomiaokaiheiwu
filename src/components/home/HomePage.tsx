'use client';

import React, { useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { HomeHeader } from '@/components/layout';
import { PageContainer } from '@/components/layout';
import { Banner, HotEvents } from './Banner';
import { GameGrid, QuickActions } from './GameGrid';
import { CoachList, OnlineCoaches } from './CoachList';
import { PullToRefresh, ErrorBoundary, FadeSlideIn } from '@/components/ui';
import { hapticSuccess } from '@/utils/haptic';

export function HomePage() {
  const { navigateTo, setTab, unreadMessages } = useApp();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSearch = () => {
    navigateTo('search');
  };

  const handleMessage = () => {
    setTab(3); // 切换到消息Tab
  };

  const handleRefresh = useCallback(async () => {
    // 模拟刷新数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshKey(prev => prev + 1);
    hapticSuccess();
  }, []);

  return (
    <ErrorBoundary>
      <HomeHeader
        onSearchClick={handleSearch}
        onMessageClick={handleMessage}
        unreadCount={unreadMessages}
      />
      <PageContainer hasHeader className="pt-14 gradient-mesh">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="py-4 px-4 space-y-1" key={refreshKey}>
            {/* 轮播图 */}
            <FadeSlideIn delay={0}>
              <Banner />
            </FadeSlideIn>

            {/* 热门活动 */}
            <FadeSlideIn delay={50}>
              <HotEvents />
            </FadeSlideIn>

            {/* 快捷入口 */}
            <FadeSlideIn delay={100}>
              <QuickActions />
            </FadeSlideIn>

            {/* 游戏分类 */}
            <FadeSlideIn delay={150}>
              <GameGrid />
            </FadeSlideIn>

            {/* 在线教练 */}
            <FadeSlideIn delay={200}>
              <OnlineCoaches />
            </FadeSlideIn>

            {/* 推荐教练列表 */}
            <FadeSlideIn delay={250}>
              <CoachList />
            </FadeSlideIn>

            {/* 底部安全距离 */}
            <div className="h-4" />
          </div>
        </PullToRefresh>
      </PageContainer>
    </ErrorBoundary>
  );
}
