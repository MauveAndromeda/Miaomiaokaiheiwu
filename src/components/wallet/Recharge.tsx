'use client';

import React, { useState } from 'react';
import { Check, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { rechargeOptions } from '@/data/mock';

export function Recharge() {
  const [selectedOption, setSelectedOption] = useState(rechargeOptions[1]);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const { recharge, navigateTo, showToast } = useApp();

  const handleRecharge = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    recharge(selectedOption.amount, selectedOption.diamonds + selectedOption.bonus);
    setLoading(false);
    showToast(`充值成功！获得 ${selectedOption.diamonds + selectedOption.bonus} 钻`, 'success');
    navigateTo('wallet');
  };

  type RechargePaymentType = 'wechat' | 'alipay';

  const paymentMethods: Array<{
    id: RechargePaymentType;
    name: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'wechat',
      name: '微信支付',
      icon: <MessageCircle size={24} className="text-[#07C160]" />,
    },
    {
      id: 'alipay',
      name: '支付宝',
      icon: <span className="text-[#1677FF] text-2xl font-bold">支</span>,
    },
  ];

  return (
    <>
      <Header title="充值" />
      <div className="min-h-screen bg-background pb-24">
        <div className="pt-14 px-4 py-4 space-y-4">
          {/* 充值档位 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-4">选择充值金额</h3>
            <div className="grid grid-cols-3 gap-3">
              {rechargeOptions.map((option) => (
                <button
                  key={option.id}
                  className={`relative p-4 rounded-xl border transition-colors tap-effect ${
                    selectedOption.id === option.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface-light'
                  }`}
                  onClick={() => setSelectedOption(option)}
                >
                  {option.isHot && (
                    <span className="absolute -top-2 -right-2 bg-error text-white text-xs px-2 py-0.5 rounded-full">
                      热门
                    </span>
                  )}
                  <div className="text-lg font-bold text-primary">{option.diamonds}钻</div>
                  {option.bonus > 0 && (
                    <div className="text-xs text-success">送{option.bonus}钻</div>
                  )}
                  <div className="text-sm text-text-secondary mt-1">¥{option.amount}</div>
                </button>
              ))}
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
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <div className="flex items-center gap-3">
                    {method.icon}
                    <span className="text-text-primary">{method.name}</span>
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
          </Card>

          {/* 充值说明 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">充值说明</h3>
            <ul className="text-sm text-text-secondary space-y-2">
              <li>• 1元 = 10钻石</li>
              <li>• 充值后钻石立即到账</li>
              <li>• 钻石可用于预约教练、购买礼物等</li>
              <li>• 如有问题请联系客服</li>
            </ul>
          </Card>
        </div>

        {/* 底部按钮 */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 safe-area-inset-bottom">
          <Button fullWidth size="lg" loading={loading} onClick={handleRecharge}>
            立即充值 ¥{selectedOption.amount}
          </Button>
        </div>
      </div>
    </>
  );
}
