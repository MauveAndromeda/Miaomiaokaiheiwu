'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, Gift, Send, Users, Share2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Avatar, Button, BottomSheet } from '@/components/ui';
import { liveRooms, gifts } from '@/data/mock';

interface Danmaku {
  id: string;
  nickname: string;
  content: string;
  type: 'text' | 'gift';
  giftName?: string;
}

export function LiveRoom() {
  const { pageParams, goBack, showToast, user, consume } = useApp();
  const roomId = pageParams.roomId;
  const room = liveRooms.find(r => r.id === roomId);

  const [isFollowed, setIsFollowed] = useState(false);
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([
    { id: '1', nickname: '游客123', content: '主播好厉害！', type: 'text' },
    { id: '2', nickname: '小明', content: '学到了', type: 'text' },
    { id: '3', nickname: '王者玩家', content: '送出了 鲜花', type: 'gift', giftName: '🌹' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  // 模拟弹幕
  useEffect(() => {
    const interval = setInterval(() => {
      const randomDanmaku: Danmaku = {
        id: Date.now().toString(),
        nickname: `用户${Math.floor(Math.random() * 1000)}`,
        content: ['666', '太强了', '学到了', '主播厉害', '冲冲冲'][Math.floor(Math.random() * 5)],
        type: 'text',
      };
      setDanmakuList(prev => [...prev.slice(-20), randomDanmaku]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSendDanmaku = () => {
    if (!inputValue.trim()) return;

    const newDanmaku: Danmaku = {
      id: Date.now().toString(),
      nickname: user?.nickname || '游客',
      content: inputValue.trim(),
      type: 'text',
    };
    setDanmakuList(prev => [...prev, newDanmaku]);
    setInputValue('');
  };

  const handleSendGift = (gift: typeof gifts[0]) => {
    if (!user || user.balance < gift.price) {
      showToast('余额不足', 'error');
      return;
    }

    consume(gift.price, `直播间送礼 ${gift.name}`);

    const giftDanmaku: Danmaku = {
      id: Date.now().toString(),
      nickname: user.nickname,
      content: `送出了 ${gift.name}`,
      type: 'gift',
      giftName: gift.icon,
    };
    setDanmakuList(prev => [...prev, giftDanmaku]);
    setShowGiftPanel(false);
    showToast(`送出 ${gift.name} 成功`, 'success');
  };

  const handleLike = () => {
    setLikeCount(prev => prev + 1);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-text-secondary">直播间不存在</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* 视频区域 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
        <span className="text-white/60">直播画面</span>
      </div>

      {/* 顶部信息 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between safe-area-inset-top">
        <div className="flex items-center gap-3 bg-black/50 rounded-full p-1 pr-4">
          <Avatar name={room.hostNickname} size="sm" />
          <div>
            <div className="text-white text-sm font-medium">{room.hostNickname}</div>
            <div className="text-white/60 text-xs flex items-center gap-1">
              <Users size={10} />
              {room.viewerCount}
            </div>
          </div>
          <button
            className={`px-3 py-1 rounded-full text-xs ${
              isFollowed ? 'bg-surface-light text-white/60' : 'bg-primary text-white'
            }`}
            onClick={() => {
              setIsFollowed(!isFollowed);
              showToast(isFollowed ? '已取消关注' : '关注成功', 'success');
            }}
          >
            {isFollowed ? '已关注' : '关注'}
          </button>
        </div>

        <button
          className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center tap-effect"
          onClick={goBack}
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* 弹幕区域 */}
      <div className="absolute left-4 right-20 bottom-32 max-h-48 overflow-hidden">
        <div className="space-y-2">
          {danmakuList.slice(-8).map((danmaku) => (
            <div
              key={danmaku.id}
              className={`inline-block rounded-full px-3 py-1 text-sm animate-fade-in ${
                danmaku.type === 'gift' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-black/50'
              }`}
            >
              <span className="text-primary">{danmaku.nickname}: </span>
              <span className="text-white">
                {danmaku.giftName || ''} {danmaku.content}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧按钮 */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-4">
        <button
          className="relative tap-effect"
          onClick={handleLike}
        >
          <Heart size={32} className="text-error fill-error" />
          {likeCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {likeCount > 99 ? '99+' : likeCount}
            </span>
          )}
        </button>
        <button className="tap-effect" onClick={() => showToast('分享功能开发中', 'info')}>
          <Share2 size={28} className="text-white" />
        </button>
      </div>

      {/* 底部输入栏 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 safe-area-inset-bottom flex items-center gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="说点什么..."
          className="flex-1 bg-white/20 rounded-full px-4 py-2 text-white placeholder:text-white/60"
          onKeyPress={(e) => e.key === 'Enter' && handleSendDanmaku()}
        />
        <button
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center tap-effect"
          onClick={handleSendDanmaku}
        >
          <Send size={18} className="text-white" />
        </button>
        <button
          className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center tap-effect"
          onClick={() => setShowGiftPanel(true)}
        >
          <Gift size={18} className="text-white" />
        </button>
      </div>

      {/* 礼物面板 */}
      <BottomSheet
        isOpen={showGiftPanel}
        onClose={() => setShowGiftPanel(false)}
        title="送礼物"
      >
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4">
            {gifts.map((gift) => (
              <button
                key={gift.id}
                className="flex flex-col items-center gap-1 p-3 bg-surface-light rounded-xl tap-effect"
                onClick={() => handleSendGift(gift)}
              >
                <span className="text-3xl">{gift.icon}</span>
                <span className="text-xs text-text-primary">{gift.name}</span>
                <span className="text-xs text-primary">{gift.price}钻</span>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
