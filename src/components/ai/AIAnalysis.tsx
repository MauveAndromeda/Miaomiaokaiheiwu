'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Button, Card, Input } from '@/components/ui';
import { games } from '@/data/mock';
import {
  Brain, TrendingUp, Target, Zap, Users, ChevronRight,
  Play, Trophy, AlertCircle, Star, Upload, BarChart3
} from 'lucide-react';

// Mock数据
const mockPlayerStats = {
  totalMatches: 156,
  winRate: 58.3,
  avgScore: 82,
  scoreHistory: [
    { date: '12-28', score: 78 },
    { date: '12-29', score: 80 },
    { date: '12-30', score: 85 },
    { date: '12-31', score: 82 },
    { date: '01-01', score: 88 },
    { date: '01-02', score: 84 },
    { date: '01-03', score: 86 },
  ],
  dimensionTrends: [
    { name: '意识', current: 85, previous: 78, trend: 'up' },
    { name: '操作', current: 82, previous: 84, trend: 'down' },
    { name: '发育', current: 88, previous: 85, trend: 'up' },
    { name: '团战', current: 79, previous: 75, trend: 'up' },
    { name: '目标', current: 76, previous: 76, trend: 'stable' },
  ],
  topHeroes: [
    { name: '李白', icon: '⚔️', winRate: 68, matches: 45 },
    { name: '公孙离', icon: '🏹', winRate: 62, matches: 38 },
    { name: '司马懿', icon: '🔮', winRate: 55, matches: 28 },
  ],
};

const mockRecentAnalysis = [
  {
    id: '1',
    heroUsed: '李白',
    heroIcon: '⚔️',
    gameName: '王者荣耀',
    duration: 1820,
    result: 'win' as const,
    overallScore: 88,
    keyMoments: [
      { type: 'highlight', description: '完美反野抢龙' },
      { type: 'mistake', description: '团战站位过于激进' },
    ],
    analyzedAt: '2小时前',
  },
  {
    id: '2',
    heroUsed: '韩信',
    heroIcon: '🗡️',
    gameName: '王者荣耀',
    duration: 1560,
    result: 'lose' as const,
    overallScore: 72,
    keyMoments: [
      { type: 'mistake', description: '入侵野区被反蹲' },
      { type: 'highlight', description: '1v3极限反杀' },
    ],
    analyzedAt: '4小时前',
  },
];

export function AIAnalysis() {
  const [selectedGame, setSelectedGame] = useState(games[0]);
  const [gameId, setGameId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [hasData, setHasData] = useState(true); // 模拟已有数据
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'trends'>('overview');
  const { navigateTo, showToast } = useApp();

  const stats = mockPlayerStats;

  const handleAnalyze = async () => {
    if (!gameId.trim()) {
      showToast('请输入游戏ID', 'error');
      return;
    }

    setAnalyzing(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setAnalyzing(false);
    navigateTo('ai-report', { gameId: selectedGame.id, accountId: gameId });
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-green-400" />;
    if (trend === 'down') return <TrendingUp size={14} className="text-red-400 rotate-180" />;
    return <span className="w-3.5 h-0.5 bg-gray-400 inline-block" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}分钟`;
  };

  const availableGames = games.filter(g => g.id !== '8');

  // 如果没有数据，显示输入界面
  if (!hasData) {
    return (
      <>
        <Header title="AI对战分析" />
        <PageContainer hasHeader hasTabBar className="bg-background">
          <div className="px-4 pt-4 space-y-4">
            {/* 介绍卡片 */}
            <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
              <div className="text-center py-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Brain size={40} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">AI智能对战分析</h2>
                <p className="text-text-secondary text-sm px-4">
                  深度分析你的游戏数据，发现提升空间，为你定制专属训练建议
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-xs text-text-secondary">多维评分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="text-xs text-text-secondary">关键时刻</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">💡</div>
                  <div className="text-xs text-text-secondary">提升建议</div>
                </div>
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

            <Button fullWidth size="lg" loading={analyzing} onClick={handleAnalyze}>
              {analyzing ? '分析中...' : '开始分析'}
            </Button>

            {/* 或者上传录屏 */}
            <div className="text-center text-text-secondary text-sm">或</div>

            <Button fullWidth variant="outline" className="flex items-center justify-center gap-2">
              <Upload size={18} />
              上传录屏进行深度分析
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // 有数据时显示分析结果
  return (
    <>
      <Header title="AI对战分析" />
      <PageContainer hasHeader hasTabBar className="bg-background">
        {/* 综合评分卡片 */}
        <div className="px-4 pt-4">
          <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">综合实力评分</h2>
                  <p className="text-sm text-text-secondary">基于最近{stats.totalMatches}场比赛</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(stats.avgScore)}`}>
                  {stats.avgScore}
                </div>
                <div className="text-sm text-text-secondary">分</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-primary">{stats.winRate}%</div>
                <div className="text-xs text-text-secondary">胜率</div>
              </div>
              <div className="bg-surface/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-400">+{(stats.avgScore - 75).toFixed(0)}</div>
                <div className="text-xs text-text-secondary">较平均水平</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 标签页切换 */}
        <div className="px-4 mt-4">
          <div className="flex bg-surface rounded-xl p-1">
            {[
              { key: 'overview', label: '能力雷达', icon: Target },
              { key: 'history', label: '对局分析', icon: BarChart3 },
              { key: 'trends', label: '成长趋势', icon: TrendingUp },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'text-text-secondary'
                }`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="px-4 mt-4 pb-20">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* 能力维度 */}
              <Card>
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Target size={18} className="text-primary" />
                  能力维度分析
                </h3>
                <div className="space-y-3">
                  {stats.dimensionTrends.map((dim) => (
                    <div key={dim.name} className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary w-12">{dim.name}</span>
                      <div className="flex-1 h-2.5 bg-surface-light rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            dim.current >= 85 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                            dim.current >= 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                            'bg-gradient-to-r from-red-500 to-orange-400'
                          }`}
                          style={{ width: `${dim.current}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold w-8 ${getScoreColor(dim.current)}`}>
                        {dim.current}
                      </span>
                      {getTrendIcon(dim.trend)}
                    </div>
                  ))}
                </div>
              </Card>

              {/* 擅长英雄 */}
              <Card>
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Star size={18} className="text-yellow-400" />
                  擅长英雄
                </h3>
                <div className="space-y-3">
                  {stats.topHeroes.map((hero, index) => (
                    <div key={hero.name} className="flex items-center gap-3 p-2 rounded-xl bg-surface-light">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-2xl">
                        {hero.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-text-primary">{hero.name}</span>
                          <span className="text-sm text-green-400 font-semibold">{hero.winRate}%胜率</span>
                        </div>
                        <span className="text-xs text-text-secondary">{hero.matches}场对局</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* AI建议 */}
              <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
                <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <Zap size={18} />
                  AI提升建议
                </h3>
                <ul className="space-y-2.5 text-sm text-text-secondary">
                  <li className="flex items-start gap-2">
                    <ChevronRight size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>操作维度略有下滑，建议每天进行15分钟的连招训练</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>目标控制意识有待提升，注意大小龙刷新倒计时</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>意识进步明显！继续保持对小地图的高频关注</span>
                  </li>
                </ul>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {mockRecentAnalysis.map((analysis) => (
                <Card key={analysis.id} className="overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center text-3xl">
                        {analysis.heroIcon}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{analysis.heroUsed}</div>
                        <div className="text-xs text-text-secondary">
                          {analysis.gameName} · {formatDuration(analysis.duration)} · {analysis.analyzedAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        analysis.result === 'win'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {analysis.result === 'win' ? '胜利' : '失败'}
                      </span>
                      <span className={`text-2xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                        {analysis.overallScore}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {analysis.keyMoments.map((moment, idx) => (
                      <div key={idx} className={`flex items-center gap-2 text-sm p-2.5 rounded-lg ${
                        moment.type === 'highlight' ? 'bg-green-500/10' : 'bg-red-500/10'
                      }`}>
                        {moment.type === 'highlight' ? (
                          <Trophy size={14} className="text-green-400" />
                        ) : (
                          <AlertCircle size={14} className="text-red-400" />
                        )}
                        <span className="text-text-primary">{moment.description}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-3 py-2.5 text-sm text-primary flex items-center justify-center gap-1 border-t border-border">
                    查看完整复盘
                    <ChevronRight size={16} />
                  </button>
                </Card>
              ))}

              <Button fullWidth variant="outline" className="flex items-center justify-center gap-2">
                <Play size={18} />
                上传录屏进行AI分析
              </Button>
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-4">
              {/* 得分趋势图 */}
              <Card>
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-400" />
                  近7日评分趋势
                </h3>
                <div className="h-32 flex items-end justify-between gap-2">
                  {stats.scoreHistory.map((item) => (
                    <div key={item.date} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          item.score >= 85 ? 'bg-gradient-to-t from-green-600 to-green-400' :
                          item.score >= 70 ? 'bg-gradient-to-t from-yellow-600 to-yellow-400' :
                          'bg-gradient-to-t from-red-600 to-red-400'
                        }`}
                        style={{ height: `${(item.score - 60) * 2.5}px` }}
                      />
                      <div className="text-xs text-text-secondary">{item.date}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 各维度变化 */}
              <Card>
                <h3 className="font-semibold text-text-primary mb-4">能力变化对比</h3>
                <div className="space-y-4">
                  {stats.dimensionTrends.map((dim) => (
                    <div key={dim.name}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-text-secondary">{dim.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-secondary">上周 {dim.previous}</span>
                          <span className="text-xs text-text-secondary">→</span>
                          <span className={`text-sm font-bold ${getScoreColor(dim.current)}`}>
                            {dim.current}
                          </span>
                          {dim.trend === 'up' && (
                            <span className="text-xs text-green-400 font-medium">+{dim.current - dim.previous}</span>
                          )}
                          {dim.trend === 'down' && (
                            <span className="text-xs text-red-400 font-medium">{dim.current - dim.previous}</span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-surface-light rounded-full overflow-hidden relative">
                        <div
                          className="absolute h-full bg-gray-600/50 rounded-full"
                          style={{ width: `${dim.previous}%` }}
                        />
                        <div
                          className={`absolute h-full rounded-full ${
                            dim.current >= dim.previous
                              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                              : 'bg-gradient-to-r from-red-500 to-orange-400'
                          }`}
                          style={{ width: `${dim.current}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 预约教练指导 */}
              <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Users size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary">想要更快提升？</h4>
                    <p className="text-sm text-text-secondary">预约认证教练1对1指导</p>
                  </div>
                  <Button size="sm">预约</Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
