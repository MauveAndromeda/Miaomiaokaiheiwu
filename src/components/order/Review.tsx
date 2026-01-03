'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Avatar, Button, Card, Rating, Tag } from '@/components/ui';
import { Textarea } from '@/components/ui/Input';

const quickTags = [
  '技术很棒',
  '态度超好',
  '声音好听',
  '很有耐心',
  '配合默契',
  '下次还约',
];

export function Review() {
  const { pageParams, orders, updateOrder, navigateTo, showToast } = useApp();
  const orderId = pageParams.orderId;
  const order = orders.find(o => o.id === orderId);

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  if (!order) {
    return (
      <>
        <Header title="评价" />
        <PageContainer hasHeader hasTabBar={false} className="flex items-center justify-center">
          <span className="text-text-secondary">订单不存在</span>
        </PageContainer>
      </>
    );
  }

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    updateOrder(order.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      review: {
        id: `r${Date.now()}`,
        userId: order.userId,
        userNickname: '用户',
        userAvatar: '',
        rating,
        content,
        tags: selectedTags,
        createdAt: new Date().toISOString(),
      },
    });

    setLoading(false);
    showToast('评价成功', 'success');
    navigateTo('orders');
  };

  return (
    <>
      <Header title="评价" />
      <div className="min-h-screen bg-background pb-24">
        <div className="pt-14 px-4 py-4 space-y-4">
          {/* 教练信息 */}
          <Card>
            <div className="flex items-center gap-3">
              <Avatar
                name={order.coach.nickname}
                gender={order.coach.gender}
                size="lg"
              />
              <div>
                <div className="font-semibold text-text-primary">{order.coach.nickname}</div>
                <div className="text-sm text-text-secondary">
                  {order.game.name} · {order.quantity}{order.unit === 'round' ? '局' : '分钟'}
                </div>
              </div>
            </div>
          </Card>

          {/* 评分 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-4 text-center">服务评分</h3>
            <div className="flex justify-center">
              <Rating
                value={rating}
                size="lg"
                interactive
                onChange={setRating}
              />
            </div>
            <div className="text-center mt-2">
              <span className="text-text-secondary text-sm">
                {rating === 5 && '非常满意'}
                {rating === 4 && '比较满意'}
                {rating === 3 && '一般般'}
                {rating === 2 && '不太满意'}
                {rating === 1 && '很不满意'}
              </span>
            </div>
          </Card>

          {/* 快捷标签 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">选择标签</h3>
            <div className="flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <Tag
                  key={tag}
                  selected={selectedTags.includes(tag)}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </Card>

          {/* 文字评价 */}
          <Card>
            <h3 className="font-semibold text-text-primary mb-3">文字评价（选填）</h3>
            <Textarea
              placeholder="分享你的指导体验..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={200}
              showCount
              rows={4}
            />
          </Card>
        </div>

        {/* 底部按钮 */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-4 safe-area-inset-bottom">
          <Button fullWidth size="lg" loading={loading} onClick={handleSubmit}>
            提交评价
          </Button>
        </div>
      </div>
    </>
  );
}
