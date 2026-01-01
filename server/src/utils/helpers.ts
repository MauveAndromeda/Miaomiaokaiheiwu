/**
 * 辅助工具函数
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * 生成订单号
 * 格式: 年月日时分秒 + 4位随机数
 */
export function generateOrderNo(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const second = now.getSeconds().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

  return `${year}${month}${day}${hour}${minute}${second}${random}`;
}

/**
 * 生成随机昵称
 */
export function generateNickname(): string {
  const adjectives = [
    '快乐的', '可爱的', '调皮的', '机智的', '勇敢的',
    '温柔的', '活泼的', '聪明的', '神秘的', '闪亮的',
  ];
  const nouns = [
    '小猫咪', '小狐狸', '小熊猫', '小老虎', '小兔子',
    '小松鼠', '小鹿', '小企鹅', '小海豚', '小天使',
  ];
  const number = Math.floor(Math.random() * 1000);

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adj}${noun}${number}`;
}

/**
 * 生成随机头像URL
 */
export function generateAvatar(): string {
  const avatarId = Math.floor(Math.random() * 100) + 1;
  // 使用随机头像服务
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${avatarId}`;
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 手机号脱敏
 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 生成UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * 分页计算
 */
export function paginate(page: number, limit: number) {
  const skip = (page - 1) * limit;
  return { skip, take: limit };
}

/**
 * 计算分页信息
 */
export function paginationInfo(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
