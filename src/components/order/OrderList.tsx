'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Avatar, Button, EmptyState } from '@/components/ui';
import { Order, OrderStatus, OrderStatusText } from '@/types';

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待支付' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const statusColors: Record<OrderStatus, string> = {
  pending_payment: 'text-warning',
  pending_accept: 'text-primary',
  in_progress: 'text-success',
  pending_review: 'text-accent',
  completed: 'text-text-secondary',
  cancelled: 'text-text-secondary',
};

interface OrderCardProps {
  order: Order;
  onAction: (action: string, order: Order) => void;
}

function OrderCard({ order, onAction }: OrderCardProps) {
  const getActions = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment':
        return [
          { key: 'cancel', label: '取消订单', variant: 'ghost' as const },
          { key: 'pay', label: '去支付', variant: 'primary' as const },
        ];
      case 'pending_accept':
        return [
          { key: 'contact', label: '联系教练', variant: 'outline' as const },
        ];
      case 'in_progress':
        return [
          { key: 'contact', label: '联系教练', variant: 'outline' as const },
          { key: 'detail', label: '查看详情', variant: 'primary' as const },
        ];
      case 'pending_review':
        return [
          { key: 'review', label: '去评价', variant: 'primary' as const },
        ];
      case 'completed':
        return [
          { key: 'reorder', label: '再次预约', variant: 'primary' as const },
        ];
      case 'cancelled':
        return [
          { key: 'reorder', label: '重新下单', variant: 'primary' as const },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="bg-surface rounded-xl p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-secondary">订单号: {order.orderNo}</span>
        <span className={`text-sm font-medium ${statusColors[order.status]}`}>
          {OrderStatusText[order.status]}
        </span>
      </div>

      {/* 教练信息 */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
        <Avatar name={order.coach.nickname} gender={order.coach.gender} size="md" />
        <div className="flex-1">
          <div className="font-medium text-text-primary">{order.coach.nickname}</div>
          <div className="text-sm text-text-secondary">
            {order.game.icon} {order.game.name} · {order.quantity}{order.unit === 'round' ? '局' : '分钟'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-primary font-bold">{order.totalPrice}钻</div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end gap-2">
        {getActions(order.status).map((action) => (
          <Button
            key={action.key}
            size="sm"
            variant={action.variant}
            onClick={() => onAction(action.key, order)}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function OrderList() {
  const [activeTab, setActiveTab] = useState('all');
  const { orders, navigateTo, updateOrder, showToast } = useApp();

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'in_progress') {
      return ['pending_accept', 'in_progress', 'pending_review'].includes(order.status);
    }
    return order.status === activeTab;
  });

  const handleAction = (action: string, order: Order) => {
    switch (action) {
      case 'pay':
        navigateTo('payment', { orderId: order.id });
        break;
      case 'cancel':
        updateOrder(order.id, { status: 'cancelled', cancelledAt: new Date().toISOString() });
        showToast('订单已取消', 'success');
        break;
      case 'contact':
        navigateTo('chat', { targetId: order.coachId });
        break;
      case 'detail':
        navigateTo('order-detail', { orderId: order.id });
        break;
      case 'review':
        navigateTo('review', { orderId: order.id });
        break;
      case 'reorder':
        navigateTo('order-create', { coachId: order.coachId });
        break;
    }
  };

  return (
    <>
      <Header title="我的订单" />
      <div className="min-h-screen bg-background">
        <div className="pt-12">
          {/* Tab栏 */}
          <div className="sticky top-12 z-10 bg-background border-b border-border">
            <div className="flex overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors relative tap-effect ${
                    activeTab === tab.key
                      ? 'text-primary'
                      : 'text-text-secondary'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 订单列表 */}
          <div className="p-4 space-y-3">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={handleAction}
                />
              ))
            ) : (
              <EmptyState
                icon="📋"
                title="暂无订单"
                description="快去预约心仪的教练吧"
                action={{
                  text: '去首页',
                  onClick: () => navigateTo('home'),
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
