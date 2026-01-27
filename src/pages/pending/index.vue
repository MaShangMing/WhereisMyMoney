<template>
  <view class="page">
    <view v-if="pendingTransactions.length === 0" class="empty-state">
      <text class="empty-icon">✓</text>
      <text class="empty-title">没有待确认的记录</text>
      <text class="empty-desc">自动识别的支付记录会显示在这里</text>
    </view>
    
    <view v-else class="pending-list">
      <view class="list-header">
        <text>共 {{ pendingTransactions.length }} 条待确认</text>
        <view class="batch-actions">
          <text class="action-btn" @click="confirmAll">全部确认</text>
          <text class="action-btn delete" @click="deleteAll">全部删除</text>
        </view>
      </view>
      
      <view 
        v-for="transaction in pendingTransactions" 
        :key="transaction.id"
        class="pending-item"
      >
        <view class="item-header">
          <view class="source-badge" :class="transaction.source">
            <text>{{ getSourceName(transaction.source) }}</text>
          </view>
          <text class="item-time">{{ formatTime(transaction.createdAt) }}</text>
        </view>
        
        <view class="item-content">
          <view class="item-info">
            <view class="amount-row">
              <text class="amount" :class="transaction.type">
                {{ transaction.type === 'income' ? '+' : '-' }}¥{{ transaction.amount.toFixed(2) }}
              </text>
            </view>
            <text class="merchant" v-if="transaction.merchant">{{ transaction.merchant }}</text>
          </view>
          
          <view class="item-category" @click="selectCategory(transaction)">
            <text class="category-icon">{{ getCategoryIcon(transaction.categoryId) }}</text>
            <text class="category-name">{{ getCategoryName(transaction.categoryId) }}</text>
            <text class="change-hint">点击修改</text>
          </view>
        </view>
        
        <view class="item-actions">
          <button class="action-btn confirm" @click="confirmTransaction(transaction)">
            <text>确认</text>
          </button>
          <button class="action-btn edit" @click="editTransaction(transaction)">
            <text>编辑</text>
          </button>
          <button class="action-btn delete" @click="deleteTransaction(transaction)">
            <text>删除</text>
          </button>
        </view>
      </view>
    </view>
    
    <!-- 分类选择弹窗 -->
    <view class="category-popup" v-if="showCategoryPicker" @click="showCategoryPicker = false">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">选择分类</text>
          <text class="popup-close" @click="showCategoryPicker = false">×</text>
        </view>
        <view class="popup-body">
          <view class="category-grid">
            <view 
              v-for="category in expenseCategories" 
              :key="category.id"
              class="category-option"
              :class="{ active: selectedTransaction?.categoryId === category.id }"
              @click="updateCategory(category.id!)"
            >
              <text class="option-icon">{{ category.icon }}</text>
              <text class="option-name">{{ category.name }}</text>
            </view>
          </view>
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

// 方法
function getSourceName(source: TransactionSource): string {
  const sourceMap: Record<TransactionSource, string> = {
    manual: '手动',
    wechat: '微信',
    alipay: '支付宝',
    clipboard: '剪贴板'
  }
  return sourceMap[source] || source
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
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
  return category?.name || '点击选择分类'
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
    uni.showToast({ title: '已更新分类', icon: 'success' })
  }
}

async function confirmTransaction(transaction: Transaction) {
  if (transaction.id) {
    await store.confirmTransaction(transaction.id)
    uni.showToast({ title: '已确认', icon: 'success' })
  }
}

function editTransaction(transaction: Transaction) {
  uni.navigateTo({ url: `/pages/add/index?id=${transaction.id}` })
}

async function deleteTransaction(transaction: Transaction) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm && transaction.id) {
        await store.deleteTransaction(transaction.id)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

async function confirmAll() {
  uni.showModal({
    title: '确认全部',
    content: `确定要确认全部 ${pendingTransactions.value.length} 条记录吗？`,
    success: async (res) => {
      if (res.confirm) {
        for (const transaction of pendingTransactions.value) {
          if (transaction.id) {
            await store.confirmTransaction(transaction.id)
          }
        }
        uni.showToast({ title: '全部已确认', icon: 'success' })
      }
    }
  })
}

async function deleteAll() {
  uni.showModal({
    title: '删除全部',
    content: `确定要删除全部 ${pendingTransactions.value.length} 条记录吗？`,
    success: async (res) => {
      if (res.confirm) {
        for (const transaction of [...pendingTransactions.value]) {
          if (transaction.id) {
            await store.deleteTransaction(transaction.id)
          }
        }
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  color: $primary-color;
  margin-bottom: 30rpx;
}

.empty-title {
  font-size: $font-lg;
  color: $text-primary;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: $font-sm;
  color: $text-secondary;
}

.pending-list {
  padding: 20rpx;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 10rpx;
  
  text {
    font-size: $font-sm;
    color: $text-secondary;
  }
}

.batch-actions {
  display: flex;
  gap: 20rpx;
}

.batch-actions .action-btn {
  font-size: $font-sm;
  color: $primary-color;
  
  &.delete {
    color: $danger-color;
  }
}

.pending-item {
  background-color: $bg-white;
  border-radius: $radius-lg;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.source-badge {
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  
  text {
    font-size: $font-xs;
    color: #ffffff;
  }
  
  &.wechat {
    background-color: #07c160;
  }
  
  &.alipay {
    background-color: #1677ff;
  }
  
  &.clipboard {
    background-color: $warning-color;
  }
  
  &.manual {
    background-color: $text-secondary;
  }
}

.item-time {
  font-size: $font-xs;
  color: $text-placeholder;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid $border-light;
}

.item-info {
  flex: 1;
}

.amount-row {
  margin-bottom: 10rpx;
}

.amount {
  font-size: $font-xxl;
  font-weight: 600;
  
  &.income {
    color: $income-color;
  }
  
  &.expense {
    color: $expense-color;
  }
}

.merchant {
  font-size: $font-sm;
  color: $text-secondary;
}

.item-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx;
  background-color: $bg-grey;
  border-radius: $radius-md;
}

.category-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: $font-xs;
  color: $text-primary;
}

.change-hint {
  font-size: 20rpx;
  color: $text-placeholder;
  margin-top: 4rpx;
}

.item-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.item-actions .action-btn {
  flex: 1;
  padding: 16rpx 0;
  border-radius: $radius-md;
  font-size: $font-sm;
  
  &.confirm {
    background-color: $primary-color;
    color: #ffffff;
  }
  
  &.edit {
    background-color: $bg-grey;
    color: $text-primary;
  }
  
  &.delete {
    background-color: rgba(244, 67, 54, 0.1);
    color: $danger-color;
  }
}

// 分类选择弹窗
.category-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.popup-content {
  width: 100%;
  background-color: $bg-white;
  border-radius: $radius-xl $radius-xl 0 0;
  max-height: 70vh;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid $border-light;
}

.popup-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.popup-close {
  font-size: 48rpx;
  color: $text-secondary;
  padding: 0 10rpx;
}

.popup-body {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.category-option {
  width: calc(20% - 16rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  border-radius: $radius-md;
  transition: all 0.3s;
  
  &.active {
    background-color: rgba(76, 175, 80, 0.1);
  }
}

.option-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.option-name {
  font-size: $font-xs;
  color: $text-secondary;
}
</style>
