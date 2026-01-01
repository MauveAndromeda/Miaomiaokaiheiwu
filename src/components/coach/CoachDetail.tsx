'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, ChevronRight, Star, Play, Phone, Video, Shield, Award, Users, ThumbsUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TransparentHeader, PageContainer } from '@/components/layout';
import { Avatar, Badge, Button, Rating, Tag, Card, VIPBadge, VerifiedBadge } from '@/components/ui';
import { coaches } from '@/data/mock';

export function CoachDetail() {
  const { pageParams, navigateTo, isFavorite, toggleFavorite, showToast } = useApp();
  const coachId = pageParams.coachId;
  const coach = coaches.find(c => c.id === coachId);
  const [isFollowed, setIsFollowed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!coach) {
    return (
      <>
        <TransparentHeader title="教练详情" />
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
      <TransparentHeader
        title={coach.nickname}
        scrolled={scrolled}
        rightContent={
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm tap-effect">
            <Share2 size={18} className="text-white" />
          </button>
        }
      />

      <div className="min-h-screen bg-background pb-24">
        {/* Hero区域 - 大背景 */}
        <div className="relative h-72">
          {/* 渐变背景 */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

          {/* 装饰光效 */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/30 rounded-full blur-3xl" />
          <div className="absolute top-20 right-10 w-24 h-24 bg-accent/30 rounded-full blur-3xl" />

          {/* 头像区 - 居中 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
            <div className="relative">
              <Avatar
                name={coach.nickname}
                gender={coach.gender}
                size="3xl"
                isOnline={coach.isOnline}
                ring="gradient"
              />
              {coach.isOnline && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 bg-success text-white text-xs font-bold rounded-full shadow-lg shadow-success/50 flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  在线接单
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 主要内容区 */}
        <div className="px-4 pt-20">
          {/* 名称和基础信息 */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-text-primary">{coach.nickname}</h1>
              <span className={`text-lg ${coach.gender === 'female' ? 'text-pink-400' : 'text-blue-400'}`}>
                {coach.gender === 'female' ? '♀' : '♂'}
              </span>
            </div>

            {/* 认证标签 */}
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {coach.certifications.map((cert, index) => (
                cert === '女神' ? (
                  <VerifiedBadge key={index} type="goddess" size="md" />
                ) : cert === '大神' ? (
                  <VerifiedBadge key={index} type="pro" size="md" />
                ) : (
                  <Badge key={index} variant="secondary" size="md" glow>
                    {cert}
                  </Badge>
                )
              ))}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-center gap-3">
              <Button
                variant={isFollowed ? 'outline' : 'gradient'}
                size="md"
                rounded="full"
                onClick={handleFollow}
              >
                {isFollowed ? '已关注' : '+ 关注'}
              </Button>
              <Button
                variant="glass"
                size="md"
                rounded="full"
                icon={<MessageCircle size={16} />}
                onClick={handleChat}
              >
                私信
              </Button>
            </div>
          </div>

          {/* 数据统计卡片 */}
          <div className="glass-card rounded-3xl p-5 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold gradient-text tabular-nums">{coach.orderCount}</div>
                <div className="text-xs text-text-secondary mt-1">接单数</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-success tabular-nums">{coach.goodRate}%</div>
                <div className="text-xs text-text-secondary mt-1">好评率</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-text-primary tabular-nums">{coach.fansCount}</div>
                <div className="text-xs text-text-secondary mt-1">粉丝</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-text-primary tabular-nums">{coach.followCount}</div>
                <div className="text-xs text-text-secondary mt-1">关注</div>
              </div>
            </div>
          </div>

          {/* 服务价格 */}
          <div className="bg-surface border border-border rounded-3xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
              <h3 className="font-bold text-text-primary">服务价格</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white shadow-lg shadow-primary/30">
                  <Play size={18} />
                </div>
                <div className="text-xs text-text-secondary mb-1">陪练</div>
                <div className="text-lg font-bold text-primary">{coach.price}<span className="text-xs font-normal">钻</span></div>
              </div>
              {coach.voicePrice && (
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                    <Phone size={18} />
                  </div>
                  <div className="text-xs text-text-secondary mb-1">语音</div>
                  <div className="text-lg font-bold text-green-400">{coach.voicePrice}<span className="text-xs font-normal">钻/分</span></div>
                </div>
              )}
              {coach.videoPrice && (
                <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-4 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-accent to-pink-600 flex items-center justify-center text-white shadow-lg shadow-accent/30">
                    <Video size={18} />
                  </div>
                  <div className="text-xs text-text-secondary mb-1">视频</div>
                  <div className="text-lg font-bold text-accent">{coach.videoPrice}<span className="text-xs font-normal">钻/分</span></div>
                </div>
              )}
            </div>
          </div>

          {/* 服务标签 */}
          <div className="bg-surface border border-border rounded-3xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
              <h3 className="font-bold text-text-primary">服务标签</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {coach.serviceTags.map((tag, index) => (
                <Tag key={index} variant="pill">{tag}</Tag>
              ))}
            </div>
          </div>

          {/* 游戏段位 */}
          <div className="bg-surface border border-border rounded-3xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
              <h3 className="font-bold text-text-primary">游戏段位</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {coach.ranks.map((rank, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-surface-light rounded-2xl">
                  <span className="text-3xl">{rank.rankIcon}</span>
                  <div>
                    <div className="font-medium text-text-primary">{rank.gameName}</div>
                    <div className="text-sm text-primary font-medium">{rank.rank}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 个人介绍 */}
          {coach.introduction && (
            <div className="bg-surface border border-border rounded-3xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
                <h3 className="font-bold text-text-primary">个人介绍</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                {coach.introduction}
              </p>
            </div>
          )}

          {/* 用户评价 */}
          <div className="bg-surface border border-border rounded-3xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-primary to-secondary rounded-full" />
                <h3 className="font-bold text-text-primary">用户评价</h3>
                <span className="text-sm text-text-muted">({coach.reviews.length})</span>
              </div>
              <button className="flex items-center gap-0.5 text-sm text-primary font-medium tap-effect">
                查看全部
                <ChevronRight size={16} />
              </button>
            </div>

            {coach.reviews.length > 0 ? (
              <div className="space-y-4">
                {coach.reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={review.userNickname} size="sm" />
                      <span className="text-sm font-medium text-text-primary">{review.userNickname}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-text-muted'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary mb-2 leading-relaxed">{review.content}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {review.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-text-secondary">暂无评价，快来第一个评价吧</p>
              </div>
            )}
          </div>

          {/* 安全保障 */}
          <div className="glass-card rounded-3xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center">
                <Shield size={20} className="text-green-400" />
              </div>
              <div>
                <div className="font-medium text-text-primary">平台安全保障</div>
                <div className="text-xs text-text-secondary">实名认证 · 交易保障 · 7天无忧退款</div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="fixed bottom-0 left-0 right-0 z-30">
          {/* 毛玻璃背景 */}
          <div className="absolute inset-0 bg-surface/90 backdrop-blur-xl border-t border-white/5" />

          <div className="relative flex items-center gap-3 p-4 safe-area-bottom">
            <button
              className={`
                w-12 h-12 flex items-center justify-center rounded-2xl
                bg-white/5 border border-white/10 tap-effect
                transition-all duration-300
                ${isFavorite(coach.id) ? 'text-error' : 'text-text-secondary hover:text-text-primary'}
              `}
              onClick={handleFavorite}
            >
              <Heart size={22} fill={isFavorite(coach.id) ? 'currentColor' : 'none'} />
            </button>

            <button
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary tap-effect transition-all duration-300"
              onClick={handleChat}
            >
              <MessageCircle size={22} />
            </button>

            <Button
              fullWidth
              size="lg"
              variant="gradient"
              rounded="full"
              onClick={handleOrder}
              className="shadow-xl shadow-primary/30"
            >
              立即预约 · {coach.price}钻/局
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
