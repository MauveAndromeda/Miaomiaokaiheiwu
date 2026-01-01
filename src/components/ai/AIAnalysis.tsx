'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/layout';
import { Button, Card, Input } from '@/components/ui';
import { games } from '@/data/mock';

export function AIAnalysis() {
  const [selectedGame, setSelectedGame] = useState(games[0]);
  const [gameId, setGameId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const { navigateTo, showToast } = useApp();

  const handleAnalyze = async () => {
    if (!gameId.trim()) {
      showToast('请输入游戏ID', 'error');
      return;
    }

    setAnalyzing(true);

    // 模拟分析过程
    await new Promise(resolve => setTimeout(resolve, 3000));

    setAnalyzing(false);
    navigateTo('ai-report', { gameId: selectedGame.id, accountId: gameId });
  };

  const availableGames = games.filter(g => g.id !== '8'); // 排除"更多"

  return (
    <>
      <Header title="AI分析" />
      <div className="min-h-screen bg-background pt-14 px-4 py-4 space-y-4">
        {/* 介绍 */}
        <Card>
          <div className="text-center py-4">
            <span className="text-5xl mb-4 block">🤖</span>
            <h2 className="text-xl font-bold text-text-primary mb-2">AI智能分析</h2>
            <p className="text-text-secondary text-sm">
              分析你的游戏数据，发现提升空间，为你推荐合适的教练
            </p>
          </div>
        </Card>

        {/* 选择游戏 */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-3">选择游戏</h3>
          <div className="grid grid-cols-4 gap-3">
            {availableGames.map((game) => (
              <button
                key={game.id}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl border transition-colors tap-effect ${
                  selectedGame.id === game.id
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-light border-transparent'
                }`}
                onClick={() => setSelectedGame(game)}
              >
                <span className="text-2xl">{game.icon}</span>
                <span className="text-xs text-text-secondary">{game.name}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 输入游戏ID */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-3">输入游戏ID</h3>
          <Input
            placeholder={`请输入你的${selectedGame.name}游戏ID`}
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
          />
          <p className="text-xs text-text-secondary mt-2">
            提示：可在游戏内个人资料页面查看游戏ID
          </p>
        </Card>

        {/* 分析按钮 */}
        <Button
          fullWidth
          size="lg"
          loading={analyzing}
          onClick={handleAnalyze}
        >
          {analyzing ? '分析中...' : '开始分析'}
        </Button>

        {/* 分析中的动画 */}
        {analyzing && (
          <Card>
            <div className="py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
              <div className="space-y-2">
                {['获取战绩数据...', '分析对局表现...', '生成改进建议...'].map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-success' : 'bg-surface-light'}`} />
                    <span className={`text-sm ${index === 0 ? 'text-success' : 'text-text-secondary'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
