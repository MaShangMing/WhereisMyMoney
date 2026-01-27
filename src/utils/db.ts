import type { Transaction, Category, Account } from '@/types'
import { 
  DEFAULT_EXPENSE_CATEGORIES, 
  DEFAULT_INCOME_CATEGORIES, 
  DEFAULT_ACCOUNTS 
} from '@/types'

const DB_NAME = 'whereismymoney.db'
const DB_PATH = '_doc'

let database: any = null

// 打开数据库
function openDatabase(): Promise<any> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    database = plus.sqlite.openDatabase({
      name: DB_NAME,
      path: DB_PATH,
      success: () => {
        console.log('数据库打开成功')
        resolve(database)
      },
      fail: (e: any) => {
        console.error('数据库打开失败', e)
        reject(e)
      }
    })
    // #endif
    
    // #ifdef H5
    // H5 使用 localStorage 模拟
    resolve(null)
    // #endif
  })
}

// 执行SQL
function executeSql(sql: string, values: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.sqlite.executeSql({
      name: DB_NAME,
      sql,
      success: () => {
        resolve(true)
      },
      fail: (e: any) => {
        console.error('SQL执行失败', sql, e)
        reject(e)
      }
    })
    // #endif
    
    // #ifdef H5
    resolve(true)
    // #endif
  })
}

// 查询SQL
function selectSql(sql: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.sqlite.selectSql({
      name: DB_NAME,
      sql,
      success: (data: any[]) => {
        resolve(data)
      },
      fail: (e: any) => {
        console.error('查询失败', sql, e)
        reject(e)
      }
    })
    // #endif
    
    // #ifdef H5
    // H5 使用 localStorage 模拟
    const key = sql.includes('transactions') ? 'transactions' : 
                sql.includes('categories') ? 'categories' : 'accounts'
    const data = localStorage.getItem(key)
    resolve(data ? JSON.parse(data) : [])
    // #endif
  })
}

// 初始化数据库
export async function initDatabase(): Promise<void> {
  try {
    await openDatabase()
    
    // 创建交易表
    await executeSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        merchant TEXT DEFAULT '',
        note TEXT DEFAULT '',
        source TEXT DEFAULT 'manual',
        created_at TEXT NOT NULL,
        confirmed INTEGER DEFAULT 1
      )
    `)
    
    // 创建分类表
    await executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        type TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      )
    `)
    
    // 创建账户表
    await executeSql(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        balance REAL DEFAULT 0
      )
    `)
    
    // 检查是否需要初始化默认数据
    const categories = await selectSql('SELECT * FROM categories')
    if (categories.length === 0) {
      await initDefaultCategories()
    }
    
    const accounts = await selectSql('SELECT * FROM accounts')
    if (accounts.length === 0) {
      await initDefaultAccounts()
    }
    
    console.log('数据库初始化完成')
  } catch (e) {
    console.error('数据库初始化失败', e)
    // H5 环境下使用 localStorage
    initH5Storage()
  }
}

// H5 环境初始化
function initH5Storage() {
  if (!localStorage.getItem('categories')) {
    const allCategories = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({ ...c, id: i + 1 })),
      ...DEFAULT_INCOME_CATEGORIES.map((c, i) => ({ ...c, id: i + 100 }))
    ]
    localStorage.setItem('categories', JSON.stringify(allCategories))
  }
  
  if (!localStorage.getItem('accounts')) {
    const allAccounts = DEFAULT_ACCOUNTS.map((a, i) => ({ ...a, id: i + 1 }))
    localStorage.setItem('accounts', JSON.stringify(allAccounts))
  }
  
  if (!localStorage.getItem('transactions')) {
    localStorage.setItem('transactions', JSON.stringify([]))
  }
}

// 初始化默认分类
async function initDefaultCategories(): Promise<void> {
  for (const category of DEFAULT_EXPENSE_CATEGORIES) {
    await executeSql(
      `INSERT INTO categories (name, icon, type, sort_order) VALUES ('${category.name}', '${category.icon}', '${category.type}', ${category.sortOrder})`
    )
  }
  
  for (const category of DEFAULT_INCOME_CATEGORIES) {
    await executeSql(
      `INSERT INTO categories (name, icon, type, sort_order) VALUES ('${category.name}', '${category.icon}', '${category.type}', ${category.sortOrder})`
    )
  }
}

// 初始化默认账户
async function initDefaultAccounts(): Promise<void> {
  for (const account of DEFAULT_ACCOUNTS) {
    await executeSql(
      `INSERT INTO accounts (name, icon, balance) VALUES ('${account.name}', '${account.icon}', ${account.balance})`
    )
  }
}

// ==================== 交易操作 ====================

export async function getAllTransactions(): Promise<Transaction[]> {
  // #ifdef APP-PLUS
  const rows = await selectSql('SELECT * FROM transactions ORDER BY created_at DESC')
  return rows.map(mapRowToTransaction)
  // #endif
  
  // #ifdef H5
  const data = localStorage.getItem('transactions')
  return data ? JSON.parse(data) : []
  // #endif
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  // #ifdef APP-PLUS
  const rows = await selectSql(`SELECT * FROM transactions WHERE id = ${id}`)
  return rows.length > 0 ? mapRowToTransaction(rows[0]) : null
  // #endif
  
  // #ifdef H5
  const transactions = await getAllTransactions()
  return transactions.find(t => t.id === id) || null
  // #endif
}

export async function insertTransaction(transaction: Omit<Transaction, 'id'>): Promise<number> {
  // #ifdef APP-PLUS
  await executeSql(`
    INSERT INTO transactions (type, amount, category_id, account_id, merchant, note, source, created_at, confirmed)
    VALUES ('${transaction.type}', ${transaction.amount}, ${transaction.categoryId}, ${transaction.accountId}, 
            '${transaction.merchant}', '${transaction.note}', '${transaction.source}', 
            '${transaction.createdAt}', ${transaction.confirmed ? 1 : 0})
  `)
  
  const result = await selectSql('SELECT last_insert_rowid() as id')
  return result[0]?.id || 0
  // #endif
  
  // #ifdef H5
  const transactions = await getAllTransactions()
  const id = Math.max(0, ...transactions.map(t => t.id || 0)) + 1
  transactions.unshift({ ...transaction, id })
  localStorage.setItem('transactions', JSON.stringify(transactions))
  return id
  // #endif
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  // #ifdef APP-PLUS
  await executeSql(`
    UPDATE transactions SET 
      type = '${transaction.type}',
      amount = ${transaction.amount},
      category_id = ${transaction.categoryId},
      account_id = ${transaction.accountId},
      merchant = '${transaction.merchant}',
      note = '${transaction.note}',
      source = '${transaction.source}',
      created_at = '${transaction.createdAt}',
      confirmed = ${transaction.confirmed ? 1 : 0}
    WHERE id = ${transaction.id}
  `)
  // #endif
  
  // #ifdef H5
  const transactions = await getAllTransactions()
  const index = transactions.findIndex(t => t.id === transaction.id)
  if (index !== -1) {
    transactions[index] = transaction
    localStorage.setItem('transactions', JSON.stringify(transactions))
  }
  // #endif
}

export async function deleteTransaction(id: number): Promise<void> {
  // #ifdef APP-PLUS
  await executeSql(`DELETE FROM transactions WHERE id = ${id}`)
  // #endif
  
  // #ifdef H5
  const transactions = await getAllTransactions()
  const filtered = transactions.filter(t => t.id !== id)
  localStorage.setItem('transactions', JSON.stringify(filtered))
  // #endif
}

// ==================== 分类操作 ====================

export async function getAllCategories(): Promise<Category[]> {
  // #ifdef APP-PLUS
  const rows = await selectSql('SELECT * FROM categories ORDER BY type, sort_order')
  return rows.map(mapRowToCategory)
  // #endif
  
  // #ifdef H5
  const data = localStorage.getItem('categories')
  return data ? JSON.parse(data) : []
  // #endif
}

export async function insertCategory(category: Omit<Category, 'id'>): Promise<number> {
  // #ifdef APP-PLUS
  await executeSql(`
    INSERT INTO categories (name, icon, type, sort_order)
    VALUES ('${category.name}', '${category.icon}', '${category.type}', ${category.sortOrder})
  `)
  
  const result = await selectSql('SELECT last_insert_rowid() as id')
  return result[0]?.id || 0
  // #endif
  
  // #ifdef H5
  const categories = await getAllCategories()
  const id = Math.max(0, ...categories.map(c => c.id || 0)) + 1
  categories.push({ ...category, id })
  localStorage.setItem('categories', JSON.stringify(categories))
  return id
  // #endif
}

export async function updateCategory(category: Category): Promise<void> {
  // #ifdef APP-PLUS
  await executeSql(`
    UPDATE categories SET 
      name = '${category.name}',
      icon = '${category.icon}',
      type = '${category.type}',
      sort_order = ${category.sortOrder}
    WHERE id = ${category.id}
  `)
  // #endif
  
  // #ifdef H5
  const categories = await getAllCategories()
  const index = categories.findIndex(c => c.id === category.id)
  if (index !== -1) {
    categories[index] = category
    localStorage.setItem('categories', JSON.stringify(categories))
  }
  // #endif
}

export async function deleteCategory(id: number): Promise<void> {
  // #ifdef APP-PLUS
  await executeSql(`DELETE FROM categories WHERE id = ${id}`)
  // #endif
  
  // #ifdef H5
  const categories = await getAllCategories()
  const filtered = categories.filter(c => c.id !== id)
  localStorage.setItem('categories', JSON.stringify(filtered))
  // #endif
}

// ==================== 账户操作 ====================

export async function getAllAccounts(): Promise<Account[]> {
  // #ifdef APP-PLUS
  const rows = await selectSql('SELECT * FROM accounts')
  return rows.map(mapRowToAccount)
  // #endif
  
  // #ifdef H5
  const data = localStorage.getItem('accounts')
  return data ? JSON.parse(data) : []
  // #endif
}

export async function insertAccount(account: Omit<Account, 'id'>): Promise<number> {
  // #ifdef APP-PLUS
  await executeSql(`
    INSERT INTO accounts (name, icon, balance)
    VALUES ('${account.name}', '${account.icon}', ${account.balance})
  `)
  
  const result = await selectSql('SELECT last_insert_rowid() as id')
  return result[0]?.id || 0
  // #endif
  
  // #ifdef H5
  const accounts = await getAllAccounts()
  const id = Math.max(0, ...accounts.map(a => a.id || 0)) + 1
  accounts.push({ ...account, id })
  localStorage.setItem('accounts', JSON.stringify(accounts))
  return id
  // #endif
}

export async function updateAccount(account: Account): Promise<void> {
  // #ifdef APP-PLUS
  await executeSql(`
    UPDATE accounts SET 
      name = '${account.name}',
      icon = '${account.icon}',
      balance = ${account.balance}
    WHERE id = ${account.id}
  `)
  // #endif
  
  // #ifdef H5
  const accounts = await getAllAccounts()
  const index = accounts.findIndex(a => a.id === account.id)
  if (index !== -1) {
    accounts[index] = account
    localStorage.setItem('accounts', JSON.stringify(accounts))
  }
  // #endif
}

export async function deleteAccount(id: number): Promise<void> {
  // #ifdef APP-PLUS
  await executeSql(`DELETE FROM accounts WHERE id = ${id}`)
  // #endif
  
  // #ifdef H5
  const accounts = await getAllAccounts()
  const filtered = accounts.filter(a => a.id !== id)
  localStorage.setItem('accounts', JSON.stringify(filtered))
  // #endif
}

// ==================== 数据映射 ====================

function mapRowToTransaction(row: any): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    categoryId: row.category_id,
    accountId: row.account_id,
    merchant: row.merchant || '',
    note: row.note || '',
    source: row.source || 'manual',
    createdAt: row.created_at,
    confirmed: row.confirmed === 1
  }
}

function mapRowToCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type,
    sortOrder: row.sort_order
  }
}

function mapRowToAccount(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    balance: row.balance
  }
}

// ==================== 数据导出 ====================

export async function exportToCSV(): Promise<string> {
  const transactions = await getAllTransactions()
  const categories = await getAllCategories()
  const accounts = await getAllAccounts()
  
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

// 数据备份
export async function backupData(): Promise<string> {
  const transactions = await getAllTransactions()
  const categories = await getAllCategories()
  const accounts = await getAllAccounts()
  
  return JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    transactions,
    categories,
    accounts
  }, null, 2)
}

// 数据恢复
export async function restoreData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData)
  
  // 清空现有数据
  // #ifdef APP-PLUS
  await executeSql('DELETE FROM transactions')
  await executeSql('DELETE FROM categories')
  await executeSql('DELETE FROM accounts')
  // #endif
  
  // 恢复分类
  for (const category of data.categories) {
    await insertCategory(category)
  }
  
  // 恢复账户
  for (const account of data.accounts) {
    await insertAccount(account)
  }
  
  // 恢复交易记录
  for (const transaction of data.transactions) {
    await insertTransaction(transaction)
  }
}
