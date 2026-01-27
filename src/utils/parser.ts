import type { ParsedPaymentInfo, TransactionSource, TransactionType } from '@/types'

/**
 * 支付通知解析器
 * 用于解析微信、支付宝等支付通知文本，提取金额和商户信息
 */

// 金额匹配正则
const AMOUNT_PATTERNS = [
  /[￥¥]\s*(\d+\.?\d*)/,                    // ￥25.00 或 ¥25.00
  /(\d+\.?\d*)\s*元/,                        // 25.00元
  /支付\s*(\d+\.?\d*)/,                      // 支付25.00
  /付款\s*(\d+\.?\d*)/,                      // 付款25.00
  /收款\s*(\d+\.?\d*)/,                      // 收款25.00
  /金额[：:]\s*(\d+\.?\d*)/,                 // 金额：25.00
  /(\d+\.?\d*)\s*(?:已|成功)/               // 25.00已付款/成功
]

// 微信商户匹配
const WECHAT_MERCHANT_PATTERNS = [
  /商户[：:]\s*(.+?)(?:\n|$)/,              // 商户：瑞幸咖啡
  /向\s*(.+?)\s*付款/,                       // 向瑞幸咖啡付款
  /(?:在|于)\s*(.+?)\s*消费/,               // 在瑞幸咖啡消费
  /收款方[：:]\s*(.+?)(?:\n|$)/             // 收款方：瑞幸咖啡
]

// 支付宝商户匹配
const ALIPAY_MERCHANT_PATTERNS = [
  /收款方[：:]\s*(.+?)(?:\n|$)/,            // 收款方：美团外卖
  /付款给\s*(.+?)(?:\n|$)/,                 // 付款给美团外卖
  /向\s*(.+?)\s*付款/,                       // 向美团外卖付款
  /商户[：:]\s*(.+?)(?:\n|$)/,              // 商户：美团外卖
  /(?:在|于)\s*(.+?)\s*(?:消费|支付)/       // 在美团外卖消费
]

// 收入关键词
const INCOME_KEYWORDS = [
  '收款', '到账', '收到', '转入', '入账', 
  '红包', '退款', '返还', '奖励', '收益'
]

// 支出关键词
const EXPENSE_KEYWORDS = [
  '付款', '支付', '扣款', '消费', '转出',
  '转账', '购买', '充值', '缴费'
]

/**
 * 解析支付文本
 * @param text 支付通知文本
 * @returns 解析结果，如果无法解析则返回 null
 */
export function parsePaymentText(text: string): ParsedPaymentInfo | null {
  if (!text || text.trim().length === 0) {
    return null
  }
  
  // 识别来源
  const source = detectSource(text)
  
  // 提取金额
  const amount = extractAmount(text)
  if (amount === null || amount <= 0) {
    return null
  }
  
  // 提取商户
  const merchant = extractMerchant(text, source)
  
  // 判断收入/支出类型
  const type = detectTransactionType(text)
  
  return {
    source,
    amount,
    merchant,
    type,
    rawText: text
  }
}

/**
 * 检测支付来源
 */
function detectSource(text: string): TransactionSource {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('微信') || 
      lowerText.includes('wechat') || 
      lowerText.includes('微信支付')) {
    return 'wechat'
  }
  
  if (lowerText.includes('支付宝') || 
      lowerText.includes('alipay') ||
      lowerText.includes('花呗') ||
      lowerText.includes('余额宝')) {
    return 'alipay'
  }
  
  return 'clipboard'
}

/**
 * 提取金额
 */
function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const amount = parseFloat(match[1])
      if (!isNaN(amount) && amount > 0) {
        return amount
      }
    }
  }
  return null
}

/**
 * 提取商户名称
 */
function extractMerchant(text: string, source: TransactionSource): string {
  const patterns = source === 'wechat' 
    ? WECHAT_MERCHANT_PATTERNS 
    : ALIPAY_MERCHANT_PATTERNS
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const merchant = match[1].trim()
      // 过滤掉太长或包含特殊字符的结果
      if (merchant.length > 0 && merchant.length < 30 && !/[<>{}]/.test(merchant)) {
        return merchant
      }
    }
  }
  
  return ''
}

/**
 * 判断交易类型（收入/支出）
 */
function detectTransactionType(text: string): TransactionType {
  // 检查收入关键词
  for (const keyword of INCOME_KEYWORDS) {
    if (text.includes(keyword)) {
      return 'income'
    }
  }
  
  // 默认为支出
  return 'expense'
}

/**
 * 从 Android 通知数据解析支付信息
 */
export function parseNotificationData(
  packageName: string, 
  title: string, 
  content: string
): ParsedPaymentInfo | null {
  // 判断是否为支付相关应用
  const isWechat = packageName === 'com.tencent.mm'
  const isAlipay = packageName === 'com.eg.android.AlipayGphone'
  
  if (!isWechat && !isAlipay) {
    return null
  }
  
  // 过滤非支付通知
  const paymentKeywords = ['支付', '付款', '收款', '到账', '扣款', '转账']
  const fullText = `${title} ${content}`
  const hasPaymentKeyword = paymentKeywords.some(kw => fullText.includes(kw))
  
  if (!hasPaymentKeyword) {
    return null
  }
  
  // 解析文本
  return parsePaymentText(fullText)
}

/**
 * 智能分类推荐
 * 根据商户名称推荐分类
 */
export function recommendCategory(merchant: string): string | null {
  const merchantLower = merchant.toLowerCase()
  
  // 餐饮
  if (/瑞幸|星巴克|麦当劳|肯德基|美团|饿了么|外卖|餐厅|食堂|烧烤|火锅|咖啡|奶茶|蜜雪|喜茶|面|饭|菜/.test(merchantLower)) {
    return '餐饮'
  }
  
  // 交通
  if (/滴滴|出行|打车|地铁|公交|高铁|火车|机票|航空|加油|停车|uber/.test(merchantLower)) {
    return '交通'
  }
  
  // 购物
  if (/淘宝|天猫|京东|拼多多|苏宁|超市|便利店|商城|商场|百货/.test(merchantLower)) {
    return '购物'
  }
  
  // 娱乐
  if (/电影|游戏|网易|腾讯游戏|steam|视频|会员|爱奇艺|优酷|bilibili|网吧/.test(merchantLower)) {
    return '娱乐'
  }
  
  // 通讯
  if (/移动|联通|电信|话费|流量|中国移动|中国联通|中国电信/.test(merchantLower)) {
    return '通讯'
  }
  
  // 居住
  if (/物业|水费|电费|燃气|房租|租房|物管/.test(merchantLower)) {
    return '居住'
  }
  
  // 医疗
  if (/医院|药店|药房|诊所|挂号|医疗/.test(merchantLower)) {
    return '医疗'
  }
  
  // 教育
  if (/学校|培训|教育|课程|书店|学费/.test(merchantLower)) {
    return '教育'
  }
  
  return null
}

/**
 * 格式化金额显示
 */
export function formatAmount(amount: number, showSign: boolean = false): string {
  const formatted = amount.toFixed(2)
  if (showSign && amount > 0) {
    return `+${formatted}`
  }
  return formatted
}
