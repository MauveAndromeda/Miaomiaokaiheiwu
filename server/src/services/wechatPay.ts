/**
 * 微信支付服务
 * 使用微信支付V3 API - 安全加固版本
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';

interface CreateOrderParams {
  orderId: string;
  orderNo: string;
  amount: number; // 单位：分
  description: string;
}

interface PaymentResult {
  prepayId?: string;
  paySign?: string;
  timeStamp?: string;
  nonceStr?: string;
  package?: string;
  signType?: string;
  appId?: string;
  partnerId?: string;
}

interface NotifyResult {
  success: boolean;
  orderId?: string;
  transactionId?: string;
  amount?: number;
}

interface WechatNotifyHeaders {
  'wechatpay-signature': string;
  'wechatpay-timestamp': string;
  'wechatpay-nonce': string;
  'wechatpay-serial': string;
}

export class WechatPayService {
  private appId: string;
  private mchId: string;
  private apiKeyV3: string;
  private serialNo: string;
  private privateKey: string;
  private wechatPublicKey: string;
  private notifyUrl: string;
  private readonly isDev: boolean;

  constructor() {
    this.isDev = process.env.NODE_ENV !== 'production';
    this.appId = process.env.WECHAT_APP_ID || '';
    this.mchId = process.env.WECHAT_MCH_ID || '';
    this.apiKeyV3 = process.env.WECHAT_API_KEY_V3 || '';
    this.serialNo = process.env.WECHAT_SERIAL_NO || '';
    this.privateKey = process.env.WECHAT_PRIVATE_KEY || '';
    this.wechatPublicKey = process.env.WECHAT_PUBLIC_KEY || '';
    this.notifyUrl = process.env.WECHAT_NOTIFY_URL || '';

    // 生产环境必须配置
    if (!this.isDev && (!this.appId || !this.mchId || !this.apiKeyV3)) {
      logger.error('CRITICAL: 微信支付配置不完整！');
    }
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 生成签名
   */
  private generateSign(method: string, url: string, timestamp: string, nonceStr: string, body: string): string {
    const message = `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * 验证微信签名 - CRITICAL安全措施
   */
  private verifySignature(
    timestamp: string,
    nonce: string,
    body: string,
    signature: string
  ): boolean {
    if (!this.wechatPublicKey) {
      logger.error('微信公钥未配置，无法验证签名');
      return false;
    }

    try {
      const message = `${timestamp}\n${nonce}\n${body}\n`;
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(message);
      return verify.verify(this.wechatPublicKey, signature, 'base64');
    } catch (error) {
      logger.error('验证微信签名失败:', error);
      return false;
    }
  }

  /**
   * 解密通知内容 (AEAD_AES_256_GCM)
   */
  private decryptResource(resource: {
    algorithm: string;
    ciphertext: string;
    associated_data: string;
    nonce: string;
  }): any {
    if (!this.apiKeyV3) {
      throw new Error('API V3 密钥未配置');
    }

    const { ciphertext, associated_data, nonce } = resource;

    const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
    const authTag = ciphertextBuffer.slice(-16);
    const data = ciphertextBuffer.slice(0, -16);

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.apiKeyV3),
      Buffer.from(nonce)
    );

    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from(associated_data));

    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * 生成APP支付签名
   */
  private generateAppPaySign(prepayId: string, timestamp: string, nonceStr: string): string {
    const message = `${this.appId}\n${timestamp}\n${nonceStr}\n${prepayId}\n`;
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message);
    return sign.sign(this.privateKey, 'base64');
  }

  /**
   * 创建支付订单
   */
  async createOrder(params: CreateOrderParams): Promise<PaymentResult> {
    const { orderId, orderNo, amount, description } = params;

    // 参数验证
    if (amount <= 0 || !Number.isInteger(amount)) {
      throw new ApiError(400, '金额必须是正整数（单位：分）');
    }

    if (!orderNo || orderNo.length > 32) {
      throw new ApiError(400, '订单号无效');
    }

    // 开发模式返回模拟数据
    if (this.isDev || !this.appId || !this.mchId) {
      logger.warn('[DEV] 使用模拟微信支付');
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = this.generateNonceStr();
      return {
        prepayId: `mock_prepay_${orderId}`,
        appId: this.appId || 'wx_mock_app_id',
        partnerId: this.mchId || 'mock_mch_id',
        timeStamp: timestamp,
        nonceStr,
        package: 'Sign=WXPay',
        signType: 'RSA',
        paySign: 'mock_sign_for_development',
      };
    }

    try {
      const WxPay = require('wechatpay-node-v3');
      const fs = require('fs');

      const pay = new WxPay({
        appid: this.appId,
        mchid: this.mchId,
        publicKey: fs.readFileSync('./certs/wechat/apiclient_cert.pem'),
        privateKey: this.privateKey,
      });

      // APP支付
      const result = await pay.transactions_app({
        description: description.substring(0, 127), // 限制长度
        out_trade_no: orderNo,
        notify_url: this.notifyUrl,
        amount: {
          total: amount,
          currency: 'CNY',
        },
      });

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = this.generateNonceStr();
      const paySign = this.generateAppPaySign(result.prepay_id, timestamp, nonceStr);

      logger.info(`创建微信支付订单成功: ${orderNo}, 金额: ${amount}分`);

      return {
        prepayId: result.prepay_id,
        appId: this.appId,
        partnerId: this.mchId,
        timeStamp: timestamp,
        nonceStr,
        package: 'Sign=WXPay',
        signType: 'RSA',
        paySign,
      };
    } catch (error) {
      logger.error('创建微信支付订单失败:', error);
      throw new ApiError(500, '创建支付订单失败');
    }
  }

  /**
   * 处理支付回调 - 包含签名验证
   */
  async handleNotify(body: any, headers: any): Promise<NotifyResult> {
    // 开发模式跳过验证
    if (this.isDev && !this.wechatPublicKey) {
      logger.warn('[DEV] 跳过微信签名验证');
      const mockResult = {
        out_trade_no: body.out_trade_no || body.resource?.out_trade_no || 'mock_order',
        transaction_id: body.transaction_id || `wx_${Date.now()}`,
        trade_state: 'SUCCESS',
        amount: { total: body.amount?.total || 100 },
      };

      return {
        success: true,
        orderId: mockResult.out_trade_no,
        transactionId: mockResult.transaction_id,
        amount: mockResult.amount.total,
      };
    }

    try {
      // 1. 提取签名相关头部
      const signature = headers['wechatpay-signature'];
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];
      const serial = headers['wechatpay-serial'];

      if (!signature || !timestamp || !nonce) {
        logger.error('微信回调缺少必要的头部信息');
        return { success: false };
      }

      // 2. 验证时间戳（防止重放攻击，5分钟内有效）
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - parseInt(timestamp)) > 300) {
        logger.error('微信回调时间戳过期');
        return { success: false };
      }

      // 3. 验证签名 - CRITICAL
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      if (!this.verifySignature(timestamp, nonce, bodyStr, signature)) {
        logger.error('微信回调签名验证失败！可能存在伪造请求');
        return { success: false };
      }

      // 4. 解密通知内容
      const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
      const resource = parsedBody.resource;

      if (!resource) {
        logger.error('微信回调缺少resource字段');
        return { success: false };
      }

      const decrypted = this.decryptResource(resource);

      // 5. 验证支付状态
      if (decrypted.trade_state === 'SUCCESS') {
        logger.info(`微信支付成功: 订单=${decrypted.out_trade_no}, 交易号=${decrypted.transaction_id}`);
        return {
          success: true,
          orderId: decrypted.out_trade_no,
          transactionId: decrypted.transaction_id,
          amount: decrypted.amount?.total,
        };
      }

      logger.warn(`微信支付状态异常: ${decrypted.trade_state}`);
      return { success: false };
    } catch (error) {
      logger.error('处理微信支付回调失败:', error);
      return { success: false };
    }
  }

  /**
   * 查询订单状态
   */
  async queryOrder(orderNo: string): Promise<any> {
    if (this.isDev || !this.appId) {
      logger.info(`[DEV] 查询微信支付订单: ${orderNo}`);
      return { trade_state: 'SUCCESS' };
    }

    try {
      const WxPay = require('wechatpay-node-v3');
      const fs = require('fs');

      const pay = new WxPay({
        appid: this.appId,
        mchid: this.mchId,
        publicKey: fs.readFileSync('./certs/wechat/apiclient_cert.pem'),
        privateKey: this.privateKey,
      });

      const result = await pay.query({ out_trade_no: orderNo });
      return result;
    } catch (error) {
      logger.error('查询微信支付订单失败:', error);
      throw new ApiError(500, '查询订单失败');
    }
  }

  /**
   * 申请退款
   */
  async refund(
    orderNo: string,
    refundNo: string,
    totalAmount: number,
    refundAmount: number,
    reason?: string
  ): Promise<boolean> {
    if (refundAmount <= 0 || refundAmount > totalAmount) {
      throw new ApiError(400, '退款金额无效');
    }

    if (this.isDev || !this.appId) {
      logger.info(`[DEV] 申请微信退款: ${orderNo}, 金额: ${refundAmount}分`);
      return true;
    }

    try {
      const WxPay = require('wechatpay-node-v3');
      const fs = require('fs');

      const pay = new WxPay({
        appid: this.appId,
        mchid: this.mchId,
        publicKey: fs.readFileSync('./certs/wechat/apiclient_cert.pem'),
        privateKey: this.privateKey,
      });

      await pay.refunds({
        out_trade_no: orderNo,
        out_refund_no: refundNo,
        reason: reason?.substring(0, 80),
        amount: {
          refund: refundAmount,
          total: totalAmount,
          currency: 'CNY',
        },
      });

      logger.info(`微信退款申请成功: ${orderNo}, 退款金额: ${refundAmount}分`);
      return true;
    } catch (error) {
      logger.error('申请微信退款失败:', error);
      throw new ApiError(500, '退款申请失败');
    }
  }
}

export const wechatPayService = new WechatPayService();
