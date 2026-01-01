'use client';

import React from 'react';
import { games } from '@/data/mock';
import { useApp } from '@/context/AppContext';

export function GameGrid() {
  const { showToast } = useApp();

  const handleGameClick = (gameId: string, gameName: string) => {
    if (gameId === '8') {
      showToast('更多游戏敬请期待', 'info');
    } else {
      showToast(`进入 ${gameName}`, 'info');
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-primary">游戏分类</h2>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {games.map((game) => (
          <button
            key={game.id}
            className="flex flex-col items-center gap-2 tap-effect"
            onClick={() => handleGameClick(game.id, game.name)}
          >
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center text-2xl shadow-sm">
              {game.icon}
            </div>
            <span className="text-xs text-text-secondary truncate w-full text-center">
              {game.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 快捷功能入口
export function QuickActions() {
  const { navigateTo, showToast } = useApp();

  const actions = [
    { icon: '🤖', label: 'AI分析', action: () => navigateTo('ai-analysis') },
    { icon: '🎁', label: '每日签到', action: () => showToast('签到成功！获得10钻石', 'success') },
    { icon: '🎯', label: '新手任务', action: () => showToast('任务中心开发中', 'info') },
    { icon: '👑', label: 'VIP特权', action: () => navigateTo('vip') },
  ];

  return (
    <div className="mb-6">
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className="flex flex-col items-center gap-1.5 py-3 bg-surface rounded-xl tap-effect"
            onClick={action.action}
          >
            <span className="text-xl">{action.icon}</span>
            <span className="text-xs text-text-secondary">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
