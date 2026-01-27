<template>
  <view class="page">
    <!-- 顶部头部区域 -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content">
        <!-- 月份切换 -->
        <view class="month-nav">
          <view class="month-arrow" @click="prevMonth" :class="{ disabled: !canGoPrev }">
            <text class="arrow-icon">‹</text>
          </view>
          <view class="month-info" @click="showMonthPicker">
            <text class="month-text">{{ currentMonthText }}</text>
            <text class="month-arrow-down">▾</text>
          </view>
          <view class="month-arrow" @click="nextMonth" :class="{ disabled: !canGoNext }">
            <text class="arrow-icon">›</text>
          </view>
        </view>

        <!-- 金额概览卡片 -->
        <view class="summary-card">
          <view class="balance-section">
            <text class="balance-label">本月结余</text>
            <view class="balance-value">
              <text class="currency">¥</text>
              <text class="amount" :class="monthlyStats.balance >= 0 ? 'positive' : 'negative'">
                {{ formatMoney(Math.abs(monthlyStats.balance)) }}
              </text>
            </view>
          </view>
          
          <view class="stats-row">
            <view class="stat-item" @click="goToStatistics('income')">
              <view class="stat-icon income">
                <text>↓</text>
              </view>
              <view class="stat-info">
                <text class="stat-label">收入</text>
                <text class="stat-value income">{{ formatMoney(monthlyStats.totalIncome) }}</text>
              </view>
            </view>
            <view class="stat-divider"></view>
            <view class="stat-item" @click="goToStatistics('expense')">
              <view class="stat-icon expense">
                <text>↑</text>
              </view>
              <view class="stat-info">
                <text class="stat-label">支出</text>
                <text class="stat-value expense">{{ formatMoney(monthlyStats.totalExpense) }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 待确认提示 -->
        <view class="pending-tip" v-if="pendingCount > 0" @click="goToPending">
          <view class="pending-icon">
            <text>!</text>
          </view>
          <text class="pending-text">{{ pendingCount }}笔交易待确认</text>
          <text class="pending-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 快捷操作栏 -->
    <view class="quick-actions">
      <view class="action-item" @click="quickAdd('expense')">
        <view class="action-icon expense">
          <text>-</text>
        </view>
        <text class="action-label">支出</text>
      </view>
      <view class="action-item" @click="quickAdd('income')">
        <view class="action-icon income">
          <text>+</text>
        </view>
        <text class="action-label">收入</text>
      </view>
      <view class="action-item" @click="scanReceipt">
        <view class="action-icon scan">
          <text>📷</text>
        </view>
        <text class="action-label">扫描</text>
      </view>
      <view class="action-item" @click="goToStatistics">
        <view class="action-icon stats">
          <text>📊</text>
        </view>
        <text class="action-label">统计</text>
      </view>
    </view>

    <!-- 交易列表 -->
    <view class="transaction-section">
      <view class="section-header">
        <text class="section-title">交易记录</text>
        <view class="filter-btn" @click="showFilter" v-if="groupedTransactions.length > 0">
          <text>筛选</text>
        </view>
      </view>

      <view v-if="groupedTransactions.length === 0" class="empty-state">
        <view class="empty-illustration">
          <text class="empty-icon">📝</text>
        </view>
        <text class="empty-title">暂无记录</text>
        <text class="empty-desc">点击下方按钮开始记账吧</text>
        <button class="empty-action" @click="goToAdd">
          <text>+ 记一笔</text>
        </button>
      </view>

      <view v-else class="transaction-list">
        <view v-for="group in groupedTransactions" :key="group.date" class="transaction-group">
          <view class="group-header">
            <view class="group-date-info">
              <text class="group-date">{{ formatDate(group.date) }}</text>
              <text class="group-weekday">{{ getWeekday(group.date) }}</text>
            </view>
            <view class="group-summary">
              <text v-if="group.income > 0" class="group-income">+{{ formatMoney(group.income) }}</text>
              <text v-if="group.expense > 0" class="group-expense">-{{ formatMoney(group.expense) }}</text>
            </view>
          </view>

          <view class="group-items">
            <view
              v-for="transaction in group.transactions"
              :key="transaction.id"
              class="transaction-item"
              @click="viewTransaction(transaction)"
              @longpress="showActionSheet(transaction)"
              @touchstart="onTouchStart($event, transaction)"
              @touchend="onTouchEnd"
            >
              <view class="transaction-icon" :style="{ backgroundColor: getCategoryColor(transaction.categoryId) }">
                <text>{{ getCategoryIcon(transaction.categoryId) }}</text>
              </view>
              <view class="transaction-info">
                <view class="transaction-main">
                  <text class="transaction-category">{{ getCategoryName(transaction.categoryId) }}</text>
                  <text class="transaction-amount" :class="transaction.type">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatMoney(transaction.amount) }}
                  </text>
                </view>
                <view class="transaction-sub">
                  <text class="transaction-detail" v-if="transaction.merchant || transaction.note">
                    {{ transaction.merchant || transaction.note }}
                  </text>
                  <view v-if="transaction.source !== 'manual'" class="source-tag" :class="transaction.source">
                    <text>{{ getSourceName(transaction.source) }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加按钮 -->
    <view class="add-btn-wrapper">
      <view class="add-btn" @click="goToAdd">
        <text class="add-icon">+</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useTransactionStore } from '@/stores/transaction'
import type { Transaction, TransactionSource, TransactionType } from '@/types'

const store = useTransactionStore()

// 当前选择的月份
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

// 计算属性
const currentMonthText = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const canGoPrev = computed(() => true)
const canGoNext = computed(() => {
  const now = new Date()
  return !(currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth())
})

// 计算指定月份的统计数据
const monthlyStats = computed(() => {
  const startOfMonth = new Date(currentYear.value, currentMonth.value, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0).toISOString().split('T')[0]

  const monthTransactions = store.confirmedTransactions.filter(t => {
    const date = t.createdAt.split('T')[0]
    return date >= startOfMonth && date <= endOfMonth
  })

  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense
  }
})

const pendingCount = computed(() => store.pendingTransactions.length)

// 按日期分组的交易记录（当前月份）
const groupedTransactions = computed(() => {
  const startOfMonth = new Date(currentYear.value, currentMonth.value, 1).toISOString().split('T')[0]
  const endOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0).toISOString().split('T')[0]

  const groups: Map<string, {
    date: string
    income: number
    expense: number
    transactions: Transaction[]
  }> = new Map()

  store.confirmedTransactions
    .filter(t => {
      const date = t.createdAt.split('T')[0]
      return date >= startOfMonth && date <= endOfMonth
    })
    .forEach(t => {
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
function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (!canGoNext.value) return

  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function showMonthPicker() {
  // 简化的月份选择
  uni.showActionSheet({
    itemList: ['本月', '上月', '上上月'],
    success: (res) => {
      const now = new Date()
      if (res.tapIndex === 0) {
        currentYear.value = now.getFullYear()
        currentMonth.value = now.getMonth()
      } else if (res.tapIndex === 1) {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
        currentYear.value = lastMonth.getFullYear()
        currentMonth.value = lastMonth.getMonth()
      } else if (res.tapIndex === 2) {
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2)
        currentYear.value = twoMonthsAgo.getFullYear()
        currentMonth.value = twoMonthsAgo.getMonth()
      }
    }
  })
}

function formatMoney(amount: number): string {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
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
    return `${month}月${day}日`
  }
}

function getWeekday(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) {
    return ''
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return ''
  }

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

function getCategoryIcon(categoryId: number): string {
  const category = store.getCategoryById(categoryId)
  return category?.icon || '📦'
}

function getCategoryName(categoryId: number): string {
  const category = store.getCategoryById(categoryId)
  return category?.name || '未知分类'
}

function getCategoryColor(categoryId: number): string {
  // 根据分类返回柔和的背景色
  const colors = [
    '#FEF3C7', '#DBEAFE', '#D1FAE5', '#FCE7F3',
    '#E0E7FF', '#FED7AA', '#CFFAFE', '#F3E8FF',
    '#FECACA', '#D9F99D'
  ]
  return colors[(categoryId - 1) % colors.length]
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

function quickAdd(type: TransactionType) {
  uni.navigateTo({ url: `/pages/add/index?type=${type}` })
}

function goToAdd() {
  uni.navigateTo({ url: '/pages/add/index' })
}

function goToPending() {
  uni.navigateTo({ url: '/pages/pending/index' })
}

function goToStatistics(type?: string) {
  uni.switchTab({ url: '/pages/statistics/index' })
}

function scanReceipt() {
  uni.navigateTo({ url: '/pages/scan/index' })
}

function showFilter() {
  uni.showActionSheet({
    itemList: ['全部', '仅支出', '仅收入'],
    success: (res) => {
      // TODO: 实现筛选功能
    }
  })
}

function viewTransaction(transaction: Transaction) {
  uni.navigateTo({
    url: `/pages/add/index?id=${transaction.id}`
  })
}

// 长按操作
let longPressTimer: number | null = null
let isLongPress = false

function onTouchStart(e: TouchEvent, transaction: Transaction) {
  isLongPress = false
  longPressTimer = setTimeout(() => {
    isLongPress = true
    uni.vibrateShort({ type: 'medium' })
  }, 500) as unknown as number
}

function onTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
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
  // 重置到当前月份
  const now = new Date()
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth()
  // 刷新数据
  store.loadTransactions()
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: 200rpx;
}

// 顶部区域
.header {
  position: relative;
  padding-top: calc(88rpx + $safe-area-top);
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 520rpx;
  background: $primary-gradient;
  border-radius: 0 0 60rpx 60rpx;
}

.header-content {
  position: relative;
  padding: 0 $page-padding;
  z-index: 1;
}

// 月份导航
.month-nav {
  @include flex-center;
  margin-bottom: $spacing-lg;
}

.month-arrow {
  width: 60rpx;
  height: 60rpx;
  @include flex-center;
  @include press-effect;

  &.disabled {
    opacity: 0.3;
  }
}

.arrow-icon {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 300;
}

.month-info {
  @include flex-center;
  padding: 12rpx 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-full;
  margin: 0 $spacing-md;
}

.month-text {
  font-size: $font-md;
  color: $text-inverse;
  font-weight: $font-medium;
}

.month-arrow-down {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 8rpx;
}

// 金额概览卡片
.summary-card {
  @include card-style;
  padding: $spacing-xl $spacing-lg;
  @include glass-effect;
}

.balance-section {
  text-align: center;
  margin-bottom: $spacing-xl;
}

.balance-label {
  font-size: $font-sm;
  color: $text-secondary;
  display: block;
  margin-bottom: $spacing-sm;
}

.balance-value {
  @include flex-center;
}

.currency {
  font-size: $font-xl;
  color: $text-primary;
  margin-right: 4rpx;
  font-weight: $font-medium;
}

.amount {
  font-size: $font-3xl;
  font-weight: $font-bold;

  &.positive {
    color: $income-color;
  }

  &.negative {
    color: $expense-color;
  }
}

.stats-row {
  display: flex;
  align-items: center;
  background: $bg-grey;
  border-radius: $radius-lg;
  padding: $spacing-md;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  @include press-effect;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: $border-color;
}

.stat-icon {
  width: 72rpx;
  height: 72rpx;
  @include flex-center;
  border-radius: $radius-lg;
  margin-right: $spacing-md;
  font-size: $font-lg;
  font-weight: $font-bold;

  &.income {
    background: $income-light;
    color: $income-color;
  }

  &.expense {
    background: $expense-light;
    color: $expense-color;
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: $font-xs;
  color: $text-secondary;
  margin-bottom: 4rpx;
}

.stat-value {
  font-size: $font-lg;
  font-weight: $font-semibold;

  &.income {
    color: $income-color;
  }

  &.expense {
    color: $expense-color;
  }
}

// 待确认提示
.pending-tip {
  display: flex;
  align-items: center;
  background: $warning-color;
  margin-top: $spacing-md;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-lg;
  @include press-effect;
}

.pending-icon {
  width: 40rpx;
  height: 40rpx;
  @include flex-center;
  background: rgba(255, 255, 255, 0.3);
  border-radius: $radius-round;
  margin-right: $spacing-sm;

  text {
    font-size: $font-sm;
    color: $text-inverse;
    font-weight: $font-bold;
  }
}

.pending-text {
  flex: 1;
  font-size: $font-sm;
  color: $text-inverse;
}

.pending-arrow {
  font-size: $font-lg;
  color: rgba(255, 255, 255, 0.8);
}

// 快捷操作栏
.quick-actions {
  display: flex;
  justify-content: space-around;
  padding: $spacing-lg $page-padding;
  margin-top: -40rpx;
  position: relative;
  z-index: 2;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  @include press-effect;
}

.action-icon {
  width: 96rpx;
  height: 96rpx;
  @include flex-center;
  border-radius: $radius-xl;
  margin-bottom: $spacing-sm;
  font-size: $font-xl;
  box-shadow: $shadow-md;

  &.expense {
    background: linear-gradient(135deg, #FEE2E2, #FECACA);
    color: $expense-color;
  }

  &.income {
    background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
    color: $income-color;
  }

  &.scan {
    background: linear-gradient(135deg, #DBEAFE, #BFDBFE);
  }

  &.stats {
    background: linear-gradient(135deg, #E0E7FF, #C7D2FE);
  }
}

.action-label {
  font-size: $font-xs;
  color: $text-secondary;
}

// 交易列表区域
.transaction-section {
  padding: 0 $page-padding;
}

.section-header {
  @include flex-between;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-lg;
  font-weight: $font-semibold;
  color: $text-primary;
}

.filter-btn {
  padding: 8rpx 20rpx;
  background: $bg-grey;
  border-radius: $radius-full;

  text {
    font-size: $font-xs;
    color: $text-secondary;
  }
}

// 空状态
.empty-state {
  @include flex-center;
  flex-direction: column;
  padding: 80rpx $spacing-xl;
  background: $bg-white;
  border-radius: $radius-xl;
}

.empty-illustration {
  width: 160rpx;
  height: 160rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-round;
  margin-bottom: $spacing-lg;
}

.empty-icon {
  font-size: 80rpx;
}

.empty-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-medium;
  margin-bottom: $spacing-sm;
}

.empty-desc {
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: $spacing-xl;
}

.empty-action {
  background: $primary-gradient;
  color: $text-inverse;
  border: none;
  border-radius: $radius-full;
  padding: 20rpx 48rpx;
  font-size: $font-md;
  box-shadow: $shadow-primary;
}

// 交易分组
.transaction-group {
  margin-bottom: $spacing-lg;
}

.group-header {
  @include flex-between;
  padding: $spacing-sm 0;
}

.group-date-info {
  display: flex;
  align-items: baseline;
}

.group-date {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
  margin-right: $spacing-sm;
}

.group-weekday {
  font-size: $font-xs;
  color: $text-placeholder;
}

.group-summary {
  display: flex;
  gap: $spacing-md;
}

.group-income {
  font-size: $font-sm;
  color: $income-color;
}

.group-expense {
  font-size: $font-sm;
  color: $expense-color;
}

// 交易项
.group-items {
  background: $bg-white;
  border-radius: $radius-xl;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: $spacing-md $spacing-lg;
  transition: background-color $transition-fast;

  &:not(:last-child) {
    border-bottom: 1rpx solid $border-light;
  }

  &:active {
    background-color: $bg-grey;
  }
}

.transaction-icon {
  width: 88rpx;
  height: 88rpx;
  @include flex-center;
  border-radius: $radius-lg;
  margin-right: $spacing-md;
  font-size: 44rpx;
}

.transaction-info {
  flex: 1;
  min-width: 0;
}

.transaction-main {
  @include flex-between;
  margin-bottom: 6rpx;
}

.transaction-category {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
  @include text-ellipsis;
}

.transaction-amount {
  font-size: $font-lg;
  font-weight: $font-semibold;

  &.income {
    color: $income-color;
  }

  &.expense {
    color: $expense-color;
  }
}

.transaction-sub {
  @include flex-between;
}

.transaction-detail {
  font-size: $font-xs;
  color: $text-secondary;
  @include text-ellipsis;
  flex: 1;
  margin-right: $spacing-sm;
}

.source-tag {
  padding: 4rpx 12rpx;
  border-radius: $radius-full;
  font-size: 20rpx;

  &.wechat {
    background: #D1FAE5;
    color: #059669;
  }

  &.alipay {
    background: #DBEAFE;
    color: #1D4ED8;
  }

  &.clipboard {
    background: #FEF3C7;
    color: #D97706;
  }
}

// 添加按钮
.add-btn-wrapper {
  position: fixed;
  right: $page-padding;
  bottom: calc(180rpx + $safe-area-bottom);
  z-index: $z-fixed;
}

.add-btn {
  width: 112rpx;
  height: 112rpx;
  @include flex-center;
  background: $primary-gradient;
  border-radius: $radius-round;
  box-shadow: $shadow-primary;
  @include press-effect;
}

.add-icon {
  font-size: 56rpx;
  color: $text-inverse;
  font-weight: 300;
}
</style>
