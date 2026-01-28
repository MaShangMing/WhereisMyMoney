<template>
  <view class="page">
    <!-- 空状态 -->
    <view v-if="pendingTransactions.length === 0" class="empty-state">
      <view class="empty-illustration">
        <view class="empty-circle">
          <text class="empty-icon">✓</text>
        </view>
        <view class="empty-ring"></view>
      </view>
      <text class="empty-title">太棒了！</text>
      <text class="empty-desc">没有待确认的记录</text>
      <text class="empty-hint">自动识别的支付记录会显示在这里</text>
      
      <view class="empty-actions">
        <view class="action-card" @click="goToScan">
          <view class="action-icon scan">
            <text>📷</text>
          </view>
          <view class="action-info">
            <text class="action-title">扫描识别</text>
            <text class="action-desc">拍照或选择截图识别</text>
          </view>
        </view>
        <view class="action-card" @click="goToClipboard">
          <view class="action-icon clipboard">
            <text>📋</text>
          </view>
          <view class="action-info">
            <text class="action-title">剪贴板识别</text>
            <text class="action-desc">从剪贴板读取支付信息</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 待确认列表 -->
    <view v-else class="pending-container">
      <!-- 头部统计 -->
      <view class="header-stats">
        <view class="stats-card">
          <view class="stats-row">
            <view class="stats-item">
              <text class="stats-value">{{ pendingTransactions.length }}</text>
              <text class="stats-label">待确认</text>
            </view>
            <view class="stats-divider"></view>
            <view class="stats-item">
              <text class="stats-value expense">¥{{ totalPendingAmount.toFixed(2) }}</text>
              <text class="stats-label">总金额</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 批量操作 -->
      <view class="batch-actions">
        <view class="batch-btn confirm" @click="confirmAll">
          <text class="batch-icon">✓</text>
          <text>全部确认</text>
        </view>
        <view class="batch-btn delete" @click="deleteAll">
          <text class="batch-icon">✕</text>
          <text>全部删除</text>
        </view>
      </view>

      <!-- 列表 -->
      <view class="pending-list">
        <view
          v-for="(transaction, index) in pendingTransactions"
          :key="transaction.id"
          class="pending-card"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <!-- 来源标签 -->
          <view class="card-header">
            <view class="source-badge" :class="transaction.source">
              <text class="source-icon">{{ getSourceIcon(transaction.source) }}</text>
              <text class="source-name">{{ getSourceName(transaction.source) }}</text>
            </view>
            <text class="card-time">{{ formatTime(transaction.createdAt) }}</text>
          </view>

          <!-- 金额区域 -->
          <view class="card-amount">
            <text class="amount-sign">{{ transaction.type === 'income' ? '+' : '-' }}</text>
            <text class="amount-value" :class="transaction.type">
              ¥{{ transaction.amount.toFixed(2) }}
            </text>
          </view>

          <!-- 商户信息 -->
          <view class="card-merchant" v-if="transaction.merchant">
            <text class="merchant-icon">🏪</text>
            <text class="merchant-name">{{ transaction.merchant }}</text>
          </view>

          <!-- 分类选择 -->
          <view class="card-category" @click="selectCategory(transaction)">
            <view class="category-current">
              <text class="category-icon">{{ getCategoryIcon(transaction.categoryId) }}</text>
              <text class="category-name">{{ getCategoryName(transaction.categoryId) }}</text>
            </view>
            <view class="category-hint">
              <text>点击修改</text>
              <text class="hint-arrow">›</text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="card-actions">
            <view class="action-btn confirm" @click="confirmTransaction(transaction)">
              <text class="btn-icon">✓</text>
              <text>确认</text>
            </view>
            <view class="action-btn edit" @click="editTransaction(transaction)">
              <text class="btn-icon">✎</text>
              <text>编辑</text>
            </view>
            <view class="action-btn delete" @click="deleteTransaction(transaction)">
              <text class="btn-icon">✕</text>
              <text>删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 分类选择弹窗 -->
    <view class="popup-overlay" v-if="showCategoryPicker" @click="showCategoryPicker = false">
      <view class="popup-container" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择分类</text>
          <view class="popup-close" @click="showCategoryPicker = false">
            <text>×</text>
          </view>
        </view>
        
        <view class="popup-body">
          <scroll-view scroll-y class="category-scroll">
            <view class="category-grid">
              <view
                v-for="category in expenseCategories"
                :key="category.id"
                class="category-option"
                :class="{ active: selectedTransaction?.categoryId === category.id }"
                @click="updateCategory(category.id!)"
              >
                <view class="option-icon" :class="{ active: selectedTransaction?.categoryId === category.id }">
                  <text>{{ category.icon }}</text>
                </view>
                <text class="option-name">{{ category.name }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTransactionStore } from '@/stores/transaction'
import type { Transaction, TransactionSource } from '@/types'

const store = useTransactionStore()

// 状态
const showCategoryPicker = ref(false)
const selectedTransaction = ref<Transaction | null>(null)

// 计算属性
const pendingTransactions = computed(() => store.pendingTransactions)
const expenseCategories = computed(() => store.expenseCategories)

const totalPendingAmount = computed(() => {
  return pendingTransactions.value.reduce((sum, t) => sum + t.amount, 0)
})

// 方法
function getSourceIcon(source: TransactionSource): string {
  const icons: Record<TransactionSource, string> = {
    manual: '✋',
    wechat: '💚',
    alipay: '💙',
    clipboard: '📋'
  }
  return icons[source] || '📦'
}

function getSourceName(source: TransactionSource): string {
  const names: Record<TransactionSource, string> = {
    manual: '手动',
    wechat: '微信',
    alipay: '支付宝',
    clipboard: '剪贴板'
  }
  return names[source] || source
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 1小时内
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
  }
  
  // 24小时内
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}小时前`
  }
  
  // 超过24小时
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

function getCategoryIcon(categoryId: number): string {
  const category = store.getCategoryById(categoryId)
  return category?.icon || '📦'
}

function getCategoryName(categoryId: number): string {
  const category = store.getCategoryById(categoryId)
  return category?.name || '点击选择'
}

function goToScan() {
  uni.navigateTo({ url: '/pages/scan/index' })
}

function goToClipboard() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function selectCategory(transaction: Transaction) {
  selectedTransaction.value = transaction
  showCategoryPicker.value = true
}

async function updateCategory(categoryId: number) {
  if (selectedTransaction.value) {
    selectedTransaction.value.categoryId = categoryId
    await store.updateTransaction(selectedTransaction.value)
    showCategoryPicker.value = false
    uni.vibrateShort({ type: 'light' })
    uni.showToast({ title: '已更新', icon: 'success' })
  }
}

async function confirmTransaction(transaction: Transaction) {
  if (transaction.id) {
    await store.confirmTransaction(transaction.id)
    uni.vibrateShort({ type: 'medium' })
    uni.showToast({ title: '已确认', icon: 'success' })
  }
}

function editTransaction(transaction: Transaction) {
  uni.navigateTo({ url: `/pages/add/index?id=${transaction.id}` })
}

async function deleteTransaction(transaction: Transaction) {
  uni.showModal({
    title: '删除确认',
    content: '确定要删除这条记录吗？',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm && transaction.id) {
        await store.deleteTransaction(transaction.id)
        uni.vibrateShort({ type: 'medium' })
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

async function confirmAll() {
  if (pendingTransactions.value.length === 0) return
  
  uni.showModal({
    title: '确认全部',
    content: `确定要确认全部 ${pendingTransactions.value.length} 条记录吗？`,
    confirmColor: '#10B981',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...' })
        for (const transaction of pendingTransactions.value) {
          if (transaction.id) {
            await store.confirmTransaction(transaction.id)
          }
        }
        uni.hideLoading()
        uni.vibrateShort({ type: 'heavy' })
        uni.showToast({ title: '全部已确认', icon: 'success' })
      }
    }
  })
}

async function deleteAll() {
  if (pendingTransactions.value.length === 0) return
  
  uni.showModal({
    title: '删除全部',
    content: `确定要删除全部 ${pendingTransactions.value.length} 条记录吗？此操作不可撤销。`,
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '处理中...' })
        const transactions = [...pendingTransactions.value]
        for (const transaction of transactions) {
          if (transaction.id) {
            await store.deleteTransaction(transaction.id)
          }
        }
        uni.hideLoading()
        uni.vibrateShort({ type: 'heavy' })
        uni.showToast({ title: '全部已删除', icon: 'success' })
      }
    }
  })
}

onShow(() => {
  store.loadTransactions()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
}

// 空状态
.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: 100rpx $page-padding;
  min-height: 80vh;
}

.empty-illustration {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin-bottom: $spacing-xl;
}

.empty-circle {
  width: 160rpx;
  height: 160rpx;
  @include flex-center;
  background: $income-color;
  border-radius: $radius-round;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.empty-icon {
  font-size: 80rpx;
  color: $text-inverse;
}

.empty-ring {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 4rpx solid $income-light;
  border-radius: $radius-round;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.3;
  }
}

.empty-title {
  font-size: $font-xl;
  color: $text-primary;
  font-weight: $font-semibold;
  margin-bottom: $spacing-sm;
}

.empty-desc {
  font-size: $font-lg;
  color: $income-color;
  margin-bottom: $spacing-xs;
}

.empty-hint {
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: $spacing-2xl;
}

.empty-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.action-card {
  display: flex;
  align-items: center;
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $radius-xl;
  box-shadow: $shadow-card;
  @include press-effect;
}

.action-icon {
  width: 80rpx;
  height: 80rpx;
  @include flex-center;
  border-radius: $radius-lg;
  margin-right: $spacing-md;
  font-size: 40rpx;
  
  &.scan {
    background: linear-gradient(135deg, #DBEAFE, #BFDBFE);
  }
  
  &.clipboard {
    background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  }
}

.action-info {
  flex: 1;
}

.action-title {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
  display: block;
  margin-bottom: 4rpx;
}

.action-desc {
  font-size: $font-xs;
  color: $text-secondary;
}

// 待确认容器
.pending-container {
  padding-bottom: calc(100rpx + $safe-area-bottom);
}

// 头部统计
.header-stats {
  padding: $spacing-lg $page-padding;
  background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
}

.stats-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: $radius-xl;
  padding: $spacing-lg;
}

.stats-row {
  display: flex;
  align-items: center;
}

.stats-item {
  flex: 1;
  text-align: center;
}

.stats-value {
  font-size: $font-xxl;
  font-weight: $font-bold;
  color: $text-primary;
  display: block;
  margin-bottom: 4rpx;
  
  &.expense {
    color: $expense-color;
  }
}

.stats-label {
  font-size: $font-xs;
  color: $text-secondary;
}

.stats-divider {
  width: 2rpx;
  height: 60rpx;
  background: $border-color;
}

// 批量操作
.batch-actions {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-md $page-padding;
}

.batch-btn {
  flex: 1;
  @include flex-center;
  padding: $spacing-md;
  border-radius: $radius-lg;
  font-size: $font-sm;
  @include press-effect;
  
  .batch-icon {
    margin-right: $spacing-xs;
    font-weight: $font-bold;
  }
  
  &.confirm {
    background: $income-light;
    color: $income-color;
  }
  
  &.delete {
    background: $expense-light;
    color: $expense-color;
  }
}

// 待确认列表
.pending-list {
  padding: 0 $page-padding;
}

.pending-card {
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-card;
  animation: slideIn 0.3s ease-out forwards;
  opacity: 0;
  transform: translateY(20rpx);
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  @include flex-between;
  margin-bottom: $spacing-md;
}

.source-badge {
  display: flex;
  align-items: center;
  padding: 8rpx 16rpx;
  border-radius: $radius-full;
  
  &.wechat {
    background: #D1FAE5;
  }
  
  &.alipay {
    background: #DBEAFE;
  }
  
  &.clipboard {
    background: #FEF3C7;
  }
  
  &.manual {
    background: $bg-grey;
  }
}

.source-icon {
  font-size: 24rpx;
  margin-right: 6rpx;
}

.source-name {
  font-size: $font-xs;
  color: $text-primary;
}

.card-time {
  font-size: $font-xs;
  color: $text-placeholder;
}

.card-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: $spacing-md;
}

.amount-sign {
  font-size: $font-xl;
  color: $text-secondary;
  margin-right: 4rpx;
}

.amount-value {
  font-size: $font-3xl;
  font-weight: $font-bold;
  
  &.income {
    color: $income-color;
  }
  
  &.expense {
    color: $expense-color;
  }
}

.card-merchant {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $bg-grey;
  border-radius: $radius-lg;
  margin-bottom: $spacing-md;
}

.merchant-icon {
  font-size: 24rpx;
  margin-right: $spacing-sm;
}

.merchant-name {
  font-size: $font-sm;
  color: $text-primary;
}

.card-category {
  @include flex-between;
  padding: $spacing-md;
  background: $bg-grey;
  border-radius: $radius-lg;
  margin-bottom: $spacing-md;
}

.category-current {
  display: flex;
  align-items: center;
}

.category-icon {
  font-size: 36rpx;
  margin-right: $spacing-sm;
}

.category-name {
  font-size: $font-md;
  color: $text-primary;
}

.category-hint {
  display: flex;
  align-items: center;
  
  text {
    font-size: $font-xs;
    color: $text-placeholder;
  }
  
  .hint-arrow {
    font-size: $font-md;
    margin-left: 4rpx;
  }
}

.card-actions {
  display: flex;
  gap: $spacing-sm;
}

.action-btn {
  flex: 1;
  @include flex-center;
  padding: $spacing-md;
  border-radius: $radius-lg;
  font-size: $font-sm;
  @include press-effect;
  
  .btn-icon {
    margin-right: 6rpx;
    font-size: $font-md;
  }
  
  &.confirm {
    background: $income-color;
    color: $text-inverse;
  }
  
  &.edit {
    background: $bg-grey;
    color: $text-primary;
  }
  
  &.delete {
    background: $expense-light;
    color: $expense-color;
  }
}

// 弹窗
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex-center;
  align-items: flex-end;
  z-index: $z-modal;
}

.popup-container {
  width: 100%;
  background: $bg-white;
  border-radius: $radius-2xl $radius-2xl 0 0;
  max-height: 70vh;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.popup-header {
  @include flex-between;
  padding: $spacing-lg;
  border-bottom: 1rpx solid $border-light;
}

.popup-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-semibold;
}

.popup-close {
  width: 60rpx;
  height: 60rpx;
  @include flex-center;
  
  text {
    font-size: 48rpx;
    color: $text-secondary;
  }
}

.popup-body {
  padding: $spacing-lg;
  padding-bottom: calc($spacing-lg + $safe-area-bottom);
}

.category-scroll {
  max-height: 50vh;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
}

.category-option {
  width: calc(20% - #{$spacing-md * 0.8});
  display: flex;
  flex-direction: column;
  align-items: center;
  @include press-effect;
}

.option-icon {
  width: 88rpx;
  height: 88rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-xl;
  margin-bottom: $spacing-sm;
  font-size: 44rpx;
  transition: all $transition-normal;
  border: 3rpx solid transparent;
  
  &.active {
    background: $primary-soft;
    border-color: $primary-color;
  }
}

.option-name {
  font-size: $font-xs;
  color: $text-secondary;
  text-align: center;
}
</style>
