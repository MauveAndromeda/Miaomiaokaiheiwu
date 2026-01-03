# 喵喵电竞 - 部署指南

## 项目结构

```
Miaomiaokaiheiwu/
├── src/                    # Next.js 前端源码
├── android/                # Android 原生应用
├── server/                 # 后端服务 (Express + Prisma)
├── scripts/                # 构建脚本
└── docker-compose.yml      # Docker 部署配置
```

## 快速开始

### 1. 安装依赖

```bash
# 前端依赖
npm install

# 后端依赖
cd server && npm install
```

### 2. 启动开发环境

```bash
# 方式1: 同时启动前端和后端
npm run dev:all

# 方式2: 分别启动
npm run dev          # 前端 (http://localhost:3000)
npm run server:dev   # 后端 (http://localhost:3001)
```

### 3. 初始化数据库

```bash
npm run db:setup
```

## 后端部署

### 环境变量配置

复制 `server/.env.example` 到 `server/.env` 并配置：

```env
# 数据库
DATABASE_URL="mysql://user:password@localhost:3306/miaomiao"

# JWT
JWT_SECRET="your-super-secret-key-change-this"

# 微信支付
WECHAT_APP_ID="your-wechat-app-id"
WECHAT_MCH_ID="your-wechat-mch-id"
WECHAT_API_KEY="your-wechat-api-key"

# 支付宝
ALIPAY_APP_ID="your-alipay-app-id"
ALIPAY_PRIVATE_KEY="your-alipay-private-key"
ALIPAY_PUBLIC_KEY="your-alipay-public-key"

# 阿里云短信
SMS_ACCESS_KEY_ID="your-aliyun-access-key"
SMS_ACCESS_KEY_SECRET="your-aliyun-secret"
SMS_SIGN_NAME="your-sms-sign"
SMS_TEMPLATE_CODE="SMS_123456"

# OSS
OSS_ACCESS_KEY_ID="your-oss-access-key"
OSS_ACCESS_KEY_SECRET="your-oss-secret"
OSS_BUCKET="your-bucket-name"
OSS_REGION="oss-cn-hangzhou"
```

### Docker 部署

```bash
cd server
docker-compose up -d
```

### 手动部署

```bash
cd server
npm run build
npm run db:push
npm run db:seed
npm start
```

## Android 打包

### 1. 构建 Web 资源

```bash
npm run build:android
```

### 2. 打包 APK

```bash
cd android
./gradlew assembleRelease
```

APK 输出位置: `android/app/build/outputs/apk/release/app-release.apk`

### 3. 签名配置

编辑 `android/app/build.gradle`:

```groovy
android {
    signingConfigs {
        release {
            storeFile file("your-keystore.jks")
            storePassword "your-store-password"
            keyAlias "your-key-alias"
            keyPassword "your-key-password"
        }
    }
}
```

## 生产环境清单

### 必须配置

- [ ] 数据库 (MySQL/PostgreSQL)
- [ ] Redis (用于缓存和会话)
- [ ] JWT 密钥 (使用强随机密钥)
- [ ] HTTPS 证书
- [ ] 域名

### 第三方服务

- [ ] 短信服务 (阿里云SMS/腾讯云SMS)
- [ ] 微信支付商户号
- [ ] 支付宝开放平台应用
- [ ] OSS 存储 (阿里云/腾讯云)
- [ ] CDN (可选，推荐)

### 安全检查

- [ ] 关闭开发环境固定验证码
- [ ] 禁用 HTTP 明文传输
- [ ] 配置 CORS 白名单
- [ ] 启用请求限流
- [ ] 配置日志监控

## 服务器推荐配置

### 小团队 (日活 100-1000)

- CPU: 2核
- 内存: 4GB
- 存储: 50GB SSD
- 带宽: 5Mbps
- 预估成本: ¥200-400/月

### 中等规模 (日活 1000-10000)

- CPU: 4核
- 内存: 8GB
- 存储: 100GB SSD
- 带宽: 10Mbps
- Redis: 2GB
- 预估成本: ¥500-1000/月

### 大规模 (日活 10000+)

建议使用微服务架构:
- 多台应用服务器 + 负载均衡
- 数据库主从复制
- Redis 集群
- CDN 加速
- 日志收集系统

## 常见问题

### Q: Mock 模式和真实 API 如何切换?

A: 系统会自动检测后端是否可用。如果后端未启动，自动降级到 Mock 模式。

### Q: 如何查看 API 文档?

A: 启动后端后访问 `http://localhost:3001/api-docs` (需要配置 Swagger)

### Q: 支付回调如何配置?

A: 在微信/支付宝商户后台配置回调 URL:
- 微信: `https://your-domain.com/api/v1/payment/wechat/callback`
- 支付宝: `https://your-domain.com/api/v1/payment/alipay/callback`

## 技术支持

如有问题，请提交 GitHub Issue。
