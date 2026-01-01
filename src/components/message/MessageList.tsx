'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageContainer } from '@/components/layout';
import { Avatar, CountBadge, EmptyState } from '@/components/ui';

export function MessageList() {
  const { conversations, navigateTo, markConversationRead } = useApp();

  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleClick = (conversationId: string, targetId: string) => {
    markConversationRead(conversationId);
    if (targetId === 'system') {
      // 系统消息
    } else {
      navigateTo('chat', { targetId });
    }
  };

  return (
    <PageContainer className="pt-14">
      <div className="py-4">
        <h1 className="text-xl font-bold text-text-primary mb-4 px-4">消息</h1>

        {conversations.length > 0 ? (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface tap-effect"
                onClick={() => handleClick(conv.id, conv.targetId)}
              >
                <div className="relative">
                  <Avatar
                    name={conv.targetNickname}
                    size="lg"
                  />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1">
                      <CountBadge count={conv.unreadCount} />
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-text-primary truncate">
                      {conv.targetNickname}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary truncate">
                    {conv.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="💬"
            title="暂无消息"
            description="快去找教练聊天吧"
          />
        )}
      </div>
    </PageContainer>
  );
}
