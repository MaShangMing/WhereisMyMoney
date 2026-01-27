// 交易类型
export type TransactionType = 'income' | 'expense'

// 交易来源
export type TransactionSource = 'manual' | 'wechat' | 'alipay' | 'clipboard'

// 交易记录
export interface Transaction {
  id?: number
  type: TransactionType
  amount: number
  categoryId: number
  accountId: number
  merchant: string
  note: string
  source: TransactionSource
  createdAt: string
  confirmed: boolean
}

// 分类
export interface Category {
  id?: number
  name: string
  icon: string
  type: TransactionType
  sortOrder: number
}

// 账户
export interface Account {
  id?: number
  name: string
  icon: string
  balance: number
}

// 统计数据
export interface StatisticsData {
  totalIncome: number
  totalExpense: number
  balance: number
  categoryStats: CategoryStat[]
  dailyStats: DailyStat[]
}

export interface CategoryStat {
  categoryId: number
  categoryName: string
  categoryIcon: string
  amount: number
  percentage: number
  count: number
}

export interface DailyStat {
  date: string
  income: number
  expense: number
}

// 通知数据（从原生插件传入）
export interface NotificationData {
  packageName: string
  title: string
  text: string
  timestamp: number
}

// 解析后的支付信息
export interface ParsedPaymentInfo {
  source: TransactionSource
  amount: number
  merchant: string
  type: TransactionType
  rawText: string
}

// 默认分类数据
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '餐饮', icon: '🍜', type: 'expense', sortOrder: 1 },
  { name: '交通', icon: '🚗', type: 'expense', sortOrder: 2 },
  { name: '购物', icon: '🛒', type: 'expense', sortOrder: 3 },
  { name: '娱乐', icon: '🎮', type: 'expense', sortOrder: 4 },
  { name: '居住', icon: '🏠', type: 'expense', sortOrder: 5 },
  { name: '通讯', icon: '📱', type: 'expense', sortOrder: 6 },
  { name: '医疗', icon: '💊', type: 'expense', sortOrder: 7 },
  { name: '教育', icon: '📚', type: 'expense', sortOrder: 8 },
  { name: '人情', icon: '🎁', type: 'expense', sortOrder: 9 },
  { name: '其他', icon: '📦', type: 'expense', sortOrder: 10 }
]

export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '工资', icon: '💰', type: 'income', sortOrder: 1 },
  { name: '奖金', icon: '🏆', type: 'income', sortOrder: 2 },
  { name: '投资', icon: '📈', type: 'income', sortOrder: 3 },
  { name: '兼职', icon: '💼', type: 'income', sortOrder: 4 },
  { name: '红包', icon: '🧧', type: 'income', sortOrder: 5 },
  { name: '其他', icon: '💵', type: 'income', sortOrder: 6 }
]

export const DEFAULT_ACCOUNTS: Omit<Account, 'id'>[] = [
  { name: '现金', icon: '💵', balance: 0 },
  { name: '微信', icon: '💚', balance: 0 },
  { name: '支付宝', icon: '💙', balance: 0 },
  { name: '银行卡', icon: '💳', balance: 0 }
]
