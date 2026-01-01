'use client';

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui';

const steps = [
  {
    icon: '🎮',
    title: '发现高手教练',
    description: '海量认证教练，总有一位适合你',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: '🤖',
    title: 'AI智能分析',
    description: '智能分析你的游戏数据，精准匹配教练',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '🎙️',
    title: '语音视频开黑',
    description: '高清语音视频，沉浸式陪练体验',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: '🔒',
    title: '安全支付保障',
    description: '平台担保交易，资金安全有保障',
    gradient: 'from-orange-500 to-amber-500',
  },
];

export function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const { completeOnboarding } = useApp();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 跳过按钮 */}
      <div className="flex justify-end p-4">
        <button
          className="text-text-secondary text-sm tap-effect"
          onClick={handleSkip}
        >
          跳过
        </button>
      </div>

      {/* 主要内容 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* 图标 */}
        <div
          className={`
            w-32 h-32 rounded-3xl bg-gradient-to-br ${step.gradient}
            flex items-center justify-center mb-8
            shadow-lg animate-scale-in
          `}
        >
          <span className="text-6xl">{step.icon}</span>
        </div>

        {/* 标题 */}
        <h1 className="text-2xl font-bold text-text-primary mb-3 animate-fade-in">
          {step.title}
        </h1>

        {/* 描述 */}
        <p className="text-text-secondary text-center mb-12 animate-fade-in">
          {step.description}
        </p>

        {/* 步骤指示器 */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`
                h-1.5 rounded-full transition-all duration-300
                ${index === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-surface-light'}
              `}
            />
          ))}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="p-6 safe-area-inset-bottom">
        <Button
          fullWidth
          size="lg"
          onClick={handleNext}
          className="rounded-full"
        >
          {currentStep === steps.length - 1 ? '开始使用' : '下一步'}
          <ChevronRight size={20} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}
