'use client';

import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Filter, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Card, EmptyState } from '@/components/ui';

type TransactionType = 'all' | 'income' | 'expense';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'pending' | 'failed';
}

// 模拟交易数据
const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    amount: 50,
    title: '游戏陪练',
    description: '王者荣耀 x2局',
    time: '2024-01-15 14:30',
    status: 'completed',
  },
  {
    id: '2',
    type: 'income',
    amount: 100,
    title: '充值',
    description: '微信支付',
    time: '2024-01-15 10:00',
    status: 'completed',
  },
  {
    id: '3',
    type: 'expense',
    amount: 30,
    title: '语音陪聊',
    description: '30分钟',
    time: '2024-01-14 20:00',
    status: 'completed',
  },
  {
    id: '4',
    type: 'income',
    amount: 200,
    title: '充值',
    description: '支付宝',
    time: '2024-01-13 16:45',
    status: 'completed',
  },
  {
    id: '5',
    type: 'expense',
    amount: 80,
    title: '视频陪聊',
    description: '1小时',
    time: '2024-01-12 21:00',
    status: 'completed',
  },
  {
    id: '6',
    type: 'expense',
    amount: 25,
    title: '游戏陪练',
    description: '和平精英 x1局',
    time: '2024-01-11 19:30',
    status: 'completed',
  },
];

export function Transactions() {
  const { goBack, user } = useApp();
  const [filterType, setFilterType] = useState<TransactionType>('all');

  const filters: { type: TransactionType; label: string }[] = [
    { type: 'all', label: '全部' },
    { type: 'income', label: '收入' },
    { type: 'expense', label: '支出' },
  ];

  const filteredTransactions = mockTransactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  // 按日期分组
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.time.split(' ')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const totalIncome = mockTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = mockTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <Header
        title="交易记录"
        onBack={goBack}
        rightContent={
          <button className="p-2 tap-effect">
            <Calendar size={20} className="text-text-secondary" />
          </button>
        }
      />
      <PageContainer hasHeader>
        {/* 统计概览 */}
        <div className="bg-gradient-to-br from-primary to-secondary p-4 mx-4 mt-4 rounded-xl text-white">
          <div className="text-center mb-4">
            <div className="text-sm opacity-80">当前余额</div>
            <div className="text-3xl font-bold">{user?.balance || 0}钻</div>
          </div>
          <div className="flex justify-around">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowDownLeft size={14} />
                <span className="text-xs opacity-80">总收入</span>
              </div>
              <div className="font-semibold">{totalIncome}钻</div>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <ArrowUpRight size={14} />
                <span className="text-xs opacity-80">总支出</span>
              </div>
              <div className="font-semibold">{totalExpense}钻</div>
            </div>
          </div>
        </div>

        {/* 筛选标签 */}
        <div className="flex items-center gap-2 py-3 px-4">
          {filters.map((filter) => (
            <button
              key={filter.type}
              className={`px-4 py-1.5 rounded-full text-sm tap-effect transition-all ${
                filterType === filter.type
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-text-secondary'
              }`}
              onClick={() => setFilterType(filter.type)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 交易列表 */}
        {Object.keys(groupedTransactions).length > 0 ? (
          <div className="px-4 space-y-4 pb-4">
            {Object.entries(groupedTransactions).map(([date, transactions]) => (
              <div key={date}>
                <div className="text-xs text-text-muted mb-2">{date}</div>
                <Card className="divide-y divide-border">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'income'
                              ? 'bg-success/10'
                              : 'bg-error/10'
                          }`}
                        >
                          {transaction.type === 'income' ? (
                            <ArrowDownLeft
                              size={18}
                              className="text-success"
                            />
                          ) : (
                            <ArrowUpRight size={18} className="text-error" />
                          )}
                        </div>
                        <div>
                          <div className="text-text-primary font-medium">
                            {transaction.title}
                          </div>
                          <div className="text-xs text-text-muted">
                            {transaction.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-semibold ${
                            transaction.type === 'income'
                              ? 'text-success'
                              : 'text-text-primary'
                          }`}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {transaction.amount}钻
                        </div>
                        <div className="text-xs text-text-muted">
                          {transaction.time.split(' ')[1]}
                        </div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="暂无交易记录"
            description="您还没有任何交易记录"
          />
        )}
      </PageContainer>
    </>
  );
}
