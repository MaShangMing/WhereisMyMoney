import type { Transaction, Category, Account } from '@/types'
import { getCloudApiBase, getOrCreateCloudUserId } from '@/utils/storage-mode'

export interface CloudDataBundle {
  transactions: Transaction[]
  categories: Category[]
  accounts: Account[]
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const CACHE_TTL_MS = 800
let cachedData: CloudDataBundle | null = null
let cachedAt = 0

function normalizeBundle(data: any): CloudDataBundle {
  return {
    transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    accounts: Array.isArray(data?.accounts) ? data.accounts : []
  }
}

function parsePayload(payload: any): any {
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload)
    } catch (e) {
      return payload
    }
  }
  return payload
}

async function request<T>(
  path: string,
  method: HttpMethod,
  data?: Record<string, any>
): Promise<T> {
  const base = getCloudApiBase()
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${base}${path}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'X-Client-Id': getOrCreateCloudUserId()
      },
      success: (res) => {
        const payload = parsePayload(res.data)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(payload as T)
          return
        }
        const message = payload?.message || `请求失败(${res.statusCode})`
        reject(new Error(message))
      },
      fail: (err) => reject(err)
    })
  })
}

export function invalidateCloudCache(): void {
  cachedData = null
}

export async function getAllData(): Promise<CloudDataBundle> {
  const data = await request<CloudDataBundle>('/api/v1/data', 'GET')
  return normalizeBundle(data)
}

export async function getAllDataCached(): Promise<CloudDataBundle> {
  const now = Date.now()
  if (cachedData && now - cachedAt < CACHE_TTL_MS) {
    return cachedData
  }
  const data = await getAllData()
  cachedData = data
  cachedAt = now
  return data
}

export async function bootstrapData(payload: {
  categories: Omit<Category, 'id'>[]
  accounts: Omit<Account, 'id'>[]
}): Promise<{ initialized: boolean }> {
  const result = await request<{ initialized: boolean }>(
    '/api/v1/bootstrap',
    'POST',
    payload
  )
  invalidateCloudCache()
  return result
}

export async function replaceData(data: CloudDataBundle): Promise<void> {
  await request('/api/v1/data', 'PUT', data)
  invalidateCloudCache()
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const data = await getAllDataCached()
  return [...data.transactions].sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  )
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const transactions = await getAllTransactions()
  return transactions.find(t => t.id === id) || null
}

export async function createTransaction(
  transaction: Omit<Transaction, 'id'>
): Promise<number> {
  const result = await request<{ id: number }>(
    '/api/v1/transactions',
    'POST',
    transaction
  )
  invalidateCloudCache()
  return result?.id || 0
}

export async function updateTransaction(transaction: Transaction): Promise<void> {
  if (!transaction.id) return
  await request(`/api/v1/transactions/${transaction.id}`, 'PUT', transaction)
  invalidateCloudCache()
}

export async function deleteTransaction(id: number): Promise<void> {
  await request(`/api/v1/transactions/${id}`, 'DELETE')
  invalidateCloudCache()
}

export async function getAllCategories(): Promise<Category[]> {
  const data = await getAllDataCached()
  return [...data.categories].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type)
    }
    return (a.sortOrder || 0) - (b.sortOrder || 0)
  })
}

export async function createCategory(category: Omit<Category, 'id'>): Promise<number> {
  const result = await request<{ id: number }>(
    '/api/v1/categories',
    'POST',
    category
  )
  invalidateCloudCache()
  return result?.id || 0
}

export async function updateCategory(category: Category): Promise<void> {
  if (!category.id) return
  await request(`/api/v1/categories/${category.id}`, 'PUT', category)
  invalidateCloudCache()
}

export async function deleteCategory(id: number): Promise<void> {
  await request(`/api/v1/categories/${id}`, 'DELETE')
  invalidateCloudCache()
}

export async function getAllAccounts(): Promise<Account[]> {
  const data = await getAllDataCached()
  return [...data.accounts].sort((a, b) => (a.id || 0) - (b.id || 0))
}

export async function createAccount(account: Omit<Account, 'id'>): Promise<number> {
  const result = await request<{ id: number }>(
    '/api/v1/accounts',
    'POST',
    account
  )
  invalidateCloudCache()
  return result?.id || 0
}

export async function updateAccount(account: Account): Promise<void> {
  if (!account.id) return
  await request(`/api/v1/accounts/${account.id}`, 'PUT', account)
  invalidateCloudCache()
}

export async function deleteAccount(id: number): Promise<void> {
  await request(`/api/v1/accounts/${id}`, 'DELETE')
  invalidateCloudCache()
}
