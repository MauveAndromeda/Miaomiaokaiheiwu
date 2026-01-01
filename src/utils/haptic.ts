/**
 * Haptic feedback utilities for Android WebView
 * Uses Navigator Vibration API when available
 */

// 振动模式类型
export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// 振动模式定义 (毫秒)
const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [20, 50, 20, 50],
  error: [30, 50, 30, 50, 30],
  selection: 5,
};

/**
 * 检查是否支持振动
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * 触发振动反馈
 */
export function haptic(pattern: HapticPattern = 'light'): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(patterns[pattern]);
  } catch (e) {
    // 静默失败
  }
}

/**
 * 取消振动
 */
export function cancelHaptic(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(0);
  } catch (e) {
    // 静默失败
  }
}

/**
 * 点击反馈 - 轻触
 */
export function hapticTap(): void {
  haptic('light');
}

/**
 * 选择反馈 - 选中项
 */
export function hapticSelect(): void {
  haptic('selection');
}

/**
 * 成功反馈
 */
export function hapticSuccess(): void {
  haptic('success');
}

/**
 * 警告反馈
 */
export function hapticWarning(): void {
  haptic('warning');
}

/**
 * 错误反馈
 */
export function hapticError(): void {
  haptic('error');
}

/**
 * 重要操作反馈 - 较强振动
 */
export function hapticImpact(): void {
  haptic('heavy');
}

/**
 * 创建带振动反馈的点击处理器
 */
export function withHaptic<T extends (...args: any[]) => any>(
  handler: T,
  pattern: HapticPattern = 'light'
): T {
  return ((...args: Parameters<T>) => {
    haptic(pattern);
    return handler(...args);
  }) as T;
}

/**
 * Android Bridge 接口
 * 用于与原生 Android 代码通信
 */
interface AndroidBridge {
  vibrate?: (duration: number) => void;
  vibratePattern?: (pattern: string) => void;
  showToast?: (message: string) => void;
  shareText?: (text: string) => void;
  copyToClipboard?: (text: string) => void;
  openUrl?: (url: string) => void;
  getDeviceInfo?: () => string;
}

declare global {
  interface Window {
    Android?: AndroidBridge;
  }
}

/**
 * 检查是否在 Android WebView 中运行
 */
export function isAndroidWebView(): boolean {
  if (typeof window === 'undefined') return false;
  return !!window.Android;
}

/**
 * 调用 Android 原生振动
 */
export function androidVibrate(duration: number): void {
  if (isAndroidWebView() && window.Android?.vibrate) {
    window.Android.vibrate(duration);
  } else {
    haptic(duration <= 10 ? 'light' : duration <= 30 ? 'medium' : 'heavy');
  }
}

/**
 * 显示 Android 原生 Toast
 */
export function androidToast(message: string): void {
  if (isAndroidWebView() && window.Android?.showToast) {
    window.Android.showToast(message);
  }
}

/**
 * 调用 Android 分享
 */
export function androidShare(text: string): void {
  if (isAndroidWebView() && window.Android?.shareText) {
    window.Android.shareText(text);
  } else if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({ text }).catch(() => {});
  }
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (isAndroidWebView() && window.Android?.copyToClipboard) {
    window.Android.copyToClipboard(text);
    hapticSuccess();
    return true;
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      hapticSuccess();
      return true;
    } catch (e) {
      return false;
    }
  }

  return false;
}

/**
 * 打开外部链接
 */
export function openExternalUrl(url: string): void {
  if (isAndroidWebView() && window.Android?.openUrl) {
    window.Android.openUrl(url);
  } else if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}
