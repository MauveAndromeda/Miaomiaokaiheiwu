'use client';

import React, { useState } from 'react';
import { ChevronRight, Shield, Bell, Lock, Trash2, Info, FileText, LogOut } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/layout';
import { Card, ConfirmModal } from '@/components/ui';

export function Settings() {
  const { logout, showToast, navigateTo } = useApp();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const settingsGroups = [
    {
      title: '账号设置',
      items: [
        { icon: <Shield size={20} />, label: '账号与安全', onClick: () => showToast('功能开发中', 'info') },
        { icon: <Bell size={20} />, label: '通知设置', onClick: () => showToast('功能开发中', 'info') },
        { icon: <Lock size={20} />, label: '隐私设置', onClick: () => showToast('功能开发中', 'info') },
      ],
    },
    {
      title: '其他',
      items: [
        { icon: <Trash2 size={20} />, label: '清除缓存', value: '12.5MB', onClick: () => {
          showToast('缓存已清除', 'success');
        }},
        { icon: <Info size={20} />, label: '关于我们', onClick: () => showToast('喵喵开黑屋 v1.0.0', 'info') },
        { icon: <FileText size={20} />, label: '用户协议', onClick: () => showToast('功能开发中', 'info') },
        { icon: <FileText size={20} />, label: '隐私政策', onClick: () => showToast('功能开发中', 'info') },
      ],
    },
  ];

  return (
    <>
      <Header title="设置" />
      <div className="min-h-screen bg-background pt-14 px-4 py-4 space-y-4">
        {settingsGroups.map((group, groupIndex) => (
          <Card key={groupIndex}>
            <h3 className="text-sm text-text-secondary mb-3">{group.title}</h3>
            <div className="space-y-1">
              {group.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  className="w-full flex items-center justify-between py-3 tap-effect"
                  onClick={item.onClick}
                >
                  <div className="flex items-center gap-3 text-text-secondary">
                    {item.icon}
                    <span className="text-text-primary">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.value && (
                      <span className="text-text-secondary text-sm">{item.value}</span>
                    )}
                    <ChevronRight size={18} className="text-text-secondary" />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ))}

        {/* 退出登录 */}
        <button
          className="w-full py-4 bg-surface rounded-xl text-error font-medium tap-effect"
          onClick={() => setShowLogoutConfirm(true)}
        >
          退出登录
        </button>

        {/* 版本信息 */}
        <div className="text-center text-text-secondary text-xs pt-4">
          版本 1.0.0
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="退出登录"
        message="确定要退出登录吗？"
        confirmText="退出"
        danger
      />
    </>
  );
}
