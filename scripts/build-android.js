#!/usr/bin/env node

/**
 * Android 构建脚本
 * 将 Next.js 静态导出打包到 Android assets 目录
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 路径配置
const ROOT_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
const ANDROID_ASSETS_DIR = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'webapp');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// 递归删除目录
function rmDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// 递归复制目录
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 统计文件数量和大小
function getStats(dirPath) {
  let fileCount = 0;
  let totalSize = 0;

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        fileCount++;
        totalSize += fs.statSync(fullPath).size;
      }
    }
  }

  walk(dirPath);
  return { fileCount, totalSize };
}

function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

async function main() {
  console.log('\n🚀 喵喵电竞 - Android 构建脚本\n');
  console.log('='.repeat(50));

  try {
    // Step 1: 检查环境
    logStep('1/5', '检查构建环境...');

    if (!fs.existsSync(path.join(ROOT_DIR, 'package.json'))) {
      throw new Error('未找到 package.json，请在项目根目录运行');
    }

    if (!fs.existsSync(path.join(ROOT_DIR, 'android'))) {
      throw new Error('未找到 android 目录');
    }

    logSuccess('环境检查通过');

    // Step 2: 清理旧构建
    logStep('2/5', '清理旧构建文件...');

    rmDir(OUT_DIR);
    rmDir(ANDROID_ASSETS_DIR);

    logSuccess('清理完成');

    // Step 3: 构建 Next.js
    logStep('3/5', '构建 Next.js 应用...');

    // 设置静态导出环境变量
    process.env.NEXT_PUBLIC_ENV = 'production';

    log('正在执行 next build...', 'yellow');
    execSync('npm run build', {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
      },
    });

    logSuccess('Next.js 构建完成');

    // Step 4: 复制到 Android assets
    logStep('4/5', '复制文件到 Android assets...');

    if (!fs.existsSync(OUT_DIR)) {
      logWarning('未找到 out 目录，Next.js 可能未配置静态导出');
      logWarning('请在 next.config.js 中添加: output: "export"');

      // 尝试从 .next/static 复制
      const nextStaticDir = path.join(ROOT_DIR, '.next');
      if (fs.existsSync(nextStaticDir)) {
        log('使用 .next 目录作为替代...', 'yellow');
        fs.mkdirSync(ANDROID_ASSETS_DIR, { recursive: true });

        // 复制必要文件
        const staticDir = path.join(nextStaticDir, 'static');
        if (fs.existsSync(staticDir)) {
          copyDir(staticDir, path.join(ANDROID_ASSETS_DIR, '_next', 'static'));
        }

        // 创建简单的入口页面
        const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>喵喵电竞</title>
  <script>
    // 重定向到服务器渲染模式
    window.location.href = '${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}';
  </script>
</head>
<body>
  <p>正在加载...</p>
</body>
</html>`;
        fs.writeFileSync(path.join(ANDROID_ASSETS_DIR, 'index.html'), indexHtml);
      }
    } else {
      copyDir(OUT_DIR, ANDROID_ASSETS_DIR);
    }

    logSuccess('文件复制完成');

    // Step 5: 生成统计信息
    logStep('5/5', '生成构建报告...');

    if (fs.existsSync(ANDROID_ASSETS_DIR)) {
      const stats = getStats(ANDROID_ASSETS_DIR);

      console.log('\n' + '='.repeat(50));
      console.log('📊 构建统计:');
      console.log(`   文件数量: ${stats.fileCount}`);
      console.log(`   总大小: ${formatSize(stats.totalSize)}`);
      console.log(`   输出目录: ${ANDROID_ASSETS_DIR}`);
      console.log('='.repeat(50));
    }

    logSuccess('构建完成!');

    console.log('\n📱 下一步:');
    console.log('   1. 打开 Android Studio');
    console.log('   2. 同步 Gradle (Sync Project with Gradle Files)');
    console.log('   3. 运行应用 (Run app)');
    console.log('\n或使用命令行:');
    console.log('   cd android && ./gradlew assembleRelease');
    console.log('');
  } catch (error) {
    logError(`构建失败: ${error.message}`);
    process.exit(1);
  }
}

main();
