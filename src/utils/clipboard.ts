import { parsePaymentText, recommendCategory } from './parser'
import type { ParsedPaymentInfo, Transaction } from '@/types'

/**
 * 剪贴板监控模块
 * 用于 iOS 等无法直接监听通知的平台
 */

// 上次检查的剪贴板内容
let lastClipboardContent = ''

// 剪贴板检查间隔（毫秒）
const CHECK_INTERVAL = 2000

// 定时器 ID
let checkTimer: number | null = null

// 支付通知回调
type ClipboardPaymentCallback = (data: ParsedPaymentInfo) => void
let paymentCallback: ClipboardPaymentCallback | null = null

/**
 * 读取剪贴板内容
 */
export function readClipboard(): Promise<string> {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    uni.getClipboardData({
      success: (res) => resolve(res.data || ''),
      fail: () => resolve('')
    })
    // #endif
    
    // #ifdef H5
    if (navigator.clipboard) {
      navigator.clipboard.readText()
        .then(text => resolve(text))
        .catch(() => resolve(''))
    } else {
      resolve('')
    }
    // #endif
  })
}

/**
 * 写入剪贴板
 */
export function writeClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    uni.setClipboardData({
      data: text,
      success: () => resolve(true),
      fail: () => resolve(false)
    })
    // #endif
    
    // #ifdef H5
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(() => resolve(false))
    } else {
      resolve(false)
    }
    // #endif
  })
}

/**
 * 检查剪贴板并解析支付信息
 */
export async function checkClipboardForPayment(): Promise<ParsedPaymentInfo | null> {
  const content = await readClipboard()
  
  if (!content || content === lastClipboardContent) {
    return null
  }
  
  lastClipboardContent = content
  
  return parsePaymentText(content)
}

/**
 * 启动剪贴板监控
 * @param callback 发现支付信息时的回调
 * @param interval 检查间隔（毫秒），默认2000ms
 */
export function startClipboardMonitor(
  callback: ClipboardPaymentCallback,
  interval: number = CHECK_INTERVAL
): void {
  // 先停止已有的监控
  stopClipboardMonitor()
  
  paymentCallback = callback
  
  // 立即检查一次
  checkAndNotify()
  
  // 启动定时检查
  checkTimer = setInterval(checkAndNotify, interval) as unknown as number
  
  console.log('剪贴板监控已启动')
}

/**
 * 停止剪贴板监控
 */
export function stopClipboardMonitor(): void {
  if (checkTimer !== null) {
    clearInterval(checkTimer)
    checkTimer = null
  }
  paymentCallback = null
  console.log('剪贴板监控已停止')
}

/**
 * 检查剪贴板并通知
 */
async function checkAndNotify(): Promise<void> {
  const paymentInfo = await checkClipboardForPayment()
  
  if (paymentInfo && paymentCallback) {
    paymentCallback(paymentInfo)
  }
}

/**
 * 手动解析剪贴板内容
 * 用于用户主动触发的场景
 */
export async function parseClipboardPayment(): Promise<{
  success: boolean
  data?: ParsedPaymentInfo
  error?: string
}> {
  try {
    const content = await readClipboard()
    
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: '剪贴板为空'
      }
    }
    
    const paymentInfo = parsePaymentText(content)
    
    if (!paymentInfo) {
      return {
        success: false,
        error: '未识别到支付信息'
      }
    }
    
    return {
      success: true,
      data: paymentInfo
    }
  } catch (e) {
    return {
      success: false,
      error: '读取剪贴板失败'
    }
  }
}

/**
 * 从剪贴板创建待确认交易
 */
export async function createTransactionFromClipboard(
  store: any
): Promise<Transaction | null> {
  const result = await parseClipboardPayment()
  
  if (!result.success || !result.data) {
    uni.showToast({ title: result.error || '解析失败', icon: 'none' })
    return null
  }
  
  const paymentInfo = result.data
  
  // 获取默认分类
  let categoryId: number
  const recommendedCategoryName = recommendCategory(paymentInfo.merchant)
  
  if (recommendedCategoryName) {
    const category = store.categories.find(
      (c: any) => c.name === recommendedCategoryName && c.type === paymentInfo.type
    )
    categoryId = category?.id || store.expenseCategories[0]?.id || 1
  } else {
    categoryId = paymentInfo.type === 'expense' 
      ? store.expenseCategories[0]?.id || 1
      : store.incomeCategories[0]?.id || 1
  }
  
  // 获取对应账户
  const accountName = paymentInfo.source === 'wechat' ? '微信' : 
                      paymentInfo.source === 'alipay' ? '支付宝' : '现金'
  const account = store.accounts.find((a: any) => a.name === accountName) || store.accounts[0]
  
  // 创建交易记录
  const transaction: Omit<Transaction, 'id'> = {
    type: paymentInfo.type,
    amount: paymentInfo.amount,
    categoryId,
    accountId: account?.id || 1,
    merchant: paymentInfo.merchant,
    note: '',
    source: paymentInfo.source,
    createdAt: new Date().toISOString(),
    confirmed: false
  }
  
  await store.addTransaction(transaction)
  
  return transaction as Transaction
}

/**
 * 生成支付信息分享文本
 * 用于从其他App分享到本App
 */
export function generateShareText(transaction: Transaction): string {
  const typeText = transaction.type === 'income' ? '收入' : '支出'
  return `${typeText} ¥${transaction.amount.toFixed(2)} ${transaction.merchant || ''}`
}
