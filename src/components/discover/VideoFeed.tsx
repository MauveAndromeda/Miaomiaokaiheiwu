'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Plus, Play } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageContainer } from '@/components/layout';
import { Avatar, BottomSheet } from '@/components/ui';
import { videos } from '@/data/mock';

export function VideoFeed() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoList, setVideoList] = useState(videos);
  const [showComments, setShowComments] = useState(false);
  const { showToast } = useApp();

  const handleLike = (videoId: string) => {
    setVideoList(prev => prev.map(v => {
      if (v.id === videoId) {
        const isLiked = !v.isLiked;
        return {
          ...v,
          isLiked,
          likeCount: isLiked ? v.likeCount + 1 : v.likeCount - 1,
        };
      }
      return v;
    }));
  };

  const handleFollow = (videoId: string) => {
    setVideoList(prev => prev.map(v => {
      if (v.id === videoId) {
        const isFollowed = !v.isFollowed;
        showToast(isFollowed ? '关注成功' : '已取消关注', 'success');
        return { ...v, isFollowed };
      }
      return v;
    }));
  };

  const handleShare = () => {
    showToast('分享功能开发中', 'info');
  };

  const handleScroll = (direction: 'up' | 'down') => {
    if (direction === 'down' && currentIndex < videoList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'up' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentVideo = videoList[currentIndex];

  const formatCount = (count: number) => {
    if (count >= 10000) return (count / 10000).toFixed(1) + 'w';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  return (
    <PageContainer noPadding hasTabBar className="pt-0">
      <div
        className="h-screen bg-black relative overflow-hidden"
        onTouchStart={(e) => {
          const startY = e.touches[0].clientY;
          const handleTouchEnd = (endE: TouchEvent) => {
            const endY = endE.changedTouches[0].clientY;
            const diff = startY - endY;
            if (Math.abs(diff) > 50) {
              handleScroll(diff > 0 ? 'down' : 'up');
            }
            document.removeEventListener('touchend', handleTouchEnd);
          };
          document.addEventListener('touchend', handleTouchEnd);
        }}
      >
        {/* 视频区域 */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/30">
          <div className="text-center">
            <Play size={64} className="text-white/80 mx-auto mb-4" />
            <p className="text-white/60 text-sm">视频播放区域</p>
          </div>
        </div>

        {/* 右侧操作栏 */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          {/* 头像 */}
          <div className="relative">
            <Avatar
              name={currentVideo.userNickname}
              size="lg"
            />
            <button
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center ${
                currentVideo.isFollowed ? 'bg-surface-light' : 'bg-primary'
              }`}
              onClick={() => handleFollow(currentVideo.id)}
            >
              <Plus size={14} className="text-white" />
            </button>
          </div>

          {/* 点赞 */}
          <button
            className="flex flex-col items-center gap-1 tap-effect"
            onClick={() => handleLike(currentVideo.id)}
          >
            <Heart
              size={32}
              className={currentVideo.isLiked ? 'text-error fill-error animate-heartbeat' : 'text-white'}
            />
            <span className="text-white text-xs">{formatCount(currentVideo.likeCount)}</span>
          </button>

          {/* 评论 */}
          <button
            className="flex flex-col items-center gap-1 tap-effect"
            onClick={() => setShowComments(true)}
          >
            <MessageCircle size={32} className="text-white" />
            <span className="text-white text-xs">{formatCount(currentVideo.commentCount)}</span>
          </button>

          {/* 分享 */}
          <button
            className="flex flex-col items-center gap-1 tap-effect"
            onClick={handleShare}
          >
            <Share2 size={28} className="text-white" />
            <span className="text-white text-xs">{formatCount(currentVideo.shareCount)}</span>
          </button>
        </div>

        {/* 底部信息 */}
        <div className="absolute left-4 right-20 bottom-20 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">@{currentVideo.userNickname}</span>
          </div>
          <p className="text-sm line-clamp-2">{currentVideo.title}</p>
        </div>

        {/* 视频指示器 */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {videoList.map((_, index) => (
            <div
              key={index}
              className={`w-1 h-4 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 评论区 */}
      <BottomSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        title={`${currentVideo.commentCount} 条评论`}
        height="half"
      >
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Avatar name={`用户${i}`} size="sm" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-text-primary">用户{i}</span>
                  <span className="text-xs text-text-secondary">1小时前</span>
                </div>
                <p className="text-sm text-text-secondary">太厉害了！学到了很多</p>
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>
    </PageContainer>
  );
}
