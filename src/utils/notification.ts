import type { NotificationData, ParsedPaymentInfo } from '@/types'
import { parseNotificationData } from './parser'

/**
 * Android 通知监听模块封装
 */

// 获取原生模块
function getNotificationModule(): any {
  // #ifdef APP-PLUS
  return uni.requireNativePlugin('NotificationListener')
  // #endif
  
  // #ifndef APP-PLUS
  return null
  // #endif
}

/**
 * 检查通知监听权限是否已开启
 */
export function isNotificationListenerEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    const module = getNotificationModule()
    
    if (!module) {
      resolve(false)
      return
    }
    
    module.isNotificationListenerEnabled((result: any) => {
      resolve(result?.enabled === true)
    })
  })
}

/**
 * 打开通知监听设置页面
 */
export function openNotificationListenerSettings(): Promise<boolean> {
  return new Promise((resolve) => {
    const module = getNotificationModule()
    
    if (!module) {
      uni.showToast({ title: '此功能仅支持 Android', icon: 'none' })
      resolve(false)
      return
    }
    
    module.openNotificationListenerSettings((result: any) => {
      resolve(result?.success === true)
    })
  })
}

// 支付通知回调类型
type PaymentNotificationCallback = (data: ParsedPaymentInfo) => void

// 存储回调
let paymentCallback: PaymentNotificationCallback | null = null

/**
 * 启动通知监听
 * @param callback 支付通知回调函数
 */
export function startNotificationListener(callback: PaymentNotificationCallback): Promise<boolean> {
  return new Promise((resolve) => {
    const module = getNotificationModule()
    
    if (!module) {
      resolve(false)
      return
    }
    
    // 保存回调
    paymentCallback = callback
    
    // 注册全局事件监听
    // #ifdef APP-PLUS
    uni.$on('onPaymentNotification', handlePaymentNotification)
    // #endif
    
    module.startListening((result: any) => {
      if (result?.success) {
        console.log('通知监听已启动')
        resolve(true)
      } else {
        console.error('启动通知监听失败:', result?.message)
        resolve(false)
      }
    })
  })
}

/**
 * 停止通知监听
 */
export function stopNotificationListener(): Promise<boolean> {
  return new Promise((resolve) => {
    const module = getNotificationModule()
    
    if (!module) {
      resolve(false)
      return
    }
    
    // 移除事件监听
    // #ifdef APP-PLUS
    uni.$off('onPaymentNotification', handlePaymentNotification)
    // #endif
    
    paymentCallback = null
    
    module.stopListening((result: any) => {
      resolve(result?.success === true)
    })
  })
}

/**
 * 处理支付通知
 */
function handlePaymentNotification(data: NotificationData) {
  console.log('收到支付通知:', data)
  
  // 解析支付信息
  const paymentInfo = parseNotificationData(
    data.packageName,
    data.title,
    data.text
  )
  
  if (paymentInfo && paymentCallback) {
    paymentCallback(paymentInfo)
  }
}

/**
 * 请求通知监听权限（引导用户开启）
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const enabled = await isNotificationListenerEnabled()
  
  if (enabled) {
    return true
  }
  
  return new Promise((resolve) => {
    uni.showModal({
      title: '开启通知监听',
      content: '需要授予通知访问权限才能自动识别支付通知。\n\n请在设置中找到本应用并开启通知访问权限。',
      confirmText: '去设置',
      cancelText: '暂不开启',
      success: async (res) => {
        if (res.confirm) {
          await openNotificationListenerSettings()
          // 设置页面返回后重新检查
          setTimeout(async () => {
            const newEnabled = await isNotificationListenerEnabled()
            resolve(newEnabled)
          }, 1000)
        } else {
          resolve(false)
        }
      }
    })
  })
}

/**
 * 获取平台信息
 */
export function getPlatformInfo(): { isAndroid: boolean; isIOS: boolean; isHarmony: boolean } {
  const systemInfo = uni.getSystemInfoSync()
  
  return {
    isAndroid: systemInfo.platform === 'android',
    isIOS: systemInfo.platform === 'ios',
    isHarmony: systemInfo.platform === 'harmony' || 
               (systemInfo.osName?.toLowerCase().includes('harmony') ?? false)
  }
}

/**
 * 检查是否支持通知监听功能
 */
export function isNotificationListenerSupported(): boolean {
  const { isAndroid, isHarmony } = getPlatformInfo()
  return isAndroid || isHarmony
}
