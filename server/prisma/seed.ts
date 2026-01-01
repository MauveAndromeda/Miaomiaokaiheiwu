/**
 * 数据库初始化脚本
 * 运行: npx ts-node prisma/seed.ts
 * 或: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据库...');

  // ==================== 游戏数据 ====================
  console.log('📱 创建游戏数据...');

  const games = await Promise.all([
    prisma.game.upsert({
      where: { name: '王者荣耀' },
      update: {},
      create: {
        id: uuidv4(),
        name: '王者荣耀',
        icon: 'https://game-icons.example.com/wzry.png',
        category: 'moba',
        isHot: true,
        sortOrder: 1,
      },
    }),
    prisma.game.upsert({
      where: { name: '和平精英' },
      update: {},
      create: {
        id: uuidv4(),
        name: '和平精英',
        icon: 'https://game-icons.example.com/pubg.png',
        category: 'fps',
        isHot: true,
        sortOrder: 2,
      },
    }),
    prisma.game.upsert({
      where: { name: '英雄联盟' },
      update: {},
      create: {
        id: uuidv4(),
        name: '英雄联盟',
        icon: 'https://game-icons.example.com/lol.png',
        category: 'moba',
        isHot: true,
        sortOrder: 3,
      },
    }),
    prisma.game.upsert({
      where: { name: '永劫无间' },
      update: {},
      create: {
        id: uuidv4(),
        name: '永劫无间',
        icon: 'https://game-icons.example.com/naraka.png',
        category: 'action',
        isHot: true,
        sortOrder: 4,
      },
    }),
    prisma.game.upsert({
      where: { name: '原神' },
      update: {},
      create: {
        id: uuidv4(),
        name: '原神',
        icon: 'https://game-icons.example.com/genshin.png',
        category: 'rpg',
        isHot: true,
        sortOrder: 5,
      },
    }),
    prisma.game.upsert({
      where: { name: '金铲铲之战' },
      update: {},
      create: {
        id: uuidv4(),
        name: '金铲铲之战',
        icon: 'https://game-icons.example.com/tft.png',
        category: 'strategy',
        isHot: false,
        sortOrder: 6,
      },
    }),
  ]);

  console.log(`✅ 创建了 ${games.length} 个游戏`);

  // ==================== 测试用户 ====================
  console.log('👤 创建测试用户...');

  const testUser = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {},
    create: {
      id: uuidv4(),
      phone: '13800138000',
      nickname: '测试用户',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=1',
      gender: 'unknown',
      balance: 1000,
      level: 5,
      experience: 500,
    },
  });

  console.log(`✅ 创建测试用户: ${testUser.nickname} (${testUser.phone})`);

  // ==================== 教练用户 ====================
  console.log('👩‍🏫 创建教练数据...');

  const coachNames = [
    { nickname: '甜心小姐姐', gender: 'female', tags: ['女神', '声优', '秒回'] },
    { nickname: '暖阳学长', gender: 'male', tags: ['温柔', '耐心', '技术流'] },
    { nickname: '冰冰', gender: 'female', tags: ['女神', '高冷', '王者'] },
    { nickname: '小可爱', gender: 'female', tags: ['萌妹', '话唠', '有趣'] },
    { nickname: '大神阿杰', gender: 'male', tags: ['职业', '技术流', '冲分'] },
    { nickname: '糖糖', gender: 'female', tags: ['甜美', '声优', '陪聊'] },
  ];

  for (let i = 0; i < coachNames.length; i++) {
    const { nickname, gender, tags } = coachNames[i];

    const coach = await prisma.user.upsert({
      where: { phone: `1380013800${i + 1}` },
      update: {},
      create: {
        id: uuidv4(),
        phone: `1380013800${i + 1}`,
        nickname,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${i + 10}`,
        gender,
        bio: `大家好，我是${nickname}，期待和你一起开黑~`,
        balance: 0,
        level: Math.floor(Math.random() * 10) + 5,
        isCoach: true,
        isVip: Math.random() > 0.5,
      },
    });

    // 创建教练资料
    await prisma.coachProfile.upsert({
      where: { userId: coach.id },
      update: {},
      create: {
        id: uuidv4(),
        userId: coach.id,
        isVerified: true,
        verifiedAt: new Date(),
        rating: 4.5 + Math.random() * 0.5,
        totalOrders: Math.floor(Math.random() * 500) + 100,
        completedOrders: Math.floor(Math.random() * 400) + 100,
        responseRate: 95 + Math.random() * 5,
        acceptRate: 90 + Math.random() * 10,
        onlineStatus: Math.random() > 0.3 ? 'online' : 'offline',
        isAccepting: true,
        tags: JSON.stringify(tags),
        images: JSON.stringify([
          `https://picsum.photos/400/500?random=${i + 1}`,
          `https://picsum.photos/400/500?random=${i + 10}`,
        ]),
      },
    });

    // 创建服务价格
    await prisma.coachService.createMany({
      data: [
        {
          id: uuidv4(),
          coachId: coach.id,
          type: 'play',
          price: 15 + Math.floor(Math.random() * 20),
          unit: 'round',
          isEnabled: true,
        },
        {
          id: uuidv4(),
          coachId: coach.id,
          type: 'voice',
          price: 20 + Math.floor(Math.random() * 30),
          unit: 'minute',
          isEnabled: true,
        },
        {
          id: uuidv4(),
          coachId: coach.id,
          type: 'video',
          price: 50 + Math.floor(Math.random() * 50),
          unit: 'minute',
          isEnabled: gender === 'female',
        },
      ],
      skipDuplicates: true,
    });

    // 关联游戏
    const randomGames = games.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const game of randomGames) {
      await prisma.coachGame.upsert({
        where: {
          coachId_gameId: {
            coachId: coach.id,
            gameId: game.id,
          },
        },
        update: {},
        create: {
          id: uuidv4(),
          coachId: coach.id,
          gameId: game.id,
          rank: ['王者', '星耀', '钻石', '铂金'][Math.floor(Math.random() * 4)],
          isMain: randomGames.indexOf(game) === 0,
        },
      });
    }
  }

  console.log(`✅ 创建了 ${coachNames.length} 个教练`);

  // ==================== 系统配置 ====================
  console.log('⚙️ 创建系统配置...');

  const configs = [
    { key: 'platform_fee_rate', value: '0.2', remark: '平台抽成比例' },
    { key: 'min_withdraw_amount', value: '100', remark: '最低提现金额' },
    { key: 'order_timeout_minutes', value: '30', remark: '订单超时时间（分钟）' },
    { key: 'sms_template_login', value: 'SMS_123456', remark: '登录短信模板' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: {
        id: uuidv4(),
        ...config,
      },
    });
  }

  console.log(`✅ 创建了 ${configs.length} 条系统配置`);

  console.log('');
  console.log('🎉 数据库初始化完成！');
  console.log('');
  console.log('📝 测试账号:');
  console.log('   手机号: 13800138000');
  console.log('   验证码: 123456 (开发环境)');
}

main()
  .catch((e) => {
    console.error('❌ 初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
