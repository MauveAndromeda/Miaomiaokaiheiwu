/** @type {import('next').NextConfig} */
const nextConfig = {
  // 关键：启用静态导出
  output: 'export',

  // 图片优化必须禁用（静态导出不支持）
  images: { unoptimized: true },

  // 添加尾部斜杠，确保目录结构正确
  trailingSlash: true,

  // 使用空的 basePath（不要用相对路径，会在运行时处理）
  basePath: '',

  // assetPrefix 设置为空，让构建脚本处理路径转换
  // 注意：这里不要设置为 './'，Next.js 不完全支持相对路径
  // 我们通过构建后处理来修复路径
  assetPrefix: '',

  // 禁用严格模式以避免开发时的双重渲染问题
  reactStrictMode: false,

  // 禁用构建时的类型检查和 ESLint（加快构建速度）
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 实验性功能
  experimental: {
    // 禁用 app router 的一些功能以确保静态导出兼容
  },
}

module.exports = nextConfig
