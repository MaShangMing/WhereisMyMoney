import { parsePaymentText } from './parser'
import type { ParsedPaymentInfo } from '@/types'

/**
 * iOS Share Extension 数据处理模块
 * 用于读取从 Share Extension 传入的数据
 */

// App Group 标识符
const APP_GROUP_ID = 'group.com.whereismymoney.shared'

/**
 * 检查是否有待处理的分享数据
 */
export async function hasPendingShares(): Promise<boolean> {
  // #ifdef APP-PLUS
  if (uni.getSystemInfoSync().platform !== 'ios') {
    return false
  }
  
  try {
    const shares = await getPendingShares()
    return shares.length > 0
  } catch {
    return false
  }
  // #endif
  
  // #ifndef APP-PLUS
  return false
  // #endif
}

/**
 * 获取待处理的分享数据
 */
export async function getPendingShares(): Promise<ShareData[]> {
  // #ifdef APP-PLUS
  return new Promise((resolve) => {
    try {
      // 使用 plus.ios 访问 UserDefaults
      const UserDefaults = plus.ios.importClass('NSUserDefaults')
      const defaults = UserDefaults.alloc().initWithSuiteName(APP_GROUP_ID)
      
      if (!defaults) {
        resolve([])
        return
      }
      
      const pendingArray = defaults.arrayForKey('pendingShares')
      
      if (!pendingArray) {
        resolve([])
        return
      }
      
      const shares: ShareData[] = []
      const count = pendingArray.count()
      
      for (let i = 0; i < count; i++) {
        const item = pendingArray.objectAtIndex(i)
        shares.push({
          timestamp: item.objectForKey('timestamp') || 0,
          text: item.objectForKey('text') || '',
          imagePath: item.objectForKey('imagePath') || ''
        })
      }
      
      resolve(shares)
    } catch (e) {
      console.error('获取分享数据失败:', e)
      resolve([])
    }
  })
  // #endif
  
  // #ifndef APP-PLUS
  return []
  // #endif
}

/**
 * 清除已处理的分享数据
 */
export async function clearPendingShares(): Promise<void> {
  // #ifdef APP-PLUS
  try {
    const UserDefaults = plus.ios.importClass('NSUserDefaults')
    const defaults = UserDefaults.alloc().initWithSuiteName(APP_GROUP_ID)
    
    if (defaults) {
      defaults.removeObjectForKey('pendingShares')
      defaults.synchronize()
    }
  } catch (e) {
    console.error('清除分享数据失败:', e)
  }
  // #endif
}

/**
 * 处理分享数据并转换为支付信息
 */
export async function processShareData(shareData: ShareData): Promise<ParsedPaymentInfo | null> {
  // 优先处理文本
  if (shareData.text) {
    const paymentInfo = parsePaymentText(shareData.text)
    if (paymentInfo) {
      return paymentInfo
    }
  }
  
  // TODO: 如果有图片，可以使用 OCR 识别
  // 这需要集成 OCR 服务（如 Vision Framework 或第三方服务）
  if (shareData.imagePath) {
    console.log('图片 OCR 识别暂未实现:', shareData.imagePath)
  }
  
  return null
}

/**
 * 检查并处理所有待处理的分享
 */
export async function checkAndProcessShares(
  onPaymentFound: (info: ParsedPaymentInfo) => void
): Promise<number> {
  const shares = await getPendingShares()
  let processedCount = 0
  
  for (const share of shares) {
    const paymentInfo = await processShareData(share)
    if (paymentInfo) {
      onPaymentFound(paymentInfo)
      processedCount++
    }
  }
  
  // 清除已处理的数据
  if (shares.length > 0) {
    await clearPendingShares()
  }
  
  return processedCount
}

// 分享数据类型
interface ShareData {
  timestamp: number
  text: string
  imagePath: string
}

/**
 * iOS 快捷指令 URL Scheme 处理
 * 用于接收来自 Shortcuts 的数据
 */
export function parseShortcutURL(url: string): ParsedPaymentInfo | null {
  try {
    // URL 格式: whereismymoney://add?amount=25.00&merchant=瑞幸咖啡&type=expense&source=wechat
    const urlObj = new URL(url)
    
    if (urlObj.protocol !== 'whereismymoney:') {
      return null
    }
    
    if (urlObj.pathname !== '//add' && urlObj.host !== 'add') {
      return null
    }
    
    const params = urlObj.searchParams
    const amount = parseFloat(params.get('amount') || '0')
    
    if (amount <= 0) {
      return null
    }
    
    return {
      amount,
      merchant: params.get('merchant') || '',
      type: (params.get('type') as 'income' | 'expense') || 'expense',
      source: (params.get('source') as any) || 'clipboard',
      rawText: url
    }
  } catch {
    return null
  }
}
