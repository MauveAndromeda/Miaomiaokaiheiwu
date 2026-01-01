'use client';

import React from 'react';
import { Users, Play } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageContainer } from '@/components/layout';
import { Badge } from '@/components/ui';
import { liveRooms } from '@/data/mock';

export function LiveList() {
  const { navigateTo } = useApp();

  const formatViewers = (count: number) => {
    if (count >= 10000) return (count / 10000).toFixed(1) + 'w';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  return (
    <PageContainer className="pt-14">
      <div className="py-4">
        <h1 className="text-xl font-bold text-text-primary mb-4">直播</h1>

        <div className="grid grid-cols-2 gap-3">
          {liveRooms.map((room) => (
            <button
              key={room.id}
              className="relative bg-surface rounded-xl overflow-hidden tap-effect"
              onClick={() => navigateTo('live-room', { roomId: room.id })}
            >
              {/* 封面 */}
              <div className="aspect-[3/4] bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                <Play size={32} className="text-white/60" />
              </div>

              {/* 直播标识 */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="px-2 py-0.5 bg-error rounded text-white text-xs font-medium">
                  直播中
                </span>
              </div>

              {/* 观看人数 */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
                <Users size={12} className="text-white" />
                <span className="text-white text-xs">{formatViewers(room.viewerCount)}</span>
              </div>

              {/* 信息 */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="text-white text-sm font-medium truncate mb-1">
                  {room.title}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-xs">{room.hostNickname}</span>
                  <Badge size="xs" variant="outline">
                    {room.game}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
