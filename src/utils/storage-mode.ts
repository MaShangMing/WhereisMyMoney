export type StorageMode = 'local' | 'cloud'

const STORAGE_MODE_KEY = 'storageMode'
const CLOUD_API_BASE_KEY = 'cloudApiBase'
const CLOUD_USER_ID_KEY = 'cloudUserId'
const DEFAULT_CLOUD_API_BASE = 'http://localhost:8787'

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getStorageMode(): StorageMode {
  const mode = uni.getStorageSync(STORAGE_MODE_KEY)
  return mode === 'cloud' ? 'cloud' : 'local'
}

export function setStorageMode(mode: StorageMode): void {
  uni.setStorageSync(STORAGE_MODE_KEY, mode)
}

export function isCloudMode(): boolean {
  return getStorageMode() === 'cloud'
}

export function getCloudApiBase(): string {
  const stored = uni.getStorageSync(CLOUD_API_BASE_KEY)
  const base = typeof stored === 'string' && stored.trim()
    ? stored.trim()
    : DEFAULT_CLOUD_API_BASE
  return normalizeBaseUrl(base)
}

export function setCloudApiBase(baseUrl: string): void {
  const normalized = normalizeBaseUrl(baseUrl.trim())
  if (normalized) {
    uni.setStorageSync(CLOUD_API_BASE_KEY, normalized)
  }
}

export function getOrCreateCloudUserId(): string {
  const existing = uni.getStorageSync(CLOUD_USER_ID_KEY)
  if (typeof existing === 'string' && existing.trim()) {
    return existing.trim()
  }

  const id = `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  uni.setStorageSync(CLOUD_USER_ID_KEY, id)
  return id
}
