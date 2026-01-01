'use client';

import React from 'react';
import { Crown, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header, PageContainer } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { vipLevels } from '@/data/mock';

export function VIP() {
  const { user, showToast } = useApp();
  const currentLevel = user?.vipLevel || 0;

  return (
    <>
      <Header title="VIP会员" />
      <div className="min-h-screen bg-background">
        <div className="pt-14">
          {/* VIP头部 */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <Crown size={32} />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {currentLevel > 0 ? `VIP${currentLevel}` : '普通用户'}
                </div>
                <div className="text-sm opacity-80">
                  {currentLevel > 0 ? '尊享VIP特权' : '开通VIP享受更多特权'}
                </div>
              </div>
            </div>
            {currentLevel > 0 && (
              <div className="bg-white/20 rounded-lg p-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>成长值</span>
                  <span>{currentLevel * 100} / {vipLevels[currentLevel]?.requiredAmount || 10000}</span>
                </div>
                <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${(currentLevel * 100) / (vipLevels[currentLevel]?.requiredAmount || 10000) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* VIP等级 */}
          <div className="px-4 py-4 space-y-4">
            <Card>
              <h3 className="font-semibold text-text-primary mb-4">VIP等级特权</h3>
              <div className="space-y-4">
                {vipLevels.map((level) => (
                  <div
                    key={level.level}
                    className={`p-4 rounded-xl border ${
                      currentLevel >= level.level
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-border bg-surface-light'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{level.icon}</span>
                        <span className="font-semibold text-text-primary">{level.name}</span>
                      </div>
                      {currentLevel >= level.level ? (
                        <span className="text-success text-sm flex items-center gap-1">
                          <Check size={14} />
                          已解锁
                        </span>
                      ) : (
                        <span className="text-text-secondary text-sm">
                          累计充值{level.requiredAmount}钻
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {level.privileges.map((privilege, index) => (
                        <span
                          key={index}
                          className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded"
                        >
                          {privilege}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {currentLevel === 0 && (
              <Button
                fullWidth
                size="lg"
                className="vip-gradient border-0"
                onClick={() => showToast('开通VIP功能开发中', 'info')}
              >
                立即开通VIP
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
