'use client';

import React from 'react';
import { Settings, ChevronRight, ShoppingBag, Wallet, Heart, BarChart3, Star, HelpCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageContainer } from '@/components/layout';
import { Avatar, Badge, Card } from '@/components/ui';

export function Profile() {
  const { user, orders, navigateTo, showToast } = useApp();

  const orderCounts = {
    pending_payment: orders.filter(o => o.status === 'pending_payment').length,
    in_progress: orders.filter(o => ['pending_accept', 'in_progress'].includes(o.status)).length,
    pending_review: orders.filter(o => o.status === 'pending_review').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  const menuItems = [
    {
      icon: <ShoppingBag size={20} className="text-primary" />,
      label: '我的订单',
      badge: orders.filter(o => o.status !== 'cancelled' && o.status !== 'completed').length,
      onClick: () => navigateTo('orders'),
    },
    {
      icon: <Wallet size={20} className="text-success" />,
      label: '我的钱包',
      value: `${user?.balance || 0}钻`,
      onClick: () => navigateTo('wallet'),
    },
    {
      icon: <Heart size={20} className="text-error" />,
      label: '我的收藏',
      onClick: () => navigateTo('favorites'),
    },
    {
      icon: <BarChart3 size={20} className="text-secondary" />,
      label: 'AI分析',
      onClick: () => navigateTo('ai-analysis'),
    },
    {
      icon: <Star size={20} className="text-warning" />,
      label: '我的评价',
      onClick: () => showToast('功能开发中', 'info'),
    },
    {
      icon: <HelpCircle size={20} className="text-text-secondary" />,
      label: '帮助中心',
      onClick: () => showToast('功能开发中', 'info'),
    },
  ];

  return (
    <PageContainer className="pt-0">
      {/* 头部背景 */}
      <div className="bg-gradient-to-br from-primary to-secondary pt-12 pb-20 px-4 -mx-4">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xl font-bold text-white">我的</span>
          <button
            className="p-2 tap-effect"
            onClick={() => navigateTo('settings')}
          >
            <Settings size={22} className="text-white" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <Avatar
            name={user?.nickname}
            size="xl"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl font-bold text-white">{user?.nickname || '游客'}</span>
              {user?.vipLevel && user.vipLevel > 0 && (
                <Badge variant="vip" size="xs">VIP{user.vipLevel}</Badge>
              )}
            </div>
            <div className="text-white/70 text-sm">ID: {user?.id || '-'}</div>
          </div>
          <button
            className="px-3 py-1.5 bg-white/20 rounded-full text-white text-sm tap-effect"
            onClick={() => showToast('编辑资料功能开发中', 'info')}
          >
            编辑资料
          </button>
        </div>
      </div>

      {/* 数据统计 */}
      <Card className="-mt-10 mx-0">
        <div className="grid grid-cols-3 divide-x divide-border">
          <button
            className="text-center py-2 tap-effect"
            onClick={() => showToast('功能开发中', 'info')}
          >
            <div className="text-xl font-bold text-text-primary">{user?.followCount || 0}</div>
            <div className="text-xs text-text-secondary">关注</div>
          </button>
          <button
            className="text-center py-2 tap-effect"
            onClick={() => showToast('功能开发中', 'info')}
          >
            <div className="text-xl font-bold text-text-primary">{user?.fansCount || 0}</div>
            <div className="text-xs text-text-secondary">粉丝</div>
          </button>
          <button
            className="text-center py-2 tap-effect"
            onClick={() => showToast('功能开发中', 'info')}
          >
            <div className="text-xl font-bold text-text-primary">{user?.likeCount || 0}</div>
            <div className="text-xs text-text-secondary">获赞</div>
          </button>
        </div>
      </Card>

      {/* 订单入口 */}
      <Card className="mt-4 mx-0">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-text-primary">我的订单</span>
          <button
            className="text-sm text-primary flex items-center tap-effect"
            onClick={() => navigateTo('orders')}
          >
            全部订单 <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: '待支付', count: orderCounts.pending_payment, status: 'pending_payment' },
            { label: '进行中', count: orderCounts.in_progress, status: 'in_progress' },
            { label: '待评价', count: orderCounts.pending_review, status: 'pending_review' },
            { label: '已完成', count: orderCounts.completed, status: 'completed' },
          ].map((item) => (
            <button
              key={item.status}
              className="relative flex flex-col items-center gap-1 py-2 tap-effect"
              onClick={() => navigateTo('orders', { tab: item.status })}
            >
              {item.count > 0 && (
                <span className="absolute -top-1 right-2 w-5 h-5 bg-error rounded-full text-white text-xs flex items-center justify-center">
                  {item.count}
                </span>
              )}
              <span className="text-2xl">
                {item.status === 'pending_payment' && '💳'}
                {item.status === 'in_progress' && '🎮'}
                {item.status === 'pending_review' && '⭐'}
                {item.status === 'completed' && '✅'}
              </span>
              <span className="text-xs text-text-secondary">{item.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 功能菜单 */}
      <Card className="mt-4 mx-0">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className="w-full flex items-center justify-between py-3 tap-effect"
              onClick={item.onClick}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-text-primary">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && item.badge > 0 && (
                  <span className="bg-error text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                {item.value && (
                  <span className="text-text-secondary text-sm">{item.value}</span>
                )}
                <ChevronRight size={18} className="text-text-secondary" />
              </div>
            </button>
          ))}
        </div>
      </Card>

      <div className="h-20" />
    </PageContainer>
  );
}
