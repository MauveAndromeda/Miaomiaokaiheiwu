/**
 * 支付宝服务
 * 安全加固版本 - 包含签名验证
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';

interface CreateOrderParams {
  orderId: string;
  orderNo: string;
  amount: number; // 单位：分
  subject: string;
}

interface PaymentResult {
  orderStr?: string; // App支付签名字符串
  tradeNo?: string;
}

interface NotifyResult {
  success: boolean;
  orderId?: string;
  tradeNo?: string;
  amount?: number;
}

export class AlipayService {
  private appId: string;
  private privateKey: string;
  private alipayPublicKey: string;
  private notifyUrl: string;
  private readonly isDev: boolean;
  private readonly signType = 'RSA2';

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
    this.appId = process.env.ALIPAY_APP_ID || '';
    this.privateKey = process.env.ALIPAY_PRIVATE_KEY || '';
    this.alipayPublicKey = process.env.ALIPAY_PUBLIC_KEY || '';
    this.notifyUrl = process.env.ALIPAY_NOTIFY_URL || '';

    // 生产环境必须配置
    if (!this.isDev && (!this.appId || !this.privateKey || !this.alipayPublicKey)) {
      logger.error('CRITICAL: 支付宝配置不完整！');
    }
  }

  /**
   * 验证支付宝签名 - CRITICAL安全措施
   */
  private verifySign(params: Record<string, string>): boolean {
    if (!this.alipayPublicKey) {
      logger.error('支付宝公钥未配置，无法验证签名');
      return false;
    }

    try {
      // 1. 提取签名
      const sign = params.sign;
      const signType = params.sign_type || 'RSA2';

      if (!sign) {
        logger.error('支付宝回调缺少签名');
        return false;
      }

      // 2. 构建待验签字符串（按字母排序，排除sign和sign_type）
      const sortedKeys = Object.keys(params)
        .filter(key => key !== 'sign' && key !== 'sign_type' && params[key] !== '')
        .sort();

      const signStr = sortedKeys
        .map(key => `${key}=${params[key]}`)
        .join('&');

      // 3. 验证签名
      const algorithm = signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1';
      const verify = crypto.createVerify(algorithm);
      verify.update(signStr, 'utf8');

      // 支付宝公钥需要添加PEM头尾
      let publicKey = this.alipayPublicKey;
      if (!publicKey.includes('-----BEGIN')) {
        publicKey = `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
      }

      return verify.verify(publicKey, sign, 'base64');
    } catch (error) {
      logger.error('验证支付宝签名失败:', error);
      return false;
    }
  }

  /**
   * 生成签名
   */
  private generateSign(params: Record<string, string>): string {
    // 按字母排序
    const sortedKeys = Object.keys(params)
      .filter(key => params[key] !== '' && params[key] !== undefined)
      .sort();

    const signStr = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 私钥需要添加PEM头尾
    let privateKey = this.privateKey;
    if (!privateKey.includes('-----BEGIN')) {
      privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${privateKey}\n-----END RSA PRIVATE KEY-----`;
    }

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signStr, 'utf8');
    return sign.sign(privateKey, 'base64');
  }

  /**
   * 创建支付订单
   */
  async createOrder(params: CreateOrderParams): Promise<PaymentResult> {
    const { orderId, orderNo, amount, subject } = params;

    // 参数验证
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new ApiError(400, '金额必须是正整数（单位：分）');
    }

    if (!orderNo || orderNo.length > 64) {
      throw new ApiError(400, '订单号无效');
    }

    // 开发模式返回模拟数据
    if (this.isDev || !this.appId || !this.privateKey) {
      logger.warn('[DEV] 使用模拟支付宝支付');
      return {
        orderStr: `mock_alipay_order_${orderId}`,
        tradeNo: `mock_trade_${Date.now()}`,
      };
    }

    try {
      const AlipaySdk = require('alipay-sdk').default;

      const alipaySdk = new AlipaySdk({
        appId: this.appId,
        privateKey: this.privateKey,
        alipayPublicKey: this.alipayPublicKey,
        signType: this.signType,
      });

      // APP支付
      const result = await alipaySdk.sdkExec('alipay.trade.app.pay', {
        notifyUrl: this.notifyUrl,
        bizContent: {
          out_trade_no: orderNo,
          total_amount: (amount / 100).toFixed(2), // 转换为元
          subject: subject.substring(0, 256), // 限制长度
          product_code: 'QUICK_MSECURITY_PAY',
        },
      });

      logger.info(`创建支付宝订单成功: ${orderNo}, 金额: ${amount}分`);

      return {
        orderStr: result,
      };
    } catch (error) {
      logger.error('创建支付宝订单失败:', error);
      throw new ApiError(500, '创建支付订单失败');
    }
  }

  /**
   * 处理支付回调 - 包含签名验证
   */
  async handleNotify(params: Record<string, string>): Promise<NotifyResult> {
    // 开发模式跳过验证
    if (this.isDev && !this.alipayPublicKey) {
      logger.warn('[DEV] 跳过支付宝签名验证');
      const { out_trade_no, trade_no, trade_status, total_amount } = params;

      if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
        return {
          success: true,
          orderId: out_trade_no,
          tradeNo: trade_no,
          amount: total_amount ? Math.round(parseFloat(total_amount) * 100) : undefined,
        };
      }
      return { success: false };
    }

    try {
      // 1. 验证签名 - CRITICAL
      if (!this.verifySign(params)) {
        logger.error('支付宝回调签名验证失败！可能存在伪造请求');
        return { success: false };
      }

      logger.info('支付宝签名验证成功');

      // 2. 验证app_id
      if (params.app_id !== this.appId) {
        logger.error(`支付宝app_id不匹配: ${params.app_id} !== ${this.appId}`);
        return { success: false };
      }

      // 3. 提取交易信息
      const {
        out_trade_no,
        trade_no,
        trade_status,
        total_amount,
        seller_id,
      } = params;

      // 4. 验证交易状态
      if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
        logger.info(`支付宝支付成功: 订单=${out_trade_no}, 交易号=${trade_no}`);
        return {
          success: true,
          orderId: out_trade_no,
          tradeNo: trade_no,
          amount: total_amount ? Math.round(parseFloat(total_amount) * 100) : undefined,
        };
      }

      logger.warn(`支付宝支付状态异常: ${trade_status}`);
      return { success: false };
    } catch (error) {
      logger.error('处理支付宝回调失败:', error);
      return { success: false };
    }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(orderNo: string): Promise<any> {
    if (this.isDev || !this.appId) {
      logger.info(`[DEV] 查询支付宝订单: ${orderNo}`);
      return { trade_status: 'TRADE_SUCCESS' };
    }

    try {
      const AlipaySdk = require('alipay-sdk').default;

      const alipaySdk = new AlipaySdk({
        appId: this.appId,
        privateKey: this.privateKey,
        alipayPublicKey: this.alipayPublicKey,
      });

      const result = await alipaySdk.exec('alipay.trade.query', {
        bizContent: {
          out_trade_no: orderNo,
        },
      });

      return result;
    } catch (error) {
      logger.error('查询支付宝订单失败:', error);
      throw new ApiError(500, '查询订单失败');
    }
  }

  /**
   * 申请退款
   */
  async refund(
    orderNo: string,
    refundNo: string,
    refundAmount: number,
    reason?: string
  ): Promise<boolean> {
    if (refundAmount <= 0) {
      throw new ApiError(400, '退款金额无效');
    }

    if (this.isDev || !this.appId) {
      logger.info(`[DEV] 申请支付宝退款: ${orderNo}, 金额: ${refundAmount}分`);
      return true;
    }

    try {
      const AlipaySdk = require('alipay-sdk').default;

      const alipaySdk = new AlipaySdk({
        appId: this.appId,
        privateKey: this.privateKey,
        alipayPublicKey: this.alipayPublicKey,
      });

      const result = await alipaySdk.exec('alipay.trade.refund', {
        bizContent: {
          out_trade_no: orderNo,
          out_request_no: refundNo,
          refund_amount: (refundAmount / 100).toFixed(2),
          refund_reason: reason?.substring(0, 256),
        },
      });

      if (result.code === '10000') {
        logger.info(`支付宝退款成功: ${orderNo}, 退款金额: ${refundAmount}分`);
        return true;
      }

      logger.error(`支付宝退款失败: ${result.msg}`);
      return false;
    } catch (error) {
      logger.error('申请支付宝退款失败:', error);
      throw new ApiError(500, '退款申请失败');
    }
  }

  /**
   * 关闭订单
   */
  async closeOrder(orderNo: string): Promise<boolean> {
    if (this.isDev || !this.appId) {
      logger.info(`[DEV] 关闭支付宝订单: ${orderNo}`);
      return true;
    }

    try {
      const AlipaySdk = require('alipay-sdk').default;

      const alipaySdk = new AlipaySdk({
        appId: this.appId,
        privateKey: this.privateKey,
        alipayPublicKey: this.alipayPublicKey,
      });

      const result = await alipaySdk.exec('alipay.trade.close', {
        bizContent: {
          out_trade_no: orderNo,
        },
      });

      return result.code === '10000';
    } catch (error) {
      logger.error('关闭支付宝订单失败:', error);
      return false;
    }
  }
}

export const alipayService = new AlipayService();
