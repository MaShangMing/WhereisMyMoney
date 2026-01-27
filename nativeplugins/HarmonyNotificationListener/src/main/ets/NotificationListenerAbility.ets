/**
 * 鸿蒙通知监听能力
 * HarmonyOS NEXT 通知监听服务
 */
import notificationSubscribe from '@ohos.notificationSubscribe';
import type { NotificationSubscribeInfo, NotificationRequest } from '@ohos.notificationSubscribe';
import common from '@ohos.app.ability.common';

// 支付应用 Bundle 名称
const PAYMENT_BUNDLES = [
  'com.tencent.mm',           // 微信
  'com.eg.android.AlipayGphone', // 支付宝（鸿蒙版本可能不同）
  'com.alipay.mobile.client'  // 支付宝鸿蒙版
];

// 支付关键词
const PAYMENT_KEYWORDS = ['支付', '付款', '收款', '到账', '扣款', '转账', '￥', '¥'];

// 通知回调接口
export interface PaymentNotificationCallback {
  onPaymentDetected: (bundleName: string, title: string, content: string, timestamp: number) => void;
}

// 全局回调
let globalCallback: PaymentNotificationCallback | null = null;

/**
 * 通知订阅者
 */
class NotificationSubscriber implements notificationSubscribe.NotificationSubscriber {
  
  onConsume(data: notificationSubscribe.SubscribeCallbackData): void {
    const request = data.request;
    
    if (!request || !request.content) {
      return;
    }
    
    const bundleName = request.creatorBundleName || '';
    
    // 检查是否是支付应用
    if (!PAYMENT_BUNDLES.includes(bundleName)) {
      return;
    }
    
    // 获取通知内容
    const title = this.getNotificationTitle(request);
    const content = this.getNotificationContent(request);
    
    // 检查是否包含支付关键词
    if (!this.containsPaymentKeyword(title, content)) {
      return;
    }
    
    console.info(`[PaymentNotification] Detected: ${bundleName}`);
    console.info(`[PaymentNotification] Title: ${title}`);
    console.info(`[PaymentNotification] Content: ${content}`);
    
    // 调用回调
    if (globalCallback) {
      globalCallback.onPaymentDetected(
        bundleName,
        title,
        content,
        Date.now()
      );
    }
  }
  
  onCancel(data: notificationSubscribe.SubscribeCallbackData): void {
    // 通知被取消
  }
  
  onUpdate(data: notificationSubscribe.SubscribeCallbackData): void {
    // 通知更新，重新处理
    this.onConsume(data);
  }
  
  onConnect(): void {
    console.info('[PaymentNotification] Subscriber connected');
  }
  
  onDisconnect(): void {
    console.info('[PaymentNotification] Subscriber disconnected');
  }
  
  /**
   * 获取通知标题
   */
  private getNotificationTitle(request: NotificationRequest): string {
    const content = request.content;
    if (content?.normal?.title) {
      return content.normal.title;
    }
    if (content?.longText?.title) {
      return content.longText.title;
    }
    if (content?.multiLine?.title) {
      return content.multiLine.title;
    }
    return '';
  }
  
  /**
   * 获取通知内容
   */
  private getNotificationContent(request: NotificationRequest): string {
    const content = request.content;
    let text = '';
    
    if (content?.normal?.text) {
      text += content.normal.text;
    }
    if (content?.longText?.longText) {
      text += ' ' + content.longText.longText;
    }
    if (content?.multiLine?.lines) {
      text += ' ' + content.multiLine.lines.join(' ');
    }
    
    return text.trim();
  }
  
  /**
   * 检查是否包含支付关键词
   */
  private containsPaymentKeyword(title: string, content: string): boolean {
    const combined = (title + ' ' + content).toLowerCase();
    return PAYMENT_KEYWORDS.some(kw => combined.includes(kw.toLowerCase()));
  }
}

// 订阅者实例
let subscriber: NotificationSubscriber | null = null;

/**
 * 检查通知监听权限
 */
export async function isNotificationListenerEnabled(): Promise<boolean> {
  try {
    // 鸿蒙系统权限检查
    const hasPermission = await notificationSubscribe.isNotificationEnabled();
    return hasPermission;
  } catch (error) {
    console.error('[PaymentNotification] Check permission error:', error);
    return false;
  }
}

/**
 * 请求通知监听权限
 */
export async function requestNotificationPermission(context: common.UIAbilityContext): Promise<boolean> {
  try {
    await notificationSubscribe.requestEnableNotification(context);
    return true;
  } catch (error) {
    console.error('[PaymentNotification] Request permission error:', error);
    return false;
  }
}

/**
 * 开始监听通知
 */
export async function startListening(callback: PaymentNotificationCallback): Promise<boolean> {
  try {
    globalCallback = callback;
    
    if (!subscriber) {
      subscriber = new NotificationSubscriber();
    }
    
    const subscribeInfo: NotificationSubscribeInfo = {
      // 可以指定要监听的应用
      // bundleNames: PAYMENT_BUNDLES
    };
    
    await notificationSubscribe.subscribe(subscriber, subscribeInfo);
    console.info('[PaymentNotification] Started listening');
    return true;
  } catch (error) {
    console.error('[PaymentNotification] Start listening error:', error);
    return false;
  }
}

/**
 * 停止监听通知
 */
export async function stopListening(): Promise<boolean> {
  try {
    if (subscriber) {
      await notificationSubscribe.unsubscribe(subscriber);
      subscriber = null;
    }
    globalCallback = null;
    console.info('[PaymentNotification] Stopped listening');
    return true;
  } catch (error) {
    console.error('[PaymentNotification] Stop listening error:', error);
    return false;
  }
}
