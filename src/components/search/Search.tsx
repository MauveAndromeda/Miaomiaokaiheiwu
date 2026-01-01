'use client';

import React, { useState } from 'react';
import { Search as SearchIcon, X, Clock, TrendingUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/layout';
import { Avatar, Tag, EmptyState } from '@/components/ui';
import { coaches, hotSearches } from '@/data/mock';

export function Search() {
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { searchHistory, addSearchHistory, clearSearchHistory, navigateTo, goBack } = useApp();

  const handleSearch = (searchKeyword: string) => {
    if (!searchKeyword.trim()) return;
    setKeyword(searchKeyword);
    addSearchHistory(searchKeyword.trim());
    setIsSearching(true);
  };

  const searchResults = isSearching
    ? coaches.filter(
        (coach) =>
          coach.nickname.toLowerCase().includes(keyword.toLowerCase()) ||
          coach.games.some((g) => g.name.toLowerCase().includes(keyword.toLowerCase())) ||
          coach.certifications.some((c) => c.toLowerCase().includes(keyword.toLowerCase()))
      )
    : [];

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <span key={index} className="text-primary">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 搜索头部 */}
      <div className="fixed top-0 left-0 right-0 bg-background z-20 p-4 safe-area-inset-top">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-surface rounded-full px-4 py-2">
            <SearchIcon size={18} className="text-text-secondary" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (!e.target.value) setIsSearching(false);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(keyword)}
              placeholder="搜索教练、游戏..."
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-secondary"
              autoFocus
            />
            {keyword && (
              <button
                className="tap-effect"
                onClick={() => {
                  setKeyword('');
                  setIsSearching(false);
                }}
              >
                <X size={18} className="text-text-secondary" />
              </button>
            )}
          </div>
          <button className="text-text-secondary tap-effect" onClick={goBack}>
            取消
          </button>
        </div>
      </div>

      <div className="pt-20 px-4 pb-4">
        {isSearching ? (
          // 搜索结果
          <>
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  找到 {searchResults.length} 个结果
                </p>
                {searchResults.map((coach) => (
                  <button
                    key={coach.id}
                    className="w-full flex items-center gap-3 p-4 bg-surface rounded-xl tap-effect"
                    onClick={() => navigateTo('coach-detail', { coachId: coach.id })}
                  >
                    <Avatar name={coach.nickname} gender={coach.gender} size="lg" isOnline={coach.isOnline} />
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-text-primary">
                        {highlightText(coach.nickname, keyword)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {coach.games.map((g) => highlightText(g.name, keyword)).join(' · ')}
                      </div>
                    </div>
                    <div className="text-primary font-bold">{coach.price}钻/局</div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="🔍"
                title="未找到相关结果"
                description="换个关键词试试吧"
              />
            )}
          </>
        ) : (
          // 搜索历史和热门搜索
          <>
            {/* 搜索历史 */}
            {searchHistory.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-text-primary">
                    <Clock size={16} />
                    <span className="font-semibold">搜索历史</span>
                  </div>
                  <button className="text-sm text-text-secondary tap-effect" onClick={clearSearchHistory}>
                    清空
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, index) => (
                    <Tag key={index} onClick={() => handleSearch(item)}>
                      {item}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {/* 热门搜索 */}
            <div>
              <div className="flex items-center gap-2 text-text-primary mb-3">
                <TrendingUp size={16} />
                <span className="font-semibold">热门搜索</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {hotSearches.map((item, index) => (
                  <Tag key={index} onClick={() => handleSearch(item)}>
                    {index < 3 && <span className="text-error mr-1">🔥</span>}
                    {item}
                  </Tag>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
