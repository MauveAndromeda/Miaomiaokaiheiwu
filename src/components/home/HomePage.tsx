'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { HomeHeader } from '@/components/layout';
import { PageContainer } from '@/components/layout';
import { Banner, HotEvents } from './Banner';
import { GameGrid, QuickActions } from './GameGrid';
import { CoachList, OnlineCoaches } from './CoachList';

export function HomePage() {
  const { navigateTo, setTab, unreadMessages } = useApp();

  const handleSearch = () => {
    navigateTo('search');
  };

  const handleMessage = () => {
    setTab(3); // 切换到消息Tab
  };

  return (
    <>
      <HomeHeader
        onSearchClick={handleSearch}
        onMessageClick={handleMessage}
        unreadCount={unreadMessages}
      />
      <PageContainer hasHeader className="pt-14 gradient-mesh">
        <div className="py-4 px-4 space-y-1">
          {/* 轮播图 */}
          <Banner />

          {/* 热门活动 */}
          <HotEvents />

          {/* 快捷入口 */}
          <QuickActions />

          {/* 游戏分类 */}
          <GameGrid />

          {/* 在线教练 */}
          <OnlineCoaches />

          {/* 推荐教练列表 */}
          <CoachList />

          {/* 底部安全距离 */}
          <div className="h-4" />
        </div>
      </PageContainer>
    </>
  );
}
