# 🐱 喵喵开黑屋

专业游戏陪玩平台 Android 应用

## 📱 功能特性

- 🎮 **游戏陪玩** - 支持王者荣耀、和平精英、英雄联盟等主流游戏
- 👨‍🏫 **教练系统** - 浏览、筛选、预约专业教练
- 💬 **即时通讯** - 文字、语音、视频聊天
- 📺 **视频/直播** - 短视频Feed和直播间功能
- 🤖 **AI分析** - 智能分析游戏数据，推荐教练
- 💰 **钱包系统** - 充值、支付、交易记录

## 🛠️ 技术栈

- **前端**: React 18 + Next.js 14 + TypeScript + Tailwind CSS
- **移动端**: Android WebView
- **构建**: GitHub Actions 自动构建 APK

## 🚀 快速开始

### 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 构建 APK

推送代码到 GitHub 后，GitHub Actions 会自动构建 APK。

也可以手动构建：

```bash
# 构建 Web 资源
npm run build

# 复制到 Android assets
cp -r out/* android/app/src/main/assets/

# 构建 APK (需要 Android SDK)
cd android
./gradlew assembleDebug
```

## 📦 项目结构

```
miaomiao-kaiheiwu/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React 组件
│   │   ├── ui/          # 基础 UI 组件
│   │   ├── auth/        # 登录/注册
│   │   ├── home/        # 首页
│   │   ├── coach/       # 教练相关
│   │   ├── order/       # 订单相关
│   │   ├── wallet/      # 钱包相关
│   │   ├── message/     # 消息/聊天
│   │   ├── discover/    # 视频Feed
│   │   ├── live/        # 直播
│   │   ├── profile/     # 个人中心
│   │   ├── ai/          # AI分析
│   │   └── search/      # 搜索
│   ├── context/         # React Context
│   ├── types/           # TypeScript 类型
│   └── data/            # Mock 数据
├── android/             # Android 项目
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/    # Java 代码
│   │   │   ├── res/     # 资源文件
│   │   │   └── assets/  # Web 资源
│   │   └── build.gradle
│   └── build.gradle
└── .github/workflows/   # GitHub Actions
```

## 🎨 设计规范

- **主色调**: #6366f1 (靛蓝)
- **背景色**: #0f172a (深蓝黑)
- **暗色主题**: 全应用暗色模式

## 📋 版本信息

- **应用名称**: 喵喵开黑屋
- **包名**: com.miaomiao.kaiheiwu
- **版本**: 1.0.0
- **最低 Android 版本**: Android 7.0 (API 24)
- **目标 Android 版本**: Android 14 (API 34)

## 📝 License

MIT License
