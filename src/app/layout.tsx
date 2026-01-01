import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '喵喵开黑屋 - 游戏陪玩平台',
  description: '专业游戏陪玩平台，发现高手教练，一起开黑上分',
  keywords: '游戏陪玩,王者荣耀,和平精英,英雄联盟,开黑,上分',
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
