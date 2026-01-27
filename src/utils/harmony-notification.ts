import type { ParsedPaymentInfo } from '@/types'
import { parseNotificationData } from './parser'

/**
 * 鸿蒙平台通知监听模块
 */

// 获取鸿蒙原生模块
function getHarmonyModule(): any {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync()
  if (systemInfo.osName?.toLowerCase().includes('harmony') || systemInfo.platform === 'harmony') {
    return uni.requireNativePlugin('HarmonyNotificationListener')
  }
  // #endif
  return null
}

// 支付通知回调类型
type PaymentCallback = (data: ParsedPaymentInfo) => void

// 存储回调
let paymentCallback: PaymentCallback | null = null

/**
 * 检查是否在鸿蒙平台
 */
export function isHarmonyOS(): boolean {
  const systemInfo = uni.getSystemInfoSync()
  return systemInfo.osName?.toLowerCase().includes('harmony') || 
         systemInfo.platform === 'harmony'
}

/**
 * 检查通知监听权限
 */
export async function isHarmonyNotificationEnabled(): Promise<boolean> {
  const module = getHarmonyModule()
  
  if (!module) {
    return false
  }
  
  return new Promise((resolve) => {
    module.isNotificationListenerEnabled((result: any) => {
      resolve(result?.enabled === true)
    })
  })
}

/**
 * 请求通知监听权限
 */
export async function requestHarmonyNotificationPermission(): Promise<boolean> {
  const module = getHarmonyModule()
  
  if (!module) {
    return false
  }
  
  return new Promise((resolve) => {
    module.requestNotificationPermission((result: any) => {
      resolve(result?.success === true)
    })
  })
}

/**
 * 开始监听通知
 */
export async function startHarmonyNotificationListener(
  callback: PaymentCallback
): Promise<boolean> {
  const module = getHarmonyModule()
  
  if (!module) {
    return false
  }
  
  paymentCallback = callback
  
  // 注册事件监听
  // #ifdef APP-PLUS
  uni.$on('onHarmonyPaymentNotification', handleHarmonyPaymentNotification)
  // #endif
  
  return new Promise((resolve) => {
    module.startListening((result: any) => {
      resolve(result?.success === true)
    })
  })
}

/**
 * 停止监听通知
 */
export async function stopHarmonyNotificationListener(): Promise<boolean> {
  const module = getHarmonyModule()
  
  if (!module) {
    return false
  }
  
  // #ifdef APP-PLUS
  uni.$off('onHarmonyPaymentNotification', handleHarmonyPaymentNotification)
  // #endif
  
  paymentCallback = null
  
  return new Promise((resolve) => {
    module.stopListening((result: any) => {
      resolve(result?.success === true)
    })
  })
}

/**
 * 处理鸿蒙支付通知
 */
function handleHarmonyPaymentNotification(data: {
  bundleName: string
  title: string
  content: string
  timestamp: number
}) {
  console.log('收到鸿蒙支付通知:', data)
  
  // 转换包名为标准格式
  const packageName = convertBundleName(data.bundleName)
  
  // 解析支付信息
  const paymentInfo = parseNotificationData(
    packageName,
    data.title,
    data.content
  )
  
  if (paymentInfo && paymentCallback) {
    paymentCallback(paymentInfo)
  }
}

/**
 * 转换鸿蒙 Bundle 名称为 Android 包名格式
 * 用于复用现有的解析逻辑
 */
function convertBundleName(bundleName: string): string {
  // 鸿蒙版本的应用包名映射
  const bundleMap: Record<string, string> = {
    'com.tencent.mm': 'com.tencent.mm',
    'com.alipay.mobile.client': 'com.eg.android.AlipayGphone'
  }
  
  return bundleMap[bundleName] || bundleName
}

/**
 * 获取鸿蒙系统版本信息
 */
export function getHarmonyVersion(): {
  apiVersion: number
  displayVersion: string
} | null {
  if (!isHarmonyOS()) {
    return null
  }
  
  const systemInfo = uni.getSystemInfoSync()
  
  return {
    apiVersion: parseInt(systemInfo.osVersion?.split('.')[0] || '0'),
    displayVersion: systemInfo.osVersion || 'Unknown'
  }
}
