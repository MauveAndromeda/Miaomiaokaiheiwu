'use client';

import React from 'react';
import { games } from '@/data/mock';
import { useApp } from '@/context/AppContext';
import { ChevronRight, Zap, Gift, Target, Crown } from 'lucide-react';

export function GameGrid() {
  const { showToast } = useApp();

  const handleGameClick = (gameId: string, gameName: string) => {
    if (gameId === '8') {
      showToast('更多游戏敬请期待', 'info');
    } else {
      showToast(`进入 ${gameName}`, 'info');
    }
  };

  // 游戏图标背景渐变
  const getGameGradient = (index: number) => {
    const gradients = [
      'from-orange-500/20 to-amber-500/20 border-orange-500/30',
      'from-green-500/20 to-emerald-500/20 border-green-500/30',
      'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
      'from-purple-500/20 to-violet-500/20 border-purple-500/30',
      'from-pink-500/20 to-rose-500/20 border-pink-500/30',
      'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
      'from-teal-500/20 to-cyan-500/20 border-teal-500/30',
      'from-gray-500/20 to-slate-500/20 border-gray-500/30',
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
          <h2 className="text-lg font-bold text-text-primary">游戏分类</h2>
        </div>
        <button className="flex items-center gap-0.5 text-sm text-primary font-medium tap-effect">
          全部游戏
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {games.map((game, index) => (
          <button
            key={game.id}
            className="flex flex-col items-center gap-2 tap-effect group"
            onClick={() => handleGameClick(game.id, game.name)}
          >
            <div className={`
              w-14 h-14 rounded-2xl
              bg-gradient-to-br ${getGameGradient(index)}
              border backdrop-blur-sm
              flex items-center justify-center text-2xl
              shadow-lg group-hover:shadow-xl
              group-hover:-translate-y-0.5 group-hover:scale-105
              transition-all duration-300
            `}>
              {game.icon}
            </div>
            <span className="text-xs text-text-secondary truncate w-full text-center group-hover:text-text-primary transition-colors">
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
    {
      icon: <Zap className="w-5 h-5" />,
      label: 'AI分析',
      gradient: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-500/30',
      action: () => navigateTo('ai-analysis'),
    },
    {
      icon: <Gift className="w-5 h-5" />,
      label: '每日签到',
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/30',
      action: () => showToast('签到成功！获得10钻石', 'success'),
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: '新手任务',
      gradient: 'from-green-500 to-emerald-500',
      glow: 'shadow-green-500/30',
      action: () => showToast('任务中心开发中', 'info'),
    },
    {
      icon: <Crown className="w-5 h-5" />,
      label: 'VIP特权',
      gradient: 'from-amber-400 to-yellow-500',
      glow: 'shadow-amber-400/30',
      action: () => navigateTo('vip'),
    },
  ];

  return (
    <div className="mb-5">
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className="flex flex-col items-center gap-2 py-4 bg-surface border border-border rounded-2xl tap-effect hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300 group"
            onClick={action.action}
          >
            <div className={`
              w-10 h-10 rounded-xl
              bg-gradient-to-br ${action.gradient}
              flex items-center justify-center text-white
              shadow-lg ${action.glow}
              group-hover:scale-110 transition-transform duration-300
            `}>
              {action.icon}
            </div>
            <span className="text-xs text-text-secondary font-medium group-hover:text-text-primary transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
