'use client';

import React from 'react';
import { Phone, MessageCircle, Copy, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Avatar, Badge, Button, Card, EmptyState } from '@/components/ui';
import { hapticSuccess } from '@/utils/haptic';
import { coaches } from '@/data/mock';

const statusConfig = {
  pending_payment: { label: '待支付', color: 'text-warning', icon: Clock, bgColor: 'bg-warning/10' },
  pending_accept: { label: '待接单', color: 'text-primary', icon: Clock, bgColor: 'bg-primary/10' },
  in_progress: { label: '进行中', color: 'text-success', icon: Clock, bgColor: 'bg-success/10' },
  pending_review: { label: '待评价', color: 'text-secondary', icon: CheckCircle, bgColor: 'bg-secondary/10' },
  completed: { label: '已完成', color: 'text-success', icon: CheckCircle, bgColor: 'bg-success/10' },
  cancelled: { label: '已取消', color: 'text-text-muted', icon: XCircle, bgColor: 'bg-surface-light' },
  refunded: { label: '已退款', color: 'text-error', icon: AlertCircle, bgColor: 'bg-error/10' },
};

export function OrderDetail() {
  const { orders, pageParams, navigateTo, goBack, showToast } = useApp();

  const orderId = pageParams?.orderId as string;
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <>
        <Header title="订单详情" onBack={goBack} />
        <PageContainer hasHeader>
          <EmptyState
            icon="📋"
            title="订单不存在"
            description="该订单可能已被删除或不存在"
            action={{ text: '返回订单列表', onClick: () => navigateTo('orders') }}
          />
        </PageContainer>
      </>
    );
  }

  const coach = coaches.find((c) => c.id === order.coachId);
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(order.id);
      hapticSuccess();
      showToast('订单号已复制', 'success');
    } catch {
      showToast('复制失败', 'error');
    }
  };

  const handleContact = () => {
    if (coach) {
      navigateTo('chat', { recipientId: coach.id });
    }
  };

  const handleCall = () => {
    if (coach) {
      navigateTo('voice-call', { recipientId: coach.id });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Header title="订单详情" onBack={goBack} />
      <PageContainer hasHeader>
        {/* 订单状态 */}
        <div className={`${status.bgColor} p-6 text-center`}>
          <StatusIcon size={48} className={`${status.color} mx-auto mb-2`} />
          <div className={`text-xl font-bold ${status.color}`}>{status.label}</div>
          {order.status === 'pending_payment' && (
            <div className="text-sm text-text-secondary mt-1">请在15分钟内完成支付</div>
          )}
          {order.status === 'in_progress' && (
            <div className="text-sm text-text-secondary mt-1">教练正在为您服务</div>
          )}
        </div>

        {/* 教练信息 */}
        {coach && (
          <Card className="mx-4 mt-4">
            <div className="flex items-center gap-4">
              <Avatar name={coach.nickname} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-text-primary truncate">{coach.nickname}</span>
                  {coach.certifications.includes('女神') && <Badge variant="accent" size="xs">女神</Badge>}
                </div>
                <div className="text-xs text-text-secondary">{order.game.name}</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center tap-effect"
                  onClick={handleContact}
                >
                  <MessageCircle size={18} className="text-primary" />
                </button>
                <button
                  className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center tap-effect"
                  onClick={handleCall}
                >
                  <Phone size={18} className="text-success" />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* 订单信息 */}
        <Card className="mx-4 mt-4">
          <h3 className="font-medium text-text-primary mb-4">订单信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">订单编号</span>
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-mono text-sm">{order.id}</span>
                <button className="tap-effect" onClick={handleCopyOrderId}>
                  <Copy size={14} className="text-primary" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">服务类型</span>
              <span className="text-text-primary">{order.serviceType === 'play' ? '游戏陪练' : order.serviceType === 'voice' ? '语音陪聊' : '视频陪聊'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">游戏</span>
              <span className="text-text-primary">{order.game.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">数量</span>
              <span className="text-text-primary">{order.quantity}{order.serviceType === 'play' ? '局' : '小时'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">创建时间</span>
              <span className="text-text-primary text-sm">{formatDate(order.createdAt)}</span>
            </div>
            {order.remark && (
              <div className="flex justify-between items-start">
                <span className="text-text-secondary">备注</span>
                <span className="text-text-primary text-right max-w-[60%]">{order.remark}</span>
              </div>
            )}
          </div>
        </Card>

        {/* 价格明细 */}
        <Card className="mx-4 mt-4">
          <h3 className="font-medium text-text-primary mb-4">价格明细</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">单价</span>
              <span className="text-text-primary">¥{order.price}/{order.serviceType === 'play' ? '局' : '小时'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">数量</span>
              <span className="text-text-primary">x{order.quantity}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-text-secondary font-medium">实付金额</span>
              <span className="text-primary text-xl font-bold">¥{order.totalPrice}</span>
            </div>
          </div>
        </Card>

        {/* 底部操作按钮 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 flex gap-3">
          {order.status === 'pending_payment' && (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => showToast('取消订单功能开发中', 'info')}
              >
                取消订单
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => navigateTo('payment', { orderId: order.id })}
              >
                立即支付
              </Button>
            </>
          )}
          {order.status === 'pending_review' && (
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => navigateTo('review', { orderId: order.id })}
            >
              去评价
            </Button>
          )}
          {order.status === 'in_progress' && coach && (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleContact}
              >
                联系教练
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => showToast('完成订单功能开发中', 'info')}
              >
                确认完成
              </Button>
            </>
          )}
          {(order.status === 'completed' || order.status === 'cancelled') && (
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => coach && navigateTo('coach-detail', { coachId: coach.id })}
            >
              再次下单
            </Button>
          )}
        </div>

        <div className="h-24" />
      </PageContainer>
    </>
  );
}
