/**
 * 输入验证规则集合
 * 使用 express-validator 进行严格的输入验证
 */

import { body, param, query } from 'express-validator';

// ==================== 通用验证规则 ====================

// UUID验证
const isUUID = (field: string, location: 'body' | 'param' | 'query' = 'param') => {
  const validator = location === 'body' ? body(field) : location === 'param' ? param(field) : query(field);
  return validator
    .trim()
    .isUUID()
    .withMessage(`${field} 必须是有效的UUID`);
};

// 分页验证
export const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('页码必须是1-1000之间的整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页条数必须是1-100之间的整数'),
];

// ==================== 认证相关验证 ====================

export const sendSmsRules = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号'),
];

export const loginRules = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('手机号不能为空')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入有效的手机号'),
  body('code')
    .trim()
    .notEmpty()
    .withMessage('验证码不能为空')
    .isLength({ min: 4, max: 6 })
    .withMessage('验证码长度必须是4-6位')
    .isNumeric()
    .withMessage('验证码只能包含数字'),
];

// ==================== 订单相关验证 ====================

export const createOrderRules = [
  body('coachId')
    .trim()
    .notEmpty()
    .withMessage('教练ID不能为空')
    .isUUID()
    .withMessage('教练ID格式无效'),
  body('serviceType')
    .trim()
    .notEmpty()
    .withMessage('服务类型不能为空')
    .isIn(['play', 'voice', 'video'])
    .withMessage('服务类型必须是 play、voice 或 video'),
  body('gameId')
    .trim()
    .notEmpty()
    .withMessage('游戏ID不能为空')
    .isUUID()
    .withMessage('游戏ID格式无效'),
  body('quantity')
    .notEmpty()
    .withMessage('数量不能为空')
    .isInt({ min: 1, max: 100 })
    .withMessage('数量必须是1-100之间的整数'),
  body('remark')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('备注不能超过500个字符')
    .customSanitizer((value) => {
      // 过滤危险字符
      return value?.replace(/<[^>]*>/g, '').replace(/[<>'"]/g, '');
    }),
];

export const payOrderRules = [
  param('orderId')
    .trim()
    .isUUID()
    .withMessage('订单ID格式无效'),
  body('method')
    .trim()
    .notEmpty()
    .withMessage('支付方式不能为空')
    .isIn(['balance', 'wechat', 'alipay'])
    .withMessage('支付方式必须是 balance、wechat 或 alipay'),
];

export const cancelOrderRules = [
  param('orderId')
    .trim()
    .isUUID()
    .withMessage('订单ID格式无效'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('取消原因不能超过200个字符'),
];

export const reviewOrderRules = [
  param('orderId')
    .trim()
    .isUUID()
    .withMessage('订单ID格式无效'),
  body('rating')
    .notEmpty()
    .withMessage('评分不能为空')
    .isInt({ min: 1, max: 5 })
    .withMessage('评分必须是1-5之间的整数'),
  body('content')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('评价内容不能超过1000个字符')
    .customSanitizer((value) => {
      return value?.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
    }),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('标签最多10个'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ max: 20 })
    .withMessage('每个标签最多20个字符'),
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('匿名标识必须是布尔值'),
];

// ==================== 支付相关验证 ====================

export const rechargeRules = [
  body('amount')
    .notEmpty()
    .withMessage('充值金额不能为空')
    .isIn([6, 30, 68, 128, 328, 648])
    .withMessage('无效的充值金额'),
  body('method')
    .trim()
    .notEmpty()
    .withMessage('支付方式不能为空')
    .isIn(['wechat', 'alipay'])
    .withMessage('支付方式必须是 wechat 或 alipay'),
];

// ==================== 用户相关验证 ====================

export const updateProfileRules = [
  body('nickname')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('昵称长度必须是1-20个字符')
    .customSanitizer((value) => {
      return value?.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
    }),
  body('avatar')
    .optional()
    .trim()
    .isURL()
    .withMessage('头像必须是有效的URL'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'unknown'])
    .withMessage('性别必须是 male、female 或 unknown'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('简介不能超过200个字符')
    .customSanitizer((value) => {
      return value?.replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
    }),
  body('birthday')
    .optional()
    .isISO8601()
    .withMessage('生日格式无效'),
];

// ==================== 消息相关验证 ====================

export const sendMessageRules = [
  body('receiverId')
    .trim()
    .notEmpty()
    .withMessage('接收者ID不能为空')
    .isUUID()
    .withMessage('接收者ID格式无效'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'voice', 'video'])
    .withMessage('消息类型必须是 text、image、voice 或 video'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('消息内容不能为空')
    .isLength({ max: 5000 })
    .withMessage('消息内容不能超过5000个字符'),
];

// ==================== 搜索相关验证 ====================

export const searchRules = [
  query('keyword')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('搜索关键词不能超过50个字符')
    .customSanitizer((value) => {
      return value?.replace(/[<>'"]/g, '');
    }),
  query('gameId')
    .optional()
    .isUUID()
    .withMessage('游戏ID格式无效'),
  query('gender')
    .optional()
    .isIn(['male', 'female', 'all'])
    .withMessage('性别筛选必须是 male、female 或 all'),
  query('priceMin')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('最低价格必须是0-10000之间的整数'),
  query('priceMax')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('最高价格必须是0-10000之间的整数'),
  query('sortBy')
    .optional()
    .isIn(['price', 'rating', 'orders', 'online'])
    .withMessage('排序方式无效'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('排序顺序必须是 asc 或 desc'),
  ...paginationRules,
];

// ==================== 教练申请验证 ====================

export const applyCoachRules = [
  body('realName')
    .trim()
    .notEmpty()
    .withMessage('真实姓名不能为空')
    .isLength({ min: 2, max: 20 })
    .withMessage('真实姓名长度必须是2-20个字符')
    .matches(/^[\u4e00-\u9fa5a-zA-Z]+$/)
    .withMessage('真实姓名只能包含中文或英文'),
  body('idCard')
    .trim()
    .notEmpty()
    .withMessage('身份证号不能为空')
    .matches(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/)
    .withMessage('身份证号格式无效'),
  body('games')
    .isArray({ min: 1, max: 5 })
    .withMessage('请选择1-5个游戏'),
  body('games.*.gameId')
    .isUUID()
    .withMessage('游戏ID格式无效'),
  body('games.*.rank')
    .trim()
    .isLength({ max: 50 })
    .withMessage('段位描述不能超过50个字符'),
];

// ==================== 举报相关验证 ====================

export const reportRules = [
  body('targetId')
    .trim()
    .notEmpty()
    .withMessage('举报目标ID不能为空')
    .isUUID()
    .withMessage('举报目标ID格式无效'),
  body('targetType')
    .trim()
    .notEmpty()
    .withMessage('举报类型不能为空')
    .isIn(['user', 'coach', 'order', 'message', 'review'])
    .withMessage('举报类型无效'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('举报原因不能为空')
    .isIn(['spam', 'abuse', 'fraud', 'inappropriate', 'other'])
    .withMessage('举报原因无效'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('详细描述不能超过500个字符'),
];
