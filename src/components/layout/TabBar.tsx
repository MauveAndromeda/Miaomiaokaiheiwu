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
    <div className="fixed bottom-0 left-0 right-0 z-30">
      {/* 毛玻璃背景 */}
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-xl border-t border-white/5" />

      {/* 顶部高光线 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex items-center justify-around h-16 safe-area-bottom">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = currentTab === index;
          const showBadge = tab.key === 'messages' && unreadMessages > 0;

          return (
            <button
              key={tab.key}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 tap-effect group"
              onClick={() => setTab(index)}
            >
              {/* 选中背景光晕 */}
              {isActive && (
                <div className="absolute inset-x-2 top-1 bottom-1 bg-primary/10 rounded-2xl transition-all duration-300" />
              )}

              <div className="relative">
                {/* 图标容器 */}
                <div className={`
                  relative p-1.5 rounded-xl transition-all duration-300
                  ${isActive ? 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/30' : ''}
                `}>
                  <Icon
                    size={isActive ? 20 : 22}
                    className={`transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-text-secondary group-hover:text-text-primary'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                {/* 消息角标 */}
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5">
                    <CountBadge count={unreadMessages} size="xs" />
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive
                    ? 'text-primary'
                    : 'text-text-secondary group-hover:text-text-primary'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 悬浮式底部导航 (可选的另一种风格)
export function FloatingTabBar() {
  const { currentTab, setTab, unreadMessages } = useApp();

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30">
      <div className="relative">
        {/* 毛玻璃容器 */}
        <div className="absolute inset-0 bg-surface/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl" />

        {/* 内容 */}
        <div className="relative flex items-center justify-around h-16 px-2">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = currentTab === index;
            const showBadge = tab.key === 'messages' && unreadMessages > 0;

            return (
              <button
                key={tab.key}
                className={`
                  relative flex flex-col items-center justify-center
                  w-14 h-14 rounded-2xl tap-effect
                  transition-all duration-300
                  ${isActive ? 'bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/40' : 'hover:bg-white/5'}
                `}
                onClick={() => setTab(index)}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    className={`transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-text-secondary'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {showBadge && (
                    <span className="absolute -top-1 -right-2">
                      <CountBadge count={unreadMessages} size="xs" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-medium transition-colors duration-300 ${
                    isActive ? 'text-white' : 'text-text-muted'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
