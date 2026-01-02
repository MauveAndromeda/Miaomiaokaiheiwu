#!/usr/bin/env node
/**
 * 修复Next.js静态导出的资源路径
 * 将绝对路径 /_next/ 转换为相对路径 ./_next/
 * 确保在file://协议下可以正确加载资源
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

console.log('=== 开始修复资源路径 ===');
console.log('目录:', outDir);

// 递归查找文件
function findFiles(dir, extensions, files = []) {
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

// 递归查找所有HTML文件
function findHtmlFiles(dir, files = []) {
  return findFiles(dir, ['.html'], files);
}

// 修复HTML文件中的路径
function fixPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // 替换所有 /_next/ 为 ./_next/
  content = content.replace(/"\/_next\//g, '"./_next/');
  content = content.replace(/'\/_next\//g, "'./_next/");

  // 替换 href="/_next/ 和 src="/_next/
  content = content.replace(/href="\/_next\//g, 'href="./_next/');
  content = content.replace(/src="\/_next\//g, 'src="./_next/');

  // 替换 /manifest.json 为 ./manifest.json
  content = content.replace(/href="\/manifest\.json"/g, 'href="./manifest.json"');
  content = content.replace(/href='\/manifest\.json'/g, "href='./manifest.json'");

  // 替换其他根路径资源
  content = content.replace(/href="\/favicon/g, 'href="./favicon');
  content = content.replace(/href="\/icon/g, 'href="./icon');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('已修复:', path.relative(outDir, filePath));
    return true;
  }
  return false;
}

// 修复webpack chunk中的公共路径
function fixWebpackChunks() {
  const chunksDir = path.join(outDir, '_next', 'static', 'chunks');
  if (!fs.existsSync(chunksDir)) {
    console.log('警告: chunks目录不存在，跳过webpack修复');
    return 0;
  }

  const jsFiles = findFiles(chunksDir, ['.js']);
  console.log(`找到 ${jsFiles.length} 个JS文件`);

  let fixedCount = 0;
  for (const file of jsFiles) {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;

    // 修复webpack publicPath: d.p="/_next/" -> d.p="./_next/"
    // 同时处理可能的变体格式
    content = content.replace(/\.p="?\/_next\/"?/g, '.p="./_next/"');
    content = content.replace(/\.p='?\/_next\/'?/g, ".p='./_next/'");

    // 修复其他可能的绝对路径引用
    content = content.replace(/"?\/_next\/static\//g, '"./_next/static/');

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('已修复JS:', path.relative(outDir, file));
      fixedCount++;
    }
  }

  return fixedCount;
}

// 检查并创建manifest.json
function createManifest() {
  const manifestPath = path.join(outDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    const manifest = {
      name: '喵喵开黑屋',
      short_name: '喵喵开黑屋',
      description: '一起开黑，快乐加倍',
      start_url: './index.html',
      display: 'standalone',
      background_color: '#0a0a0f',
      theme_color: '#ff6b9d',
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
    console.log('已创建: manifest.json');
  }
}

// 主函数
function main() {
  if (!fs.existsSync(outDir)) {
    console.error('错误: out目录不存在');
    process.exit(1);
  }

  // 修复HTML文件
  const htmlFiles = findHtmlFiles(outDir);
  console.log(`找到 ${htmlFiles.length} 个HTML文件`);

  let htmlFixedCount = 0;
  for (const file of htmlFiles) {
    if (fixPaths(file)) {
      htmlFixedCount++;
    }
  }

  // 修复webpack chunks (关键！)
  console.log('\n=== 修复webpack chunks ===');
  const jsFixedCount = fixWebpackChunks();

  // 创建manifest
  createManifest();

  console.log(`\n=== 修复完成 ===`);
  console.log(`HTML文件: ${htmlFixedCount} 个`);
  console.log(`JS文件: ${jsFixedCount} 个`);

  // 验证HTML修复结果
  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    const hasAbsolutePaths = content.includes('"/_next/') || content.includes("'/_next/");
    if (hasAbsolutePaths) {
      console.error('错误: index.html仍然包含绝对路径!');
      process.exit(1);
    } else {
      console.log('HTML验证通过: 所有路径已转换为相对路径');
    }
  }

  // 验证webpack修复结果
  const webpackFiles = findFiles(path.join(outDir, '_next', 'static', 'chunks'), ['.js']);
  for (const file of webpackFiles) {
    if (file.includes('webpack')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('.p="/_next/"') || content.includes(".p='/_next/'")) {
        console.error('错误: webpack文件仍然包含绝对publicPath!');
        console.error('文件:', path.relative(outDir, file));
        process.exit(1);
      }
    }
  }
  console.log('Webpack验证通过: publicPath已转换为相对路径');
}

main();
