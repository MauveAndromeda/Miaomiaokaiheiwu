/**
 * 支付宝服务
 */

import { logger } from '../utils/logger';

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
}

export class AlipayService {
  private appId: string;
  private privateKey: string;
  private alipayPublicKey: string;
  private notifyUrl: string;

  constructor() {
    this.appId = process.env.ALIPAY_APP_ID || '';
    this.privateKey = process.env.ALIPAY_PRIVATE_KEY || '';
    this.alipayPublicKey = process.env.ALIPAY_ALIPAY_PUBLIC_KEY || '';
    this.notifyUrl = process.env.ALIPAY_NOTIFY_URL || '';
  }

  /**
   * 创建支付订单
   */
  async createOrder(params: CreateOrderParams): Promise<PaymentResult> {
    const { orderId, orderNo, amount, subject } = params;

    // 检查配置
    if (!this.appId || !this.privateKey) {
      logger.warn('支付宝未配置');
      // 返回模拟数据用于开发
      return {
        orderStr: `mock_alipay_order_${orderId}`,
        tradeNo: `mock_trade_${Date.now()}`,
      };
    }

    try {
      // 实际调用支付宝SDK
      /*
      const AlipaySdk = require('alipay-sdk').default;

      const alipaySdk = new AlipaySdk({
        appId: this.appId,
        privateKey: this.privateKey,
        alipayPublicKey: this.alipayPublicKey,
      });

      const result = await alipaySdk.sdkExec('alipay.trade.app.pay', {
        notifyUrl: this.notifyUrl,
        bizContent: {
          out_trade_no: orderNo,
          total_amount: (amount / 100).toFixed(2), // 转换为元
          subject,
          product_code: 'QUICK_MSECURITY_PAY',
        },
      });

      return {
        orderStr: result,
      };
      */

      logger.info(`创建支付宝订单: ${orderNo}, 金额: ${amount}分`);

      // 模拟返回
      const mockOrderStr = `app_id=${this.appId}&method=alipay.trade.app.pay&charset=utf-8&sign_type=RSA2&timestamp=${new Date().toISOString()}&version=1.0&notify_url=${encodeURIComponent(this.notifyUrl)}&biz_content=${encodeURIComponent(JSON.stringify({
        out_trade_no: orderNo,
        total_amount: (amount / 100).toFixed(2),
        subject,
        product_code: 'QUICK_MSECURITY_PAY',
      }))}&sign=mock_sign`;

      return {
        orderStr: mockOrderStr,
      };
    } catch (error) {
      logger.error('创建支付宝订单失败:', error);
      throw error;
    }
  }

  /**
   * 处理支付回调
   */
  async handleNotify(params: any): Promise<NotifyResult> {
    try {
      // 验证签名
      /*
      const AlipaySdk = require('alipay-sdk').default;

      const alipaySdk = new AlipaySdk({
        appId: this.appId,
        privateKey: this.privateKey,
        alipayPublicKey: this.alipayPublicKey,
      });

      const signVerified = alipaySdk.checkNotifySign(params);

      if (!signVerified) {
        logger.warn('支付宝回调签名验证失败');
        return { success: false };
      }
      */

      const {
        out_trade_no,
        trade_no,
        trade_status,
      } = params;

      if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
        return {
          success: true,
          orderId: out_trade_no,
          tradeNo: trade_no,
        };
      }

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
    logger.info(`查询支付宝订单: ${orderNo}`);
    return null;
  }

  /**
   * 申请退款
   */
  async refund(orderNo: string, amount: number, reason?: string): Promise<boolean> {
    logger.info(`申请支付宝退款: ${orderNo}, 金额: ${amount}分`);
    return true;
  }
}
