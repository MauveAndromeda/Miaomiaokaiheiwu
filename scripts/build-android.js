#!/usr/bin/env node

/**
 * Android 构建脚本 - 完整版
 * 将 Next.js 静态导出打包到 Android assets 目录
 * 包含路径修复，确保 file:// 协议可以正常工作
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 路径配置
const ROOT_DIR = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'out');
// 重要：目录名必须是 www，与 MainActivity.kt 中的加载路径匹配
const ANDROID_ASSETS_DIR = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'www');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

function logDebug(message) {
  log(`   ${message}`, 'magenta');
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

// 递归查找文件
function findFiles(dir, extensions, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, extensions, files);
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
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

/**
 * 修复 HTML 文件中的绝对路径
 */
function fixHtmlPaths(targetDir) {
  const htmlFiles = findFiles(targetDir, ['.html']);
  let fixedCount = 0;

  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // 替换所有 /_next/ 为 ./_next/
    content = content.replace(/"\/_next\//g, '"./_next/');
    content = content.replace(/'\/_next\//g, "'./_next/");
    content = content.replace(/href="\/_next\//g, 'href="./_next/');
    content = content.replace(/src="\/_next\//g, 'src="./_next/');

    // 替换 /manifest.json 为 ./manifest.json
    content = content.replace(/href="\/manifest\.json"/g, 'href="./manifest.json"');
    content = content.replace(/href='\/manifest\.json'/g, "href='./manifest.json'");

    // 替换其他根路径资源
    content = content.replace(/href="\/favicon/g, 'href="./favicon');
    content = content.replace(/href="\/icon/g, 'href="./icon');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      logDebug(`HTML已修复: ${path.relative(targetDir, file)}`);
    }
  }

  return fixedCount;
}

/**
 * 修复 JavaScript 文件中的 webpack publicPath
 * 这是导致黑屏的关键问题！
 */
function fixJavaScriptPaths(targetDir) {
  const chunksDir = path.join(targetDir, '_next', 'static', 'chunks');
  if (!fs.existsSync(chunksDir)) {
    logWarning('chunks目录不存在，跳过JS修复');
    return 0;
  }

  const jsFiles = findFiles(chunksDir, ['.js']);
  let fixedCount = 0;

  for (const file of jsFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // 修复 webpack publicPath 的各种格式
    // 格式1: .p="/_next/"
    content = content.replace(/\.p\s*=\s*["']?\/_next\/["']?/g, '.p="./_next/"');

    // 格式2: __webpack_require__.p = "/_next/"
    content = content.replace(/__webpack_require__\.p\s*=\s*["']?\/_next\/["']?/g, '__webpack_require__.p="./_next/"');

    // 格式3: 变量赋值 e.p="/_next/"
    content = content.replace(/(\w)\.p\s*=\s*["']\/_next\/["']/g, '$1.p="./_next/"');

    // 修复其他绝对路径引用
    content = content.replace(/"?\/_next\/static\//g, '"./_next/static/');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;

      // 检查是否是关键的 webpack 运行时文件
      if (file.includes('webpack')) {
        logDebug(`Webpack运行时已修复: ${path.basename(file)}`);
      }
    }
  }

  return fixedCount;
}

/**
 * 修复 CSS 文件中的路径
 */
function fixCssPaths(targetDir) {
  const cssDir = path.join(targetDir, '_next', 'static', 'css');
  if (!fs.existsSync(cssDir)) return 0;

  const cssFiles = findFiles(cssDir, ['.css']);
  let fixedCount = 0;

  for (const file of cssFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // 修复 CSS 中的绝对路径
    content = content.replace(/url\(\/_next\//g, 'url(./_next/');
    content = content.replace(/url\("?\/_next\//g, 'url("./_next/');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
    }
  }

  return fixedCount;
}

/**
 * 创建或更新 manifest.json
 */
function ensureManifest(targetDir) {
  const manifestPath = path.join(targetDir, 'manifest.json');

  const manifest = {
    name: '喵喵电竞',
    short_name: '喵喵电竞',
    description: '喵喵电竞研究所 - 专业电竞技术指导平台',
    start_url: './index.html',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#6366f1',
    icons: [
      {
        src: './icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: './icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  logDebug('manifest.json 已更新');
}

/**
 * 验证构建结果
 */
function validateBuild(targetDir) {
  const errors = [];
  const warnings = [];

  // 检查 index.html 是否存在
  const indexPath = path.join(targetDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    errors.push('index.html 不存在');
  } else {
    const indexContent = fs.readFileSync(indexPath, 'utf8');

    // 检查是否还有绝对路径
    if (indexContent.includes('"/_next/') || indexContent.includes("'/_next/")) {
      errors.push('index.html 仍包含绝对路径 /_next/');
    }
  }

  // 检查 _next 目录
  const nextDir = path.join(targetDir, '_next');
  if (!fs.existsSync(nextDir)) {
    errors.push('_next 目录不存在');
  }

  // 检查 webpack 运行时文件
  const chunksDir = path.join(targetDir, '_next', 'static', 'chunks');
  if (fs.existsSync(chunksDir)) {
    const webpackFiles = fs.readdirSync(chunksDir).filter(f => f.includes('webpack'));

    for (const webpackFile of webpackFiles) {
      const content = fs.readFileSync(path.join(chunksDir, webpackFile), 'utf8');

      // 检查各种可能的绝对路径格式
      if (content.includes('.p="/_next/"') ||
          content.includes(".p='/_next/'") ||
          content.includes('.p = "/_next/"')) {
        errors.push(`${webpackFile} 仍包含绝对路径的 publicPath`);
      }
    }
  }

  return { errors, warnings };
}

async function main() {
  console.log('\n🚀 喵喵电竞 - Android 构建脚本 v2.0\n');
  console.log('='.repeat(50));

  try {
    // Step 1: 检查环境
    logStep('1/6', '检查构建环境...');

    if (!fs.existsSync(path.join(ROOT_DIR, 'package.json'))) {
      throw new Error('未找到 package.json，请在项目根目录运行');
    }

    if (!fs.existsSync(path.join(ROOT_DIR, 'android'))) {
      throw new Error('未找到 android 目录');
    }

    logSuccess('环境检查通过');

    // Step 2: 清理旧构建
    logStep('2/6', '清理旧构建文件...');

    rmDir(OUT_DIR);
    rmDir(ANDROID_ASSETS_DIR);

    // 同时清理可能存在的旧目录名
    const oldWebappDir = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'webapp');
    rmDir(oldWebappDir);
    const oldWebDir = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'assets', 'web');
    rmDir(oldWebDir);

    logSuccess('清理完成');

    // Step 3: 构建 Next.js
    logStep('3/6', '构建 Next.js 应用...');

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

    if (!fs.existsSync(OUT_DIR)) {
      throw new Error('构建失败：out 目录未生成，请确保 next.config.js 包含 output: "export"');
    }

    logSuccess('Next.js 构建完成');

    // Step 4: 复制到 Android assets
    logStep('4/6', '复制文件到 Android assets...');

    copyDir(OUT_DIR, ANDROID_ASSETS_DIR);
    logSuccess(`文件已复制到: ${path.relative(ROOT_DIR, ANDROID_ASSETS_DIR)}`);

    // Step 5: 修复路径（关键步骤！）
    logStep('5/6', '修复资源路径（关键步骤）...');

    log('修复 HTML 文件...', 'yellow');
    const htmlFixed = fixHtmlPaths(ANDROID_ASSETS_DIR);
    logDebug(`修复了 ${htmlFixed} 个 HTML 文件`);

    log('修复 JavaScript 文件（webpack publicPath）...', 'yellow');
    const jsFixed = fixJavaScriptPaths(ANDROID_ASSETS_DIR);
    logDebug(`修复了 ${jsFixed} 个 JS 文件`);

    log('修复 CSS 文件...', 'yellow');
    const cssFixed = fixCssPaths(ANDROID_ASSETS_DIR);
    logDebug(`修复了 ${cssFixed} 个 CSS 文件`);

    ensureManifest(ANDROID_ASSETS_DIR);

    logSuccess(`路径修复完成 (HTML: ${htmlFixed}, JS: ${jsFixed}, CSS: ${cssFixed})`);

    // Step 6: 验证构建结果
    logStep('6/6', '验证构建结果...');

    const validation = validateBuild(ANDROID_ASSETS_DIR);

    if (validation.errors.length > 0) {
      logError('构建验证失败:');
      validation.errors.forEach(e => logError(`  - ${e}`));
      throw new Error('构建验证失败');
    }

    if (validation.warnings.length > 0) {
      logWarning('构建警告:');
      validation.warnings.forEach(w => logWarning(`  - ${w}`));
    }

    logSuccess('构建验证通过');

    // 生成统计信息
    const stats = getStats(ANDROID_ASSETS_DIR);

    console.log('\n' + '='.repeat(50));
    console.log('📊 构建统计:');
    console.log(`   文件数量: ${stats.fileCount}`);
    console.log(`   总大小: ${formatSize(stats.totalSize)}`);
    console.log(`   输出目录: assets/www/`);
    console.log('='.repeat(50));

    logSuccess('🎉 构建完成!');

    console.log('\n📱 下一步:');
    console.log('   1. 打开 Android Studio');
    console.log('   2. 同步 Gradle (Sync Project with Gradle Files)');
    console.log('   3. 运行应用 (Run app)');
    console.log('\n或使用命令行:');
    console.log('   cd android && ./gradlew assembleDebug');
    console.log('');

  } catch (error) {
    logError(`构建失败: ${error.message}`);
    process.exit(1);
  }
}

main();
