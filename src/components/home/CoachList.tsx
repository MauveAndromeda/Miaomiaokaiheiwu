'use client';

import React, { useState } from 'react';
import { coaches } from '@/data/mock';
import { useApp } from '@/context/AppContext';
import { Avatar, Badge, SimpleRating, SkeletonCard } from '@/components/ui';
import { Coach } from '@/types';
import { Star, MessageCircle, Play, ChevronRight, Flame, Verified, Sparkles } from 'lucide-react';

interface CoachCardProps {
  coach: Coach;
  onClick: () => void;
  variant?: 'default' | 'featured' | 'compact';
}

export function CoachCard({ coach, onClick, variant = 'default' }: CoachCardProps) {
  if (variant === 'compact') {
    return (
      <div
        className="flex-shrink-0 w-32 cursor-pointer tap-effect"
        onClick={onClick}
      >
        <div className="relative mb-2">
          <Avatar
            name={coach.nickname}
            gender={coach.gender}
            size="xl"
            isOnline={coach.isOnline}
            ring={coach.isOnline ? 'online' : 'none'}
          />
          {coach.certifications.includes('女神') && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold rounded-full shadow-lg whitespace-nowrap">
              👑 女神
            </span>
          )}
        </div>
        <h4 className="font-semibold text-text-primary text-center text-sm truncate mb-0.5">
          {coach.nickname}
        </h4>
        <p className="text-xs text-text-secondary text-center">
          {coach.games[0]?.name}
        </p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className="text-primary font-bold text-sm">{coach.price}</span>
          <span className="text-text-muted text-[10px]">钻/局</span>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div
        className="relative glass-card rounded-2xl p-4 cursor-pointer tap-effect hover:shadow-glow transition-all duration-300"
        onClick={onClick}
      >
        {/* 特色标签 */}
        <div className="absolute -top-2 -right-2 z-10">
          <span className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
            <Flame className="w-3 h-3" />
            热门
          </span>
        </div>

        <div className="flex gap-4">
          {/* 头像区 */}
          <div className="relative">
            <Avatar
              name={coach.nickname}
              gender={coach.gender}
              size="xl"
              isOnline={coach.isOnline}
              ring="gradient"
              verified
            />
            {coach.isOnline && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-success text-white text-[10px] font-bold rounded-full shadow-lg whitespace-nowrap flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                在线
              </span>
            )}
          </div>

          {/* 信息区 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-bold text-text-primary text-lg truncate">
                {coach.nickname}
              </h3>
              <span className={`text-sm ${coach.gender === 'female' ? 'text-pink-400' : 'text-blue-400'}`}>
                {coach.gender === 'female' ? '♀' : '♂'}
              </span>
              <Verified className="w-4 h-4 text-primary" />
            </div>

            {/* 认证标签 */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {coach.certifications.map((cert, index) => (
                <Badge
                  key={index}
                  variant={cert === '女神' ? 'accent' : cert === '大神' ? 'primary' : 'secondary'}
                  size="xs"
                  glow
                >
                  {cert}
                </Badge>
              ))}
            </div>

            {/* 评分区 */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-text-primary">{coach.rating}</span>
              </div>
              <span className="text-xs text-text-secondary">
                接单 <span className="text-primary font-medium">{coach.orderCount}</span>
              </span>
              <span className="text-xs text-text-secondary">
                好评 <span className="text-success font-medium">99%</span>
              </span>
            </div>

            {/* 游戏标签 */}
            <div className="flex flex-wrap gap-1.5">
              {coach.games.slice(0, 3).map((game) => (
                <span
                  key={game.id}
                  className="inline-flex items-center gap-1 text-xs bg-surface-light/80 text-text-secondary px-2 py-1 rounded-lg"
                >
                  <span>{game.icon}</span>
                  <span>{game.name}</span>
                  <span className="text-primary font-medium">{game.rank}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 价格区 */}
          <div className="flex flex-col items-end justify-between">
            <div className="text-right">
              <span className="text-2xl font-bold gradient-text">{coach.price}</span>
              <span className="text-xs text-text-muted block">钻/局</span>
            </div>
            <button className="mt-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white text-sm font-medium rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              预约
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className="bg-surface border border-border rounded-2xl p-4 cursor-pointer tap-effect hover:border-primary/30 hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* 头像 */}
        <div className="relative">
          <Avatar
            name={coach.nickname}
            gender={coach.gender}
            size="lg"
            isOnline={coach.isOnline}
            verified={coach.certifications.length > 0}
          />
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          {/* 昵称和认证 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-text-primary truncate">
              {coach.nickname}
            </span>
            <span className={`text-sm ${coach.gender === 'female' ? 'text-pink-400' : 'text-blue-400'}`}>
              {coach.gender === 'female' ? '♀' : '♂'}
            </span>
          </div>

          {/* 认证标签 */}
          <div className="flex flex-wrap gap-1 mb-2">
            {coach.certifications.slice(0, 2).map((cert, index) => (
              <Badge
                key={index}
                variant={cert === '女神' ? 'accent' : cert === '大神' ? 'primary' : 'secondary'}
                size="xs"
              >
                {cert}
              </Badge>
            ))}
          </div>

          {/* 游戏标签 */}
          <div className="flex flex-wrap gap-1 mb-2">
            {coach.games.slice(0, 2).map((game) => (
              <span
                key={game.id}
                className="text-xs text-text-secondary bg-surface-light px-2 py-0.5 rounded-lg"
              >
                {game.icon} {game.name}
              </span>
            ))}
          </div>

          {/* 评分和接单数 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-text-primary">{coach.rating}</span>
            </div>
            <span className="text-xs text-text-secondary">
              接单 {coach.orderCount}
            </span>
          </div>
        </div>

        {/* 价格 */}
        <div className="flex flex-col items-end justify-between">
          <div className="text-right">
            <span className="text-xl font-bold text-primary">{coach.price}</span>
            <span className="text-[10px] text-text-muted block">钻/局</span>
          </div>
          {coach.isOnline && (
            <span className="flex items-center gap-1 text-xs text-success">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              在线
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// 横向滚动的在线教练列表
export function OnlineCoaches() {
  const { navigateTo } = useApp();
  const onlineCoaches = coaches.filter(c => c.isOnline).slice(0, 8);

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
          <h2 className="text-lg font-bold text-text-primary">正在接单</h2>
          <span className="flex items-center gap-1 px-2 py-0.5 bg-success/20 text-success text-xs font-medium rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            {onlineCoaches.length}人在线
          </span>
        </div>
        <button className="flex items-center gap-0.5 text-sm text-primary font-medium tap-effect">
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto no-scrollbar px-1 pb-2">
        {onlineCoaches.map((coach) => (
          <CoachCard
            key={coach.id}
            coach={coach}
            variant="compact"
            onClick={() => navigateTo('coach-detail', { coachId: coach.id })}
          />
        ))}
      </div>
    </div>
  );
}

export function CoachList() {
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const { navigateTo } = useApp();

  const filters = [
    { id: 'all', label: '全部', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'hot', label: '热门', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'new', label: '新人', icon: '🆕' },
    { id: 'goddess', label: '女神', icon: '👑' },
  ];

  const handleCoachClick = (coachId: string) => {
    navigateTo('coach-detail', { coachId });
  };

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
          <h2 className="text-lg font-bold text-text-primary">推荐教练</h2>
        </div>
        <button className="flex items-center gap-0.5 text-sm text-primary font-medium tap-effect">
          查看更多
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {filters.map((filter) => (
          <button
            key={filter.id}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
              whitespace-nowrap transition-all duration-300 tap-effect
              ${activeFilter === filter.id
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25'
                : 'bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-primary/30'}
            `}
            onClick={() => setActiveFilter(filter.id)}
          >
            <span className="text-sm">{typeof filter.icon === 'string' ? filter.icon : filter.icon}</span>
            {filter.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* 第一个用featured样式 */}
          {coaches.slice(0, 1).map((coach) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              variant="featured"
              onClick={() => handleCoachClick(coach.id)}
            />
          ))}
          {/* 其余用default样式 */}
          {coaches.slice(1).map((coach) => (
            <CoachCard
              key={coach.id}
              coach={coach}
              onClick={() => handleCoachClick(coach.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
