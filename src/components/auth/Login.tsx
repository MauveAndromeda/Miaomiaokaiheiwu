'use client';

import React, { useState, useEffect } from 'react';
import { Phone, Shield, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button, Input } from '@/components/ui';

export function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const { login, showToast } = useApp();

  // 验证码倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = () => {
    if (phone.length !== 11) {
      showToast('请输入正确的手机号', 'error');
      return;
    }
    // 模拟发送验证码
    setCountdown(60);
    showToast('验证码已发送', 'success');
  };

  const handleLogin = async () => {
    if (!phone || phone.length !== 11) {
      showToast('请输入正确的手机号', 'error');
      return;
    }
    if (!code || code.length !== 6) {
      showToast('请输入6位验证码', 'error');
      return;
    }
    if (!agreed) {
      showToast('请阅读并同意用户协议', 'error');
      return;
    }

    setLoading(true);
    // 模拟登录
    await new Promise(resolve => setTimeout(resolve, 1000));
    login(phone);
    showToast('登录成功', 'success');
  };

  const handleThirdPartyLogin = (type: 'wechat' | 'qq') => {
    showToast(`${type === 'wechat' ? '微信' : 'QQ'}登录功能开发中`, 'info');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6">
      {/* Logo */}
      <div className="pt-20 pb-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl mb-4 shadow-lg">
          <span className="text-4xl">🐱</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">喵喵电竞</h1>
        <p className="text-text-secondary mt-2">喵喵电竞研究所</p>
      </div>

      {/* 登录表单 */}
      <div className="flex-1">
        {/* 手机号 */}
        <div className="mb-4">
          <Input
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            leftIcon={<Phone size={18} />}
          />
        </div>

        {/* 验证码 */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="请输入验证码"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            leftIcon={<Shield size={18} />}
            rightIcon={
              <button
                className={`text-sm whitespace-nowrap ${
                  countdown > 0 ? 'text-text-secondary' : 'text-primary'
                }`}
                onClick={handleSendCode}
                disabled={countdown > 0}
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            }
          />
        </div>

        {/* 登录按钮 */}
        <Button
          fullWidth
          size="lg"
          loading={loading}
          onClick={handleLogin}
          className="rounded-full mb-6"
        >
          登录
        </Button>

        {/* 第三方登录 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-secondary">其他登录方式</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="flex justify-center gap-8">
            <button
              className="w-12 h-12 rounded-full bg-[#07C160] flex items-center justify-center tap-effect"
              onClick={() => handleThirdPartyLogin('wechat')}
            >
              <MessageCircle size={24} className="text-white" />
            </button>
            <button
              className="w-12 h-12 rounded-full bg-[#12B7F5] flex items-center justify-center tap-effect"
              onClick={() => handleThirdPartyLogin('qq')}
            >
              <span className="text-white text-xl font-bold">Q</span>
            </button>
          </div>
        </div>
      </div>

      {/* 用户协议 */}
      <div className="py-6 safe-area-inset-bottom">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border bg-surface accent-primary"
          />
          <span className="text-text-secondary">
            登录即同意
            <button className="text-primary">《用户协议》</button>
            和
            <button className="text-primary">《隐私政策》</button>
          </span>
        </label>
      </div>
    </div>
  );
}
