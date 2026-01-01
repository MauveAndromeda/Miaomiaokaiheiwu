'use client';

import React, { useState } from 'react';
import { coaches } from '@/data/mock';
import { useApp } from '@/context/AppContext';
import { Avatar, Badge, SimpleRating, SkeletonCard } from '@/components/ui';
import { Coach } from '@/types';

interface CoachCardProps {
  coach: Coach;
  onClick: () => void;
}

export function CoachCard({ coach, onClick }: CoachCardProps) {
  return (
    <div
      className="bg-surface rounded-xl p-4 tap-effect"
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* 头像 */}
        <Avatar
          name={coach.nickname}
          gender={coach.gender}
          size="lg"
          isOnline={coach.isOnline}
        />

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          {/* 昵称和认证 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-text-primary truncate">
              {coach.nickname}
            </span>
            <span className="text-sm">
              {coach.gender === 'female' ? '♀' : '♂'}
            </span>
          </div>

          {/* 认证标签 */}
          <div className="flex flex-wrap gap-1 mb-2">
            {coach.certifications.map((cert, index) => (
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
            {coach.games.slice(0, 3).map((game) => (
              <span
                key={game.id}
                className="text-xs text-text-secondary bg-surface-light px-2 py-0.5 rounded"
              >
                {game.icon} {game.name}
              </span>
            ))}
          </div>

          {/* 评分和接单数 */}
          <div className="flex items-center gap-3">
            <SimpleRating value={coach.rating} />
            <span className="text-xs text-text-secondary">
              接单 {coach.orderCount}
            </span>
          </div>
        </div>

        {/* 价格 */}
        <div className="flex flex-col items-end justify-between">
          <span className="text-lg font-bold text-primary">
            {coach.price}
            <span className="text-xs font-normal text-text-secondary">钻/局</span>
          </span>
          {coach.isOnline && (
            <span className="text-xs text-success">在线</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CoachList() {
  const [loading, setLoading] = useState(false);
  const { navigateTo } = useApp();

  const handleCoachClick = (coachId: string) => {
    navigateTo('coach-detail', { coachId });
  };

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-text-primary">推荐教练</h2>
        <button className="text-sm text-primary tap-effect">
          查看更多
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {coaches.map((coach) => (
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
