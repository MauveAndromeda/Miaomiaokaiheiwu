'use client';

import React, { useState } from 'react';
import { Check, Wallet, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Button, Card } from '@/components/ui';

export function Payment() {
  const { pageParams, orders, user, updateOrder, consume, navigateTo, showToast } = useApp();
  const orderId = pageParams.orderId;
  const order = orders.find(o => o.id === orderId);

  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'wechat' | 'alipay'>('balance');
  const [loading, setLoading] = useState(false);

  if (!order) {
    return (
      <>
        <Header title="支付" />
        <PageContainer hasHeader hasTabBar={false} className="flex items-center justify-center">
          <span className="text-text-secondary">订单不存在</span>
        </PageContainer>
      </>
    );
  }

  const balance = user?.balance || 0;
  const canPayWithBalance = balance >= order.totalPrice;

  const handlePayment = async () => {
    if (paymentMethod === 'balance' && !canPayWithBalance) {
      showToast('余额不足，请充值', 'error');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (paymentMethod === 'balance') {
      consume(order.totalPrice, `预约教练 ${order.coach.nickname}`);
    }

    updateOrder(order.id, {
      status: 'pending_accept',
      paidAt: new Date().toISOString(),
    });

    setLoading(false);
    showToast('支付成功', 'success');
    navigateTo('order-detail', { orderId: order.id });
  };

  const paymentMethods = [
    {
      id: 'balance',
      name: '余额支付',
      icon: <Wallet size={24} className="text-primary" />,
      extra: `(余额 ${balance}钻)`,
      disabled: false,
    },
    {
      id: 'wechat',
      name: '微信支付',
      icon: <MessageCircle size={24} className="text-[#07C160]" />,
      extra: '',
      disabled: false,
    },
    {
      id: 'alipay',
      name: '支付宝',
      icon: <span className="text-[#1677FF] text-2xl font-bold">支</span>,
      extra: '',
      disabled: false,
    },
  ];

  return (
    <>
      <Header title="支付" />
      <div className="min-h-screen bg-background pb-24">
        <div className="pt-14 px-4 py-4 space-y-4">
          {/* 订单信息 */}
          <Card>
            <div className="text-center py-4">
              <div className="text-text-secondary mb-2">支付金额</div>
              <div className="text-3xl font-bold text-primary">{order.totalPrice}钻</div>
            </div>
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">订单号</span>
                <span className="text-text-primary">{order.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">服务内容</span>
                <span className="text-text-primary">
                  {order.coach.nickname} · {order.serviceType === 'play' ? '陪练' : order.serviceType === 'voice' ? '语音' : '视频'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">游戏</span>
                <span className="text-text-primary">{order.game.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">数量</span>
                <span className="text-text-primary">
                  {order.quantity}{order.unit === 'round' ? '局' : '分钟'}
                </span>
              </div>
            </div>
          </Card>

          {/* 支付方式 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-4">选择支付方式</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors tap-effect ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface-light'
                  }`}
                  onClick={() => setPaymentMethod(method.id as any)}
                  disabled={method.disabled}
                >
                  <div className="flex items-center gap-3">
                    {method.icon}
                    <span className="text-text-primary">{method.name}</span>
                    {method.extra && (
                      <span className="text-text-secondary text-sm">{method.extra}</span>
                    )}
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === method.id
                        ? 'border-primary bg-primary'
                        : 'border-border'
                    }`}
                  >
                    {paymentMethod === method.id && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 余额不足提示 */}
            {paymentMethod === 'balance' && !canPayWithBalance && (
              <div className="mt-4 p-3 bg-error/10 rounded-xl flex items-center justify-between">
                <span className="text-error text-sm">余额不足，还差 {order.totalPrice - balance} 钻</span>
                <Button size="sm" onClick={() => navigateTo('recharge')}>
                  去充值
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* 底部按钮 */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 safe-area-inset-bottom">
          <Button
            fullWidth
            size="lg"
            loading={loading}
            onClick={handlePayment}
            disabled={paymentMethod === 'balance' && !canPayWithBalance}
          >
            确认支付
          </Button>
        </div>
      </div>
    </>
  );
}
