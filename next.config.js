/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  // 使用相对路径，确保file://协议可以正确加载资源
  basePath: '',
  assetPrefix: './',
  // 禁用一些不需要的功能
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
