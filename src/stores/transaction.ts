import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Transaction, 
  Category, 
  Account, 
  TransactionType,
  StatisticsData,
  CategoryStat,
  DailyStat
} from '@/types'
import * as db from '@/utils/db'

export const useTransactionStore = defineStore('transaction', () => {
  // 状态
  const transactions = ref<Transaction[]>([])
  const categories = ref<Category[]>([])
  const accounts = ref<Account[]>([])
  const pendingTransactions = ref<Transaction[]>([])
  const loading = ref(false)
  
  // 计算属性
  const expenseCategories = computed(() => 
    categories.value.filter(c => c.type === 'expense')
  )
  
  const incomeCategories = computed(() => 
    categories.value.filter(c => c.type === 'income')
  )
  
  const confirmedTransactions = computed(() =>
    transactions.value.filter(t => t.confirmed)
  )
  
  const unconfirmedTransactions = computed(() =>
    transactions.value.filter(t => !t.confirmed)
  )
  
  // 获取本月统计
  const monthlyStats = computed((): StatisticsData => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const startOfMonth = new Date(year, month, 1).toISOString().split('T')[0]
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]
    
    const monthTransactions = confirmedTransactions.value.filter(t => {
      const date = t.createdAt.split('T')[0]
      return date >= startOfMonth && date <= endOfMonth
    })
    
    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    // 分类统计
    const categoryMap = new Map<number, { amount: number; count: number }>()
    monthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const existing = categoryMap.get(t.categoryId) || { amount: 0, count: 0 }
        categoryMap.set(t.categoryId, {
          amount: existing.amount + t.amount,
          count: existing.count + 1
        })
      })
    
    const categoryStats: CategoryStat[] = Array.from(categoryMap.entries())
      .map(([categoryId, data]) => {
        const category = categories.value.find(c => c.id === categoryId)
        return {
          categoryId,
          categoryName: category?.name || '未知',
          categoryIcon: category?.icon || '📦',
          amount: data.amount,
          percentage: totalExpense > 0 ? (data.amount / totalExpense) * 100 : 0,
          count: data.count
        }
      })
      .sort((a, b) => b.amount - a.amount)
    
    // 日统计
    const dailyMap = new Map<string, { income: number; expense: number }>()
    monthTransactions.forEach(t => {
      const date = t.createdAt.split('T')[0]
      const existing = dailyMap.get(date) || { income: 0, expense: 0 }
      if (t.type === 'income') {
        existing.income += t.amount
      } else {
        existing.expense += t.amount
      }
      dailyMap.set(date, existing)
    })
    
    const dailyStats: DailyStat[] = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      categoryStats,
      dailyStats
    }
  })
  
  // Actions
  async function loadTransactions() {
    loading.value = true
    try {
      transactions.value = await db.getAllTransactions()
      pendingTransactions.value = transactions.value.filter(t => !t.confirmed)
    } finally {
      loading.value = false
    }
  }
  
  async function loadCategories() {
    categories.value = await db.getAllCategories()
  }
  
  async function loadAccounts() {
    accounts.value = await db.getAllAccounts()
  }
  
  async function addTransaction(transaction: Omit<Transaction, 'id'>) {
    const id = await db.insertTransaction(transaction)
    const newTransaction = { ...transaction, id }
    transactions.value.unshift(newTransaction)
    
    if (!transaction.confirmed) {
      pendingTransactions.value.unshift(newTransaction)
    }
    
    // 更新账户余额
    const account = accounts.value.find(a => a.id === transaction.accountId)
    if (account) {
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount
      account.balance += amount
      await db.updateAccount(account)
    }
    
    return id
  }
  
  async function updateTransaction(transaction: Transaction) {
    await db.updateTransaction(transaction)
    const index = transactions.value.findIndex(t => t.id === transaction.id)
    if (index !== -1) {
      transactions.value[index] = transaction
    }
  }
  
  async function deleteTransaction(id: number) {
    const transaction = transactions.value.find(t => t.id === id)
    if (transaction) {
      // 恢复账户余额
      const account = accounts.value.find(a => a.id === transaction.accountId)
      if (account) {
        const amount = transaction.type === 'income' ? -transaction.amount : transaction.amount
        account.balance += amount
        await db.updateAccount(account)
      }
    }
    
    await db.deleteTransaction(id)
    transactions.value = transactions.value.filter(t => t.id !== id)
    pendingTransactions.value = pendingTransactions.value.filter(t => t.id !== id)
  }
  
  async function confirmTransaction(id: number) {
    const transaction = transactions.value.find(t => t.id === id)
    if (transaction) {
      transaction.confirmed = true
      await db.updateTransaction(transaction)
      pendingTransactions.value = pendingTransactions.value.filter(t => t.id !== id)
    }
  }
  
  async function addCategory(category: Omit<Category, 'id'>) {
    const id = await db.insertCategory(category)
    categories.value.push({ ...category, id })
    return id
  }
  
  async function updateCategory(category: Category) {
    await db.updateCategory(category)
    const index = categories.value.findIndex(c => c.id === category.id)
    if (index !== -1) {
      categories.value[index] = category
    }
  }
  
  async function deleteCategory(id: number) {
    await db.deleteCategory(id)
    categories.value = categories.value.filter(c => c.id !== id)
  }
  
  async function addAccount(account: Omit<Account, 'id'>) {
    const id = await db.insertAccount(account)
    accounts.value.push({ ...account, id })
    return id
  }
  
  async function updateAccount(account: Account) {
    await db.updateAccount(account)
    const index = accounts.value.findIndex(a => a.id === account.id)
    if (index !== -1) {
      accounts.value[index] = account
    }
  }
  
  async function deleteAccount(id: number) {
    await db.deleteAccount(id)
    accounts.value = accounts.value.filter(a => a.id !== id)
  }
  
  // 根据日期获取交易记录
  function getTransactionsByDate(date: string) {
    return confirmedTransactions.value.filter(t => 
      t.createdAt.split('T')[0] === date
    )
  }
  
  // 根据类型获取分类
  function getCategoriesByType(type: TransactionType) {
    return categories.value.filter(c => c.type === type)
  }
  
  // 根据ID获取分类
  function getCategoryById(id: number) {
    return categories.value.find(c => c.id === id)
  }
  
  // 根据ID获取账户
  function getAccountById(id: number) {
    return accounts.value.find(a => a.id === id)
  }
  
  return {
    // 状态
    transactions,
    categories,
    accounts,
    pendingTransactions,
    loading,
    // 计算属性
    expenseCategories,
    incomeCategories,
    confirmedTransactions,
    unconfirmedTransactions,
    monthlyStats,
    // Actions
    loadTransactions,
    loadCategories,
    loadAccounts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    confirmTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    addAccount,
    updateAccount,
    deleteAccount,
    getTransactionsByDate,
    getCategoriesByType,
    getCategoryById,
    getAccountById
  }
})
