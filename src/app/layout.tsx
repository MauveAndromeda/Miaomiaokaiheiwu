import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '喵喵电竞 - 电竞技术指导平台',
  description: '喵喵电竞研究所 - 专业电竞技术指导平台，AI对战分析，认证教练1对1指导',
  keywords: '喵喵电竞,电竞指导,游戏教练,AI对战分析,王者荣耀,和平精英,英雄联盟',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="bg-background text-text-primary min-h-screen">
        {children}
      </body>
    </html>
  )
}
