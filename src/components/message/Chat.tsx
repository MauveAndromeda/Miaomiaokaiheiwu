'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Phone, Video, Send, Mic, MoreVertical } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/layout';
import { Avatar, Button } from '@/components/ui';
import { coaches } from '@/data/mock';

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'voice';
  voiceDuration?: number;
  time: string;
  isMine: boolean;
}

export function Chat() {
  const { pageParams, user, navigateTo, showToast } = useApp();
  const targetId = pageParams.targetId;
  const coach = coaches.find(c => c.id === targetId);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      senderId: targetId,
      content: '你好呀～想要一起开黑吗？',
      type: 'text',
      time: '10:30',
      isMine: false,
    },
    {
      id: '2',
      senderId: user?.id || '',
      content: '你好！想预约你的陪练服务',
      type: 'text',
      time: '10:31',
      isMine: true,
    },
    {
      id: '3',
      senderId: targetId,
      content: '好的，请问你想玩什么游戏呢？',
      type: 'text',
      time: '10:32',
      isMine: false,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || '',
      content: inputValue.trim(),
      type: 'text',
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    // 模拟回复
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        senderId: targetId,
        content: '好的，那我们开始吧～',
        type: 'text',
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMine: false,
      };
      setMessages(prev => [...prev, replyMessage]);
    }, 1000);
  };

  const handleVoiceCall = () => {
    navigateTo('voice-call', { targetId });
  };

  const handleVideoCall = () => {
    navigateTo('video-call', { targetId });
  };

  if (!coach) {
    return (
      <>
        <Header title="聊天" />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <span className="text-text-secondary">用户不存在</span>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title={coach.nickname}
        rightContent={
          <div className="flex items-center gap-2">
            <button className="p-2 tap-effect" onClick={handleVoiceCall}>
              <Phone size={20} className="text-text-primary" />
            </button>
            <button className="p-2 tap-effect" onClick={handleVideoCall}>
              <Video size={20} className="text-text-primary" />
            </button>
          </div>
        }
      />

      <div className="min-h-screen bg-background flex flex-col">
        {/* 消息列表 */}
        <div className="flex-1 pt-14 pb-20 px-4 overflow-y-auto">
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${message.isMine ? 'flex-row-reverse' : ''}`}
              >
                <Avatar
                  name={message.isMine ? user?.nickname : coach.nickname}
                  gender={message.isMine ? undefined : coach.gender}
                  size="sm"
                />
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    message.isMine
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-surface text-text-primary rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <span className="text-xs text-text-secondary">{message.time}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入框 */}
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-3 safe-area-inset-bottom">
          <div className="flex items-center gap-3">
            <button className="p-2 tap-effect">
              <Mic size={22} className="text-text-secondary" />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              className="flex-1 bg-surface-light rounded-full px-4 py-2 text-text-primary"
            />
            <button
              className={`p-2 rounded-full tap-effect ${inputValue.trim() ? 'bg-primary' : 'bg-surface-light'}`}
              onClick={handleSend}
            >
              <Send size={20} className={inputValue.trim() ? 'text-white' : 'text-text-secondary'} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
