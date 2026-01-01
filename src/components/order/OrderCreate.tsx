'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Avatar, Button, Card } from '@/components/ui';
import { Textarea } from '@/components/ui/Input';
import { coaches, games, coupons } from '@/data/mock';

export function OrderCreate() {
  const { pageParams, navigateTo, createOrder, showToast, user } = useApp();
  const coachId = pageParams.coachId;
  const coach = coaches.find(c => c.id === coachId);

  const [serviceType, setServiceType] = useState<'play' | 'voice' | 'video'>('play');
  const [selectedGame, setSelectedGame] = useState(coach?.games[0] || games[0]);
  const [quantity, setQuantity] = useState(1);
  const [remark, setRemark] = useState('');
  const [selectedCoupon, setSelectedCoupon] = useState<typeof coupons[0] | null>(null);

  if (!coach) {
    return (
      <>
        <Header title="预约下单" />
        <PageContainer hasHeader hasTabBar={false} className="flex items-center justify-center">
          <span className="text-text-secondary">教练不存在</span>
        </PageContainer>
      </>
    );
  }

  const quantityOptions = serviceType === 'play'
    ? [1, 3, 5, 10]
    : [30, 60, 120]; // 分钟

  const getPrice = () => {
    if (serviceType === 'play') return coach.price;
    if (serviceType === 'voice') return coach.voicePrice || 0;
    return coach.videoPrice || 0;
  };

  const totalPrice = getPrice() * quantity;
  const discount = selectedCoupon ? Math.min(selectedCoupon.discount, totalPrice) : 0;
  const finalPrice = totalPrice - discount;

  const handleSubmit = () => {
    if (!user) {
      showToast('请先登录', 'error');
      return;
    }

    const order = createOrder({
      coachId: coach.id,
      coach,
      userId: user.id,
      serviceType,
      game: selectedGame,
      quantity,
      unit: serviceType === 'play' ? 'round' : 'minute',
      price: totalPrice,
      discount,
      totalPrice: finalPrice,
      remark,
    });

    navigateTo('payment', { orderId: order.id });
  };

  return (
    <>
      <Header title="预约下单" />
      <div className="min-h-screen bg-background pb-24">
        <div className="pt-14 px-4 py-4 space-y-4">
          {/* 教练信息 */}
          <Card>
            <div className="flex items-center gap-3">
              <Avatar
                name={coach.nickname}
                gender={coach.gender}
                size="lg"
                isOnline={coach.isOnline}
              />
              <div className="flex-1">
                <div className="font-semibold text-text-primary">{coach.nickname}</div>
                <div className="text-sm text-text-secondary">
                  {coach.certifications.join(' · ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-primary font-bold">{getPrice()}钻</div>
                <div className="text-xs text-text-secondary">
                  /{serviceType === 'play' ? '局' : '分钟'}
                </div>
              </div>
            </div>
          </Card>

          {/* 服务类型 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">服务类型</h3>
            <div className="flex gap-3">
              <button
                className={`flex-1 py-3 rounded-lg border transition-colors tap-effect ${
                  serviceType === 'play'
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-surface-light border-transparent text-text-secondary'
                }`}
                onClick={() => setServiceType('play')}
              >
                🎮 陪练
              </button>
              {coach.voicePrice && (
                <button
                  className={`flex-1 py-3 rounded-lg border transition-colors tap-effect ${
                    serviceType === 'voice'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-light border-transparent text-text-secondary'
                  }`}
                  onClick={() => setServiceType('voice')}
                >
                  🎙️ 语音
                </button>
              )}
              {coach.videoPrice && (
                <button
                  className={`flex-1 py-3 rounded-lg border transition-colors tap-effect ${
                    serviceType === 'video'
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-light border-transparent text-text-secondary'
                  }`}
                  onClick={() => setServiceType('video')}
                >
                  📹 视频
                </button>
              )}
            </div>
          </Card>

          {/* 游戏选择 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">选择游戏</h3>
            <div className="flex gap-2 flex-wrap">
              {coach.games.map((game) => (
                <button
                  key={game.id}
                  className={`px-4 py-2 rounded-lg border transition-colors tap-effect ${
                    selectedGame.id === game.id
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-light border-transparent text-text-secondary'
                  }`}
                  onClick={() => setSelectedGame(game)}
                >
                  {game.icon} {game.name}
                </button>
              ))}
            </div>
          </Card>

          {/* 数量选择 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">
              选择{serviceType === 'play' ? '局数' : '时长'}
            </h3>
            <div className="flex gap-3">
              {quantityOptions.map((qty) => (
                <button
                  key={qty}
                  className={`flex-1 py-3 rounded-lg border transition-colors tap-effect ${
                    quantity === qty
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface-light border-transparent text-text-secondary'
                  }`}
                  onClick={() => setQuantity(qty)}
                >
                  {qty}{serviceType === 'play' ? '局' : '分钟'}
                </button>
              ))}
            </div>
          </Card>

          {/* 订单备注 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">订单备注</h3>
            <Textarea
              placeholder="请输入备注信息（选填）"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              maxLength={200}
              showCount
              rows={3}
            />
          </Card>

          {/* 优惠券 */}
          <Card onClick={() => showToast('优惠券选择功能开发中', 'info')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎁</span>
                <span className="text-text-primary">优惠券</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <span>{selectedCoupon ? `-${selectedCoupon.discount}钻` : '选择优惠券'}</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </Card>

          {/* 费用明细 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">费用明细</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-text-secondary">
                <span>服务费</span>
                <span>{totalPrice}钻</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success">
                  <span>优惠</span>
                  <span>-{discount}钻</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-border">
                <span className="font-semibold text-text-primary">实付</span>
                <span className="font-bold text-primary text-xl">{finalPrice}钻</span>
              </div>
            </div>
          </Card>
        </div>

        {/* 底部按钮 */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 safe-area-inset-bottom">
          <Button fullWidth size="lg" onClick={handleSubmit}>
            立即下单 · {finalPrice}钻
          </Button>
        </div>
      </div>
    </>
  );
}
