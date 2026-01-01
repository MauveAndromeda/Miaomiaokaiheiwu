'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Avatar, Badge, Button, Rating, Tag } from '@/components/ui';
import { coaches } from '@/data/mock';

export function CoachDetail() {
  const { pageParams, navigateTo, isFavorite, toggleFavorite, showToast } = useApp();
  const coachId = pageParams.coachId;
  const coach = coaches.find(c => c.id === coachId);
  const [isFollowed, setIsFollowed] = useState(false);

  if (!coach) {
    return (
      <>
        <Header title="教练详情" />
        <PageContainer hasHeader hasTabBar={false} className="flex items-center justify-center">
          <span className="text-text-secondary">教练不存在</span>
        </PageContainer>
      </>
    );
  }

  const handleFollow = () => {
    setIsFollowed(!isFollowed);
    showToast(isFollowed ? '已取消关注' : '关注成功', 'success');
  };

  const handleFavorite = () => {
    toggleFavorite(coach.id);
    showToast(isFavorite(coach.id) ? '已取消收藏' : '收藏成功', 'success');
  };

  const handleChat = () => {
    navigateTo('chat', { targetId: coach.id });
  };

  const handleOrder = () => {
    navigateTo('order-create', { coachId: coach.id });
  };

  return (
    <>
      <Header title="教练详情" />
      <div className="min-h-screen bg-background pb-20">
        {/* 头部信息 */}
        <div className="pt-14 px-4">
          <div className="bg-surface rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-4">
              {/* 大头像 */}
              <Avatar
                name={coach.nickname}
                gender={coach.gender}
                size="2xl"
                isOnline={coach.isOnline}
              />

              <div className="flex-1">
                {/* 昵称和性别 */}
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-xl font-bold text-text-primary">{coach.nickname}</h1>
                  <span className={coach.gender === 'female' ? 'text-accent' : 'text-primary'}>
                    {coach.gender === 'female' ? '♀' : '♂'}
                  </span>
                </div>

                {/* 认证标签 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {coach.certifications.map((cert, index) => (
                    <Badge
                      key={index}
                      variant={cert === '女神' ? 'accent' : cert === '大神' ? 'primary' : 'secondary'}
                    >
                      {cert}
                    </Badge>
                  ))}
                </div>

                {/* 关注按钮 */}
                <Button
                  variant={isFollowed ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleFollow}
                >
                  {isFollowed ? '已关注' : '+ 关注'}
                </Button>
              </div>
            </div>

            {/* 数据统计 */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-lg font-bold text-text-primary">{coach.orderCount}</div>
                <div className="text-xs text-text-secondary">接单数</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-success">{coach.goodRate}%</div>
                <div className="text-xs text-text-secondary">好评率</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-text-primary">{coach.fansCount}</div>
                <div className="text-xs text-text-secondary">粉丝</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-text-primary">{coach.followCount}</div>
                <div className="text-xs text-text-secondary">关注</div>
              </div>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="bg-surface rounded-2xl p-4 mb-4">
            <h3 className="font-semibold text-text-primary mb-3">服务价格</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎮</span>
                  <span className="text-text-primary">陪练</span>
                </div>
                <span className="text-primary font-bold">{coach.price}钻/局</span>
              </div>
              {coach.voicePrice && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎙️</span>
                    <span className="text-text-primary">语音</span>
                  </div>
                  <span className="text-primary font-bold">{coach.voicePrice}钻/分钟</span>
                </div>
              )}
              {coach.videoPrice && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📹</span>
                    <span className="text-text-primary">视频</span>
                  </div>
                  <span className="text-primary font-bold">{coach.videoPrice}钻/分钟</span>
                </div>
              )}
            </div>
          </div>

          {/* 服务标签 */}
          <div className="bg-surface rounded-2xl p-4 mb-4">
            <h3 className="font-semibold text-text-primary mb-3">服务标签</h3>
            <div className="flex flex-wrap gap-2">
              {coach.serviceTags.map((tag, index) => (
                <Tag key={index}>{tag}</Tag>
              ))}
            </div>
          </div>

          {/* 游戏段位 */}
          <div className="bg-surface rounded-2xl p-4 mb-4">
            <h3 className="font-semibold text-text-primary mb-3">游戏段位</h3>
            <div className="space-y-3">
              {coach.ranks.map((rank, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-2xl">{rank.rankIcon}</span>
                  <div>
                    <div className="text-text-primary">{rank.gameName}</div>
                    <div className="text-sm text-text-secondary">{rank.rank}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 个人介绍 */}
          {coach.introduction && (
            <div className="bg-surface rounded-2xl p-4 mb-4">
              <h3 className="font-semibold text-text-primary mb-3">个人介绍</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {coach.introduction}
              </p>
            </div>
          )}

          {/* 用户评价 */}
          <div className="bg-surface rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-text-primary">用户评价</h3>
              <button className="text-sm text-primary flex items-center tap-effect">
                查看全部 <ChevronRight size={16} />
              </button>
            </div>
            {coach.reviews.length > 0 ? (
              <div className="space-y-4">
                {coach.reviews.map((review) => (
                  <div key={review.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={review.userNickname} size="sm" />
                      <span className="text-sm text-text-primary">{review.userNickname}</span>
                      <Rating value={review.rating} size="sm" />
                    </div>
                    <p className="text-sm text-text-secondary mb-2">{review.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {review.tags.map((tag, i) => (
                        <span key={i} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-center py-4">暂无评价</p>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 safe-area-inset-bottom">
          <div className="flex items-center gap-4">
            <button className="p-3 tap-effect" onClick={handleFavorite}>
              <Heart
                size={24}
                className={isFavorite(coach.id) ? 'text-error fill-error' : 'text-text-secondary'}
              />
            </button>
            <button className="p-3 tap-effect" onClick={handleChat}>
              <MessageCircle size={24} className="text-text-secondary" />
            </button>
            <Button fullWidth size="lg" onClick={handleOrder}>
              立即预约
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
