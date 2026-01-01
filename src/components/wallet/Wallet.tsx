'use client';

import React from 'react';
import { Plus, ArrowUpRight, Crown, ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Button, Card } from '@/components/ui';

export function Wallet() {
  const { user, navigateTo, showToast } = useApp();

  return (
    <>
      <Header title="我的钱包" />
      <div className="min-h-screen bg-background">
        <div className="pt-14 px-4 py-4 space-y-4">
          {/* 余额卡片 */}
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white">
            <div className="text-sm opacity-80 mb-2">钻石余额</div>
            <div className="text-4xl font-bold mb-6">
              {user?.balance || 0}
              <span className="text-lg font-normal ml-1">钻</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 bg-white/20 text-white hover:bg-white/30"
                onClick={() => navigateTo('recharge')}
              >
                <Plus size={18} className="mr-1" />
                充值
              </Button>
              <Button
                variant="ghost"
                className="flex-1 bg-white/20 text-white hover:bg-white/30"
                onClick={() => showToast('提现功能开发中', 'info')}
              >
                <ArrowUpRight size={18} className="mr-1" />
                提现
              </Button>
            </div>
          </div>

          {/* VIP入口 */}
          <Card onClick={() => navigateTo('vip')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full vip-gradient flex items-center justify-center">
                  <Crown size={20} className="text-white" />
                </div>
                <div>
                  <div className="font-semibold text-text-primary">VIP会员</div>
                  <div className="text-sm text-text-secondary">尊享专属特权</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-text-secondary">
                <span className="text-sm">
                  {user?.vipLevel ? `VIP${user.vipLevel}` : '开通'}
                </span>
                <ChevronRight size={18} />
              </div>
            </div>
          </Card>

          {/* 功能入口 */}
          <Card>
            <div className="space-y-4">
              <button
                className="w-full flex items-center justify-between tap-effect"
                onClick={() => navigateTo('transactions')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <span className="text-text-primary">交易记录</span>
                </div>
                <ChevronRight size={18} className="text-text-secondary" />
              </button>
              <button
                className="w-full flex items-center justify-between tap-effect"
                onClick={() => showToast('优惠券功能开发中', 'info')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎁</span>
                  <span className="text-text-primary">优惠券</span>
                </div>
                <div className="flex items-center gap-1 text-text-secondary">
                  <span className="text-sm">2张可用</span>
                  <ChevronRight size={18} />
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
