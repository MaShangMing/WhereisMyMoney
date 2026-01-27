import type { Transaction, Category, Account } from '@/types'
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_ACCOUNTS
} from '@/types'
import * as localDb from '@/utils/db'
import * as cloud from '@/utils/cloud'
import { getStorageMode, setStorageMode, StorageMode } from '@/utils/storage-mode'

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES
]

const DEFAULT_ACCOUNTS_LIST: Omit<Account, 'id'>[] = [...DEFAULT_ACCOUNTS]

function isCloud(): boolean {
  return getStorageMode() === 'cloud'
}

export async function initData(): Promise<void> {
  if (isCloud()) {
    await cloud.bootstrapData({
      categories: DEFAULT_CATEGORIES,
      accounts: DEFAULT_ACCOUNTS_LIST
    })
    return
  }

  await localDb.initDatabase()
}

export async function switchStorageMode(
  target: StorageMode,
  options: { migrate?: boolean } = {}
): Promise<void> {
  const current = getStorageMode()
  if (target === current) return

  const shouldMigrate = options.migrate === true

  if (target === 'cloud') {
    await cloud.bootstrapData({
      categories: DEFAULT_CATEGORIES,
      accounts: DEFAULT_ACCOUNTS_LIST
    })

    if (shouldMigrate) {
      const backup = await localDb.backupData()
      const parsed = JSON.parse(backup)
      await cloud.replaceData({
        transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
        categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
        accounts: Array.isArray(parsed?.accounts) ? parsed.accounts : []
      })
      await localDb.clearLocalData()
    }

    setStorageMode('cloud')
    return
  }

  await localDb.initDatabase()
  if (shouldMigrate) {
    const cloudData = await cloud.getAllData()
    await localDb.restoreData(JSON.stringify({
      version: 1,
      exportDate: new Date().toISOString(),
      ...cloudData
    }))
  }

  setStorageMode('local')
}

export async function getAllTransactions(): Promise<Transaction[]> {
  if (isCloud()) {
    return cloud.getAllTransactions()
  }
  return localDb.getAllTransactions()
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  if (isCloud()) {
    return cloud.getTransactionById(id)
  }
  return localDb.getTransactionById(id)
}

export async function insertTransaction(
  transaction: Omit<Transaction, 'id'>
): Promise<number> {
  if (isCloud()) {
    return cloud.createTransaction(transaction)
  }
  return localDb.insertTransaction(transaction)
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  if (isCloud()) {
    return cloud.updateTransaction(transaction)
  }
  return localDb.updateTransaction(transaction)
}

export async function deleteTransaction(id: number): Promise<void> {
  if (isCloud()) {
    return cloud.deleteTransaction(id)
  }
  return localDb.deleteTransaction(id)
}

export async function getAllCategories(): Promise<Category[]> {
  if (isCloud()) {
    return cloud.getAllCategories()
  }
  return localDb.getAllCategories()
}

export async function insertCategory(category: Omit<Category, 'id'>): Promise<number> {
  if (isCloud()) {
    return cloud.createCategory(category)
  }
  return localDb.insertCategory(category)
}

export async function updateCategory(category: Category): Promise<void> {
  if (isCloud()) {
    return cloud.updateCategory(category)
  }
  return localDb.updateCategory(category)
}

export async function deleteCategory(id: number): Promise<void> {
  if (isCloud()) {
    return cloud.deleteCategory(id)
  }
  return localDb.deleteCategory(id)
}

export async function getAllAccounts(): Promise<Account[]> {
  if (isCloud()) {
    return cloud.getAllAccounts()
  }
  return localDb.getAllAccounts()
}

export async function insertAccount(account: Omit<Account, 'id'>): Promise<number> {
  if (isCloud()) {
    return cloud.createAccount(account)
  }
  return localDb.insertAccount(account)
}

export async function updateAccount(account: Account): Promise<void> {
  if (isCloud()) {
    return cloud.updateAccount(account)
  }
  return localDb.updateAccount(account)
}

export async function deleteAccount(id: number): Promise<void> {
  if (isCloud()) {
    return cloud.deleteAccount(id)
  }
  return localDb.deleteAccount(id)
}

async function getAllDataBundle(): Promise<{
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
}> {
  if (isCloud()) {
    return cloud.getAllDataCached()
  }
  const [transactions, categories, accounts] = await Promise.all([
    localDb.getAllTransactions(),
    localDb.getAllCategories(),
    localDb.getAllAccounts()
  ])
  return { transactions, categories, accounts }
}

export async function exportToCSV(): Promise<string> {
  const { transactions, categories, accounts } = await getAllDataBundle()
  const headers = ['日期', '类型', '金额', '分类', '账户', '商户', '备注', '来源']
  const rows = transactions.map(t => {
    const category = categories.find(c => c.id === t.categoryId)
    const account = accounts.find(a => a.id === t.accountId)
    return [
      t.createdAt.split('T')[0],
      t.type === 'income' ? '收入' : '支出',
      t.amount.toFixed(2),
      category?.name || '',
      account?.name || '',
      t.merchant,
      t.note,
      t.source
    ].join(',')
  })
  return [headers.join(','), ...rows].join('\n')
}

export async function backupData(): Promise<string> {
  const { transactions, categories, accounts } = await getAllDataBundle()
  return JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    transactions,
    categories,
    accounts
  }, null, 2)
}

export async function restoreData(jsonData: string): Promise<void> {
  if (isCloud()) {
    const parsed = JSON.parse(jsonData)
    await cloud.replaceData({
      transactions: Array.isArray(parsed?.transactions) ? parsed.transactions : [],
      categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
      accounts: Array.isArray(parsed?.accounts) ? parsed.accounts : []
    })
    return
  }

  await localDb.restoreData(jsonData)
}
