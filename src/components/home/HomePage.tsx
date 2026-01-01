'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { HomeHeader } from '@/components/layout';
import { PageContainer, ScrollContainer } from '@/components/layout';
import { Banner } from './Banner';
import { GameGrid, QuickActions } from './GameGrid';
import { CoachList } from './CoachList';

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
      <PageContainer hasHeader className="pt-14">
        <div className="py-4">
          <Banner />
          <QuickActions />
          <GameGrid />
          <CoachList />
        </div>
      </PageContainer>
    </>
  );
}
