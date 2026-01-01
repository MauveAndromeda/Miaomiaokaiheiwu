'use client';

import React, { useState } from 'react';
import { Heart, Grid, List } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Avatar, Badge, Card, EmptyState } from '@/components/ui';
import { coaches } from '@/data/mock';
import { Coach } from '@/types';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'coach' | 'video' | 'live';

export function Favorites() {
  const { navigateTo, goBack } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // 模拟收藏数据 - 从coaches中随机选取一些作为收藏
  const favoriteCoaches = coaches.slice(0, 4);

  const filters: { type: FilterType; label: string }[] = [
    { type: 'all', label: '全部' },
    { type: 'coach', label: '教练' },
    { type: 'video', label: '视频' },
    { type: 'live', label: '直播' },
  ];

  const renderCoachCard = (coach: Coach) => {
    if (viewMode === 'grid') {
      return (
        <Card
          key={coach.id}
          className="overflow-hidden"
          onClick={() => navigateTo('coach-detail', { coachId: coach.id })}
        >
          <div className="relative">
            <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Avatar name={coach.nickname} size="xl" />
            </div>
            <button
              className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center tap-effect"
              onClick={(e) => {
                e.stopPropagation();
                // 取消收藏逻辑
              }}
            >
              <Heart size={16} className="text-error fill-error" />
            </button>
            {coach.isOnline && (
              <span className="absolute bottom-2 left-2 px-2 py-1 bg-success/90 text-white text-xs rounded-full">
                在线
              </span>
            )}
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1 mb-1">
              <span className="font-medium text-text-primary truncate">{coach.nickname}</span>
              {coach.certifications.includes('女神') && <Badge variant="accent" size="xs">女神</Badge>}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span>¥{coach.price}/局</span>
              <span>•</span>
              <span>{coach.orderCount}单</span>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card
        key={coach.id}
        className="flex items-center gap-4"
        onClick={() => navigateTo('coach-detail', { coachId: coach.id })}
      >
        <div className="relative">
          <Avatar name={coach.nickname} size="lg" />
          {coach.isOnline && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-success border-2 border-white rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-text-primary truncate">{coach.nickname}</span>
            {coach.certifications.includes('女神') && <Badge variant="accent" size="xs">女神</Badge>}
            {coach.certifications.includes('大神') && <Badge variant="secondary" size="xs">大神</Badge>}
          </div>
          <div className="text-xs text-text-secondary">
            {coach.games.slice(0, 2).map(g => g.name).join(' • ')}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-warning">★ {coach.rating}</span>
            <span className="text-text-muted">{coach.orderCount}单</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-primary font-medium">¥{coach.price}</div>
          <div className="text-xs text-text-muted">/局</div>
        </div>
        <button
          className="p-2 tap-effect"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Heart size={20} className="text-error fill-error" />
        </button>
      </Card>
    );
  };

  return (
    <>
      <Header
        title="我的收藏"
        onBack={goBack}
        rightContent={
          <div className="flex items-center gap-2">
            <button
              className={`p-2 tap-effect rounded-lg ${viewMode === 'grid' ? 'bg-primary/10' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={18} className={viewMode === 'grid' ? 'text-primary' : 'text-text-secondary'} />
            </button>
            <button
              className={`p-2 tap-effect rounded-lg ${viewMode === 'list' ? 'bg-primary/10' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={18} className={viewMode === 'list' ? 'text-primary' : 'text-text-secondary'} />
            </button>
          </div>
        }
      />
      <PageContainer hasHeader>
        {/* 筛选标签 */}
        <div className="flex items-center gap-2 py-3 px-4 overflow-x-auto scrollbar-hide">
          {filters.map((filter) => (
            <button
              key={filter.type}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap tap-effect transition-all ${
                filterType === filter.type
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-text-secondary'
              }`}
              onClick={() => setFilterType(filter.type)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 收藏列表 */}
        {favoriteCoaches.length > 0 ? (
          <div className={`p-4 ${viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}`}>
            {favoriteCoaches.map(renderCoachCard)}
          </div>
        ) : (
          <EmptyState
            icon="❤️"
            title="暂无收藏"
            description="去发现喜欢的教练和内容吧"
            action={{
              text: '去发现',
              onClick: () => navigateTo('home'),
            }}
          />
        )}
      </PageContainer>
    </>
  );
}
