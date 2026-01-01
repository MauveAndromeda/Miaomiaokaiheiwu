'use client';

import React from 'react';
import { Home, Compass, Radio, MessageCircle, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { CountBadge } from '@/components/ui';

const tabs = [
  { icon: Home, label: '首页', key: 'home' },
  { icon: Compass, label: '发现', key: 'discover' },
  { icon: Radio, label: '直播', key: 'live' },
  { icon: MessageCircle, label: '消息', key: 'messages' },
  { icon: User, label: '我的', key: 'profile' },
];

export function TabBar() {
  const { currentTab, setTab, unreadMessages } = useApp();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border safe-area-inset-bottom z-30">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = currentTab === index;
          const showBadge = tab.key === 'messages' && unreadMessages > 0;

          return (
            <button
              key={tab.key}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 tap-effect"
              onClick={() => setTab(index)}
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={`transition-colors duration-150 ${
                    isActive ? 'text-primary' : 'text-text-secondary'
                  }`}
                  fill={isActive ? 'currentColor' : 'none'}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-2">
                    <CountBadge count={unreadMessages} size="sm" />
                  </span>
                )}
              </div>
              <span
                className={`text-xs transition-colors duration-150 ${
                  isActive ? 'text-primary font-medium' : 'text-text-secondary'
                }`}
              >
                {tab.label}
              </span>
              {/* 选中指示器 */}
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
