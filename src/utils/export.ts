import type { Transaction, Category, Account } from '@/types'

/**
 * 数据导出工具
 */

/**
 * 将交易记录导出为 CSV 格式
 */
export function transactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[]
): string {
  // CSV 头部（使用 BOM 确保 Excel 正确识别中文）
  const BOM = '\uFEFF'
  const headers = ['日期', '时间', '类型', '金额', '分类', '账户', '商户', '备注', '来源', '已确认']
  
  // 数据行
  const rows = transactions.map(t => {
    const category = categories.find(c => c.id === t.categoryId)
    const account = accounts.find(a => a.id === t.accountId)
    const date = new Date(t.createdAt)
    
    return [
      date.toLocaleDateString('zh-CN'),
      date.toLocaleTimeString('zh-CN'),
      t.type === 'income' ? '收入' : '支出',
      t.amount.toFixed(2),
      category?.name || '',
      account?.name || '',
      escapeCsvField(t.merchant),
      escapeCsvField(t.note),
      getSourceName(t.source),
      t.confirmed ? '是' : '否'
    ].join(',')
  })
  
  return BOM + [headers.join(','), ...rows].join('\n')
}

/**
 * 转义 CSV 字段（处理逗号和引号）
 */
function escapeCsvField(field: string): string {
  if (!field) return ''
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * 获取来源名称
 */
function getSourceName(source: string): string {
  const map: Record<string, string> = {
    manual: '手动',
    wechat: '微信',
    alipay: '支付宝',
    clipboard: '剪贴板'
  }
  return map[source] || source
}

/**
 * 导出为 JSON 备份格式
 */
export function exportToJSON(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[]
): string {
  return JSON.stringify({
    version: 1,
    appName: 'WhereIsMyMoney',
    exportTime: new Date().toISOString(),
    data: {
      transactions,
      categories,
      accounts
    }
  }, null, 2)
}

/**
 * 从 JSON 备份导入
 */
export function importFromJSON(jsonString: string): {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
} | null {
  try {
    const data = JSON.parse(jsonString)
    
    // 验证数据结构
    if (!data.data || !data.data.transactions || !data.data.categories || !data.data.accounts) {
      return null
    }
    
    return {
      transactions: data.data.transactions,
      categories: data.data.categories,
      accounts: data.data.accounts
    }
  } catch {
    return null
  }
}

/**
 * 保存文件到本地
 */
export async function saveFile(content: string, fileName: string): Promise<boolean> {
  // #ifdef APP-PLUS
  return new Promise((resolve) => {
    plus.io.resolveLocalFileSystemURL('_doc/', (entry: any) => {
      entry.getFile(fileName, { create: true }, (fileEntry: any) => {
        fileEntry.createWriter((writer: any) => {
          writer.onwrite = () => resolve(true)
          writer.onerror = () => resolve(false)
          writer.write(content)
        }, () => resolve(false))
      }, () => resolve(false))
    }, () => resolve(false))
  })
  // #endif
  
  // #ifdef H5
  try {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
  // #endif
}

/**
 * 读取本地文件
 */
export async function readFile(filePath: string): Promise<string | null> {
  // #ifdef APP-PLUS
  return new Promise((resolve) => {
    plus.io.resolveLocalFileSystemURL(filePath, (entry: any) => {
      entry.file((file: any) => {
        const reader = new plus.io.FileReader()
        reader.onloadend = (e: any) => {
          resolve(e.target.result)
        }
        reader.onerror = () => resolve(null)
        reader.readAsText(file, 'utf-8')
      }, () => resolve(null))
    }, () => resolve(null))
  })
  // #endif
  
  // #ifndef APP-PLUS
  return null
  // #endif
}

/**
 * 生成统计报告
 */
export function generateReport(
  transactions: Transaction[],
  categories: Category[],
  startDate: string,
  endDate: string
): string {
  const filtered = transactions.filter(t => {
    const date = t.createdAt.split('T')[0]
    return date >= startDate && date <= endDate && t.confirmed
  })
  
  const totalIncome = filtered
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = filtered
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  // 分类汇总
  const categoryStats: Record<number, { name: string; amount: number; count: number }> = {}
  filtered.filter(t => t.type === 'expense').forEach(t => {
    if (!categoryStats[t.categoryId]) {
      const category = categories.find(c => c.id === t.categoryId)
      categoryStats[t.categoryId] = {
        name: category?.name || '未知',
        amount: 0,
        count: 0
      }
    }
    categoryStats[t.categoryId].amount += t.amount
    categoryStats[t.categoryId].count++
  })
  
  // 生成报告文本
  let report = `# 账单报告\n\n`
  report += `**统计周期**: ${startDate} 至 ${endDate}\n\n`
  report += `## 概览\n\n`
  report += `- 总收入: ¥${totalIncome.toFixed(2)}\n`
  report += `- 总支出: ¥${totalExpense.toFixed(2)}\n`
  report += `- 结余: ¥${(totalIncome - totalExpense).toFixed(2)}\n`
  report += `- 记录数: ${filtered.length} 笔\n\n`
  
  report += `## 支出分类\n\n`
  const sortedCategories = Object.values(categoryStats).sort((a, b) => b.amount - a.amount)
  sortedCategories.forEach(stat => {
    const percentage = totalExpense > 0 ? (stat.amount / totalExpense * 100).toFixed(1) : '0'
    report += `- ${stat.name}: ¥${stat.amount.toFixed(2)} (${percentage}%, ${stat.count}笔)\n`
  })
  
  return report
}
