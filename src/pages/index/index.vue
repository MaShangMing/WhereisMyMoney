<template>
  <view class="page">
    <!-- 月度概览卡片 -->
    <view class="summary-card">
      <view class="summary-header">
        <text class="summary-month">{{ currentMonthText }}</text>
        <view class="pending-badge" v-if="pendingCount > 0" @click="goToPending">
          <text class="pending-text">{{ pendingCount }}笔待确认</text>
        </view>
      </view>
      <view class="summary-content">
        <view class="summary-item">
          <text class="summary-label">收入</text>
          <text class="summary-value income">+{{ formatMoney(monthlyStats.totalIncome) }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">支出</text>
          <text class="summary-value expense">-{{ formatMoney(monthlyStats.totalExpense) }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">结余</text>
          <text class="summary-value" :class="monthlyStats.balance >= 0 ? 'income' : 'expense'">
            {{ monthlyStats.balance >= 0 ? '+' : '' }}{{ formatMoney(monthlyStats.balance) }}
          </text>
        </view>
      </view>
    </view>
    
    <!-- 交易列表 -->
    <view class="transaction-list">
      <view v-if="groupedTransactions.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无记录，点击下方按钮开始记账</text>
      </view>
      
      <view v-for="group in groupedTransactions" :key="group.date" class="transaction-group">
        <view class="group-header">
          <text class="group-date">{{ formatDate(group.date) }}</text>
          <view class="group-summary">
            <text v-if="group.income > 0" class="group-income">+{{ formatMoney(group.income) }}</text>
            <text v-if="group.expense > 0" class="group-expense">-{{ formatMoney(group.expense) }}</text>
          </view>
        </view>
        
        <view 
          v-for="transaction in group.transactions" 
          :key="transaction.id"
          class="transaction-item"
          @click="viewTransaction(transaction)"
          @longpress="showActionSheet(transaction)"
        >
          <view class="transaction-icon">
            <text>{{ getCategoryIcon(transaction.categoryId) }}</text>
          </view>
          <view class="transaction-info">
            <text class="transaction-category">{{ getCategoryName(transaction.categoryId) }}</text>
            <text class="transaction-merchant" v-if="transaction.merchant">{{ transaction.merchant }}</text>
            <text class="transaction-note" v-else-if="transaction.note">{{ transaction.note }}</text>
          </view>
          <view class="transaction-amount">
            <text :class="transaction.type === 'income' ? 'income' : 'expense'">
              {{ transaction.type === 'income' ? '+' : '-' }}{{ formatMoney(transaction.amount) }}
            </text>
            <view v-if="transaction.source !== 'manual'" class="transaction-source">
              <text class="source-tag">{{ getSourceName(transaction.source) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 添加按钮 -->
    <view class="add-btn" @click="goToAdd">
      <text class="add-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTransactionStore } from '@/stores/transaction'
import type { Transaction, TransactionSource } from '@/types'

const store = useTransactionStore()

// 计算属性
const monthlyStats = computed(() => store.monthlyStats)

const pendingCount = computed(() => store.pendingTransactions.length)

const currentMonthText = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月`
})

// 按日期分组的交易记录
const groupedTransactions = computed(() => {
  const groups: Map<string, {
    date: string
    income: number
    expense: number
    transactions: Transaction[]
  }> = new Map()
  
  store.confirmedTransactions.forEach(t => {
    const date = t.createdAt.split('T')[0]
    if (!groups.has(date)) {
      groups.set(date, { date, income: 0, expense: 0, transactions: [] })
    }
    const group = groups.get(date)!
    group.transactions.push(t)
    if (t.type === 'income') {
      group.income += t.amount
    } else {
      group.expense += t.amount
    }
  })
  
  return Array.from(groups.values())
    .sort((a, b) => b.date.localeCompare(a.date))
})

// 方法
function formatMoney(amount: number): string {
  return amount.toFixed(2)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天'
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天'
  } else {
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${month}月${day}日 ${weekdays[date.getDay()]}`
  }
}

function getCategoryIcon(categoryId: number): string {
  const category = store.getCategoryById(categoryId)
  return category?.icon || '📦'
}

function getCategoryName(categoryId: number): string {
  const category = store.getCategoryById(categoryId)
  return category?.name || '未知分类'
}

function getSourceName(source: TransactionSource): string {
  const sourceMap: Record<TransactionSource, string> = {
    manual: '手动',
    wechat: '微信',
    alipay: '支付宝',
    clipboard: '剪贴板'
  }
  return sourceMap[source] || source
}

function goToAdd() {
  uni.navigateTo({ url: '/pages/add/index' })
}

function goToPending() {
  uni.navigateTo({ url: '/pages/pending/index' })
}

function viewTransaction(transaction: Transaction) {
  uni.navigateTo({ 
    url: `/pages/add/index?id=${transaction.id}` 
  })
}

function showActionSheet(transaction: Transaction) {
  uni.showActionSheet({
    itemList: ['编辑', '删除'],
    success: async (res) => {
      if (res.tapIndex === 0) {
        viewTransaction(transaction)
      } else if (res.tapIndex === 1) {
        uni.showModal({
          title: '确认删除',
          content: '确定要删除这条记录吗？',
          success: async (modalRes) => {
            if (modalRes.confirm && transaction.id) {
              await store.deleteTransaction(transaction.id)
              uni.showToast({ title: '删除成功', icon: 'success' })
            }
          }
        })
      }
    }
  })
}

onShow(() => {
  // 每次显示页面时刷新数据
  store.loadTransactions()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: 160rpx;
}

.summary-card {
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  margin: 20rpx;
  padding: 30rpx;
  border-radius: $radius-lg;
  color: #ffffff;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.summary-month {
  font-size: $font-lg;
  font-weight: 600;
}

.pending-badge {
  background-color: $warning-color;
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
}

.pending-text {
  font-size: $font-xs;
  color: #ffffff;
}

.summary-content {
  display: flex;
  justify-content: space-between;
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: $font-sm;
  opacity: 0.8;
  display: block;
  margin-bottom: 10rpx;
}

.summary-value {
  font-size: $font-xl;
  font-weight: 600;
}

.transaction-list {
  padding: 0 20rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: $font-md;
  color: $text-secondary;
}

.transaction-group {
  margin-bottom: 20rpx;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 10rpx;
}

.group-date {
  font-size: $font-sm;
  color: $text-secondary;
}

.group-summary {
  display: flex;
  gap: 20rpx;
}

.group-income {
  font-size: $font-sm;
  color: $income-color;
}

.group-expense {
  font-size: $font-sm;
  color: $expense-color;
}

.transaction-item {
  display: flex;
  align-items: center;
  background-color: $bg-white;
  padding: 24rpx;
  border-radius: $radius-md;
  margin-bottom: 12rpx;
}

.transaction-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: $bg-grey;
  border-radius: $radius-round;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.transaction-info {
  flex: 1;
}

.transaction-category {
  font-size: $font-md;
  color: $text-primary;
  display: block;
}

.transaction-merchant,
.transaction-note {
  font-size: $font-sm;
  color: $text-secondary;
  margin-top: 6rpx;
  display: block;
}

.transaction-amount {
  text-align: right;
}

.transaction-amount text {
  font-size: $font-lg;
  font-weight: 600;
}

.income {
  color: $income-color;
}

.expense {
  color: $expense-color;
}

.transaction-source {
  margin-top: 6rpx;
}

.source-tag {
  font-size: $font-xs;
  color: $text-placeholder;
  background-color: $bg-grey;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.add-btn {
  position: fixed;
  right: 40rpx;
  bottom: 200rpx;
  width: 100rpx;
  height: 100rpx;
  background-color: $primary-color;
  border-radius: $radius-round;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(76, 175, 80, 0.4);
}

.add-icon {
  font-size: 60rpx;
  color: #ffffff;
  font-weight: 300;
}
</style>
