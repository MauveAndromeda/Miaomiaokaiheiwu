'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/layout';
import { Button, Card, Avatar } from '@/components/ui';
import { games, coaches } from '@/data/mock';

export function AIReport() {
  const { pageParams, navigateTo, showToast } = useApp();
  const gameId = pageParams.gameId;
  const game = games.find(g => g.id === gameId);

  // 模拟分析结果
  const report = {
    overallScore: 78,
    dimensions: [
      { name: '操作水平', score: 82, description: '操作熟练度较高，但连招衔接有提升空间' },
      { name: '游戏意识', score: 75, description: '地图意识良好，需加强对敌方打野的预判' },
      { name: '团战贡献', score: 80, description: '团战参与度高，切入时机把握较好' },
      { name: '发育能力', score: 72, description: '补刀效率一般，前期需更加注重发育' },
      { name: '视野控制', score: 81, description: '眼位布置合理，视野控制意识强' },
    ],
    suggestions: [
      '建议多练习英雄连招，提升操作流畅度',
      '可以多看高端局视频，学习打野路线预判',
      '前期注重补刀，提高经济获取效率',
      '团战中注意保护后排，不要过于激进',
    ],
    recommendedCoaches: coaches.slice(0, 3),
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-error';
  };

  return (
    <>
      <Header
        title="分析报告"
        rightContent={
          <button className="p-2 tap-effect" onClick={() => showToast('分享功能开发中', 'info')}>
            <Share2 size={20} className="text-text-primary" />
          </button>
        }
      />
      <div className="min-h-screen bg-background pt-14 px-4 py-4 space-y-4">
        {/* 综合评分 */}
        <Card className="text-center py-6">
          <span className="text-4xl mb-2 block">{game?.icon}</span>
          <h2 className="text-lg font-semibold text-text-primary mb-4">{game?.name} 综合评分</h2>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-surface-light"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${report.overallScore * 3.52} 352`}
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary">{report.overallScore}</span>
            </div>
          </div>
          <p className="text-text-secondary text-sm">
            你的水平超过了 {report.overallScore}% 的玩家
          </p>
        </Card>

        {/* 各维度分析 */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-4">能力分析</h3>
          <div className="space-y-4">
            {report.dimensions.map((dim, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-text-primary">{dim.name}</span>
                  <span className={`font-bold ${getScoreColor(dim.score)}`}>{dim.score}</span>
                </div>
                <div className="h-2 bg-surface-light rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary">{dim.description}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* AI建议 */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-3">🤖 AI建议</h3>
          <ul className="space-y-2">
            {report.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-text-secondary">
                <span className="text-primary">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* 推荐教练 */}
        <Card>
          <h3 className="font-semibold text-text-primary mb-3">推荐教练</h3>
          <div className="space-y-3">
            {report.recommendedCoaches.map((coach) => (
              <button
                key={coach.id}
                className="w-full flex items-center gap-3 p-3 bg-surface-light rounded-xl tap-effect"
                onClick={() => navigateTo('coach-detail', { coachId: coach.id })}
              >
                <Avatar name={coach.nickname} gender={coach.gender} size="md" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-text-primary">{coach.nickname}</div>
                  <div className="text-xs text-text-secondary">
                    {coach.certifications.join(' · ')}
                  </div>
                </div>
                <div className="text-primary font-bold">{coach.price}钻/局</div>
              </button>
            ))}
          </div>
        </Card>

        {/* 分享按钮 */}
        <Button
          fullWidth
          size="lg"
          variant="outline"
          onClick={() => showToast('分享功能开发中', 'info')}
        >
          <Share2 size={18} className="mr-2" />
          分享报告
        </Button>

        <div className="h-8" />
      </div>
    </>
  );
}
