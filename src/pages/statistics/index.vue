<template>
  <view class="page">
    <!-- 月份选择器 -->
    <view class="month-selector">
      <view class="month-arrow" @click="prevMonth">
        <text>‹</text>
      </view>
      <view class="month-display" @click="showMonthPicker">
        <text class="month-text">{{ currentMonthText }}</text>
        <text class="month-icon">▾</text>
      </view>
      <view class="month-arrow" @click="nextMonth" :class="{ disabled: !canGoNext }">
        <text>›</text>
      </view>
    </view>

    <!-- 概览卡片 -->
    <view class="overview-section">
      <view class="overview-card">
        <!-- 主要数据 -->
        <view class="overview-main">
          <view class="overview-item">
            <view class="item-header">
              <view class="item-dot expense"></view>
              <text class="item-label">支出</text>
            </view>
            <text class="item-value expense">¥{{ formatMoney(stats.totalExpense) }}</text>
          </view>
          <view class="overview-divider">
            <view class="divider-line"></view>
            <view class="divider-circle">
              <text>VS</text>
            </view>
            <view class="divider-line"></view>
          </view>
          <view class="overview-item">
            <view class="item-header">
              <view class="item-dot income"></view>
              <text class="item-label">收入</text>
            </view>
            <text class="item-value income">¥{{ formatMoney(stats.totalIncome) }}</text>
          </view>
        </view>

        <!-- 结余 -->
        <view class="overview-balance">
          <text class="balance-label">本月结余</text>
          <view class="balance-value" :class="stats.balance >= 0 ? 'positive' : 'negative'">
            <text class="balance-sign">{{ stats.balance >= 0 ? '+' : '' }}</text>
            <text class="balance-amount">¥{{ formatMoney(Math.abs(stats.balance)) }}</text>
          </view>
        </view>

        <!-- 进度条 -->
        <view class="overview-progress">
          <view class="progress-bar">
            <view
              class="progress-expense"
              :style="{ width: expensePercentage + '%' }"
            ></view>
            <view
              class="progress-income"
              :style="{ width: incomePercentage + '%' }"
            ></view>
          </view>
          <view class="progress-labels">
            <text class="progress-label expense">{{ expensePercentage.toFixed(0) }}%</text>
            <text class="progress-label income">{{ incomePercentage.toFixed(0) }}%</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 分类统计 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">支出分类</text>
        <view class="section-tabs">
          <view
            class="tab-item"
            :class="{ active: chartType === 'pie' }"
            @click="chartType = 'pie'"
          >
            <text>饼图</text>
          </view>
          <view
            class="tab-item"
            :class="{ active: chartType === 'bar' }"
            @click="chartType = 'bar'"
          >
            <text>条形</text>
          </view>
        </view>
      </view>

      <view v-if="stats.categoryStats.length === 0" class="empty-tip">
        <text class="empty-icon">📊</text>
        <text>本月暂无支出记录</text>
      </view>

      <!-- 饼图视图 -->
      <view v-else-if="chartType === 'pie'" class="pie-chart-view">
        <view class="pie-chart">
          <view class="pie-container">
            <view
              v-for="(item, index) in pieSegments"
              :key="index"
              class="pie-segment"
              :style="{
                background: `conic-gradient(transparent ${item.start}deg, ${item.color} ${item.start}deg ${item.end}deg, transparent ${item.end}deg)`
              }"
            ></view>
            <view class="pie-center">
              <text class="center-label">总支出</text>
              <text class="center-value">¥{{ formatMoney(stats.totalExpense) }}</text>
            </view>
          </view>
        </view>

        <view class="pie-legend">
          <view
            v-for="(item, index) in stats.categoryStats.slice(0, 6)"
            :key="item.categoryId"
            class="legend-item"
          >
            <view class="legend-dot" :style="{ backgroundColor: pieColors[index] }"></view>
            <text class="legend-name">{{ item.categoryName }}</text>
            <text class="legend-percent">{{ item.percentage.toFixed(1) }}%</text>
          </view>
        </view>
      </view>

      <!-- 条形图视图 -->
      <view v-else class="bar-chart-view">
        <view
          v-for="(item, index) in stats.categoryStats"
          :key="item.categoryId"
          class="bar-item"
          :style="{ animationDelay: index * 0.05 + 's' }"
        >
          <view class="bar-info">
            <view class="bar-left">
              <text class="bar-icon">{{ item.categoryIcon }}</text>
              <view class="bar-text">
                <text class="bar-name">{{ item.categoryName }}</text>
                <text class="bar-count">{{ item.count }}笔</text>
              </view>
            </view>
            <text class="bar-amount">¥{{ formatMoney(item.amount) }}</text>
          </view>
          <view class="bar-progress">
            <view
              class="bar-fill"
              :style="{
                width: item.percentage + '%',
                backgroundColor: pieColors[index % pieColors.length]
              }"
            ></view>
          </view>
          <text class="bar-percent">{{ item.percentage.toFixed(1) }}%</text>
        </view>
      </view>
    </view>

    <!-- 每日趋势 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">每日趋势</text>
      </view>

      <view v-if="stats.dailyStats.length === 0" class="empty-tip">
        <text class="empty-icon">📈</text>
        <text>本月暂无记录</text>
      </view>

      <view v-else class="daily-chart">
        <view class="chart-container">
          <view class="chart-bars">
            <view
              v-for="day in stats.dailyStats"
              :key="day.date"
              class="chart-bar-group"
            >
              <view class="bar-wrapper">
                <view
                  class="bar expense-bar"
                  :style="{ height: getBarHeight(day.expense) + 'rpx' }"
                ></view>
                <view
                  class="bar income-bar"
                  :style="{ height: getBarHeight(day.income) + 'rpx' }"
                ></view>
              </view>
              <text class="bar-date">{{ formatDayLabel(day.date) }}</text>
            </view>
          </view>
        </view>

        <view class="chart-legend">
          <view class="legend-item">
            <view class="legend-dot expense"></view>
            <text>支出</text>
          </view>
          <view class="legend-item">
            <view class="legend-dot income"></view>
            <text>收入</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 月度对比（简化版） -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">月度对比</text>
      </view>

      <view class="month-compare">
        <view class="compare-item">
          <text class="compare-label">上月支出</text>
          <text class="compare-value expense">¥{{ formatMoney(lastMonthExpense) }}</text>
        </view>
        <view class="compare-item">
          <text class="compare-label">本月支出</text>
          <text class="compare-value expense">¥{{ formatMoney(stats.totalExpense) }}</text>
        </view>
        <view class="compare-diff">
          <text class="diff-label">环比</text>
          <view class="diff-value" :class="monthDiff >= 0 ? 'up' : 'down'">
            <text class="diff-icon">{{ monthDiff >= 0 ? '↑' : '↓' }}</text>
            <text>{{ Math.abs(monthDiff).toFixed(1) }}%</text>
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
import type { StatisticsData, CategoryStat, DailyStat } from '@/types'

const store = useTransactionStore()

// 当前选择的月份
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const chartType = ref<'pie' | 'bar'>('bar')

// 饼图颜色
const pieColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  '#6366F1', '#84CC16'
]

// 计算属性
const currentMonthText = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const canGoNext = computed(() => {
  const now = new Date()
  return !(currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth())
})

// 计算指定月份的统计数据
const stats = computed((): StatisticsData => {
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
      const category = store.getCategoryById(categoryId)
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

// 上月支出
const lastMonthExpense = computed(() => {
  const lastMonth = new Date(currentYear.value, currentMonth.value - 1, 1)
  const startOfMonth = lastMonth.toISOString().split('T')[0]
  const endOfMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0]

  return store.confirmedTransactions
    .filter(t => {
      const date = t.createdAt.split('T')[0]
      return date >= startOfMonth && date <= endOfMonth && t.type === 'expense'
    })
    .reduce((sum, t) => sum + t.amount, 0)
})

// 月度差异
const monthDiff = computed(() => {
  if (lastMonthExpense.value === 0) return 0
  return ((stats.value.totalExpense - lastMonthExpense.value) / lastMonthExpense.value) * 100
})

// 支出/收入占比
const expensePercentage = computed(() => {
  const total = stats.value.totalExpense + stats.value.totalIncome
  if (total === 0) return 50
  return (stats.value.totalExpense / total) * 100
})

const incomePercentage = computed(() => {
  return 100 - expensePercentage.value
})

// 饼图分段
const pieSegments = computed(() => {
  const segments: { start: number; end: number; color: string }[] = []
  let currentAngle = 0

  stats.value.categoryStats.slice(0, 8).forEach((item, index) => {
    const angle = (item.percentage / 100) * 360
    segments.push({
      start: currentAngle,
      end: currentAngle + angle,
      color: pieColors[index % pieColors.length]
    })
    currentAngle += angle
  })

  return segments
})

// 获取最大日支出/收入
const maxDailyAmount = computed(() => {
  let max = 0
  stats.value.dailyStats.forEach(day => {
    max = Math.max(max, day.income, day.expense)
  })
  return max || 1
})

// 方法
function formatMoney(amount: number): string {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(2)
}

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

function getBarHeight(amount: number): number {
  const maxHeight = 180
  return (amount / maxDailyAmount.value) * maxHeight
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return date.getDate().toString()
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
  padding-bottom: calc(120rpx + $safe-area-bottom);
}

// 月份选择器
.month-selector {
  @include flex-center;
  padding: $spacing-lg;
  background: $bg-white;
}

.month-arrow {
  width: 72rpx;
  height: 72rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;
  @include press-effect;

  text {
    font-size: 44rpx;
    color: $text-secondary;
  }

  &.disabled {
    opacity: 0.3;
  }
}

.month-display {
  @include flex-center;
  padding: $spacing-md $spacing-xl;
  margin: 0 $spacing-md;
}

.month-text {
  font-size: $font-xl;
  color: $text-primary;
  font-weight: $font-semibold;
}

.month-icon {
  font-size: $font-md;
  color: $text-secondary;
  margin-left: $spacing-xs;
}

// 概览卡片
.overview-section {
  padding: $spacing-lg $page-padding;
}

.overview-card {
  background: $bg-white;
  border-radius: $radius-2xl;
  padding: $spacing-xl;
  box-shadow: $shadow-card;
}

.overview-main {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-xl;
}

.overview-item {
  flex: 1;
  text-align: center;
}

.item-header {
  @include flex-center;
  margin-bottom: $spacing-sm;
}

.item-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: $radius-round;
  margin-right: $spacing-xs;

  &.expense {
    background: $expense-color;
  }

  &.income {
    background: $income-color;
  }
}

.item-label {
  font-size: $font-sm;
  color: $text-secondary;
}

.item-value {
  font-size: $font-xxl;
  font-weight: $font-bold;

  &.expense {
    color: $expense-color;
  }

  &.income {
    color: $income-color;
  }
}

.overview-divider {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 $spacing-md;
}

.divider-line {
  width: 2rpx;
  height: 40rpx;
  background: $border-color;
}

.divider-circle {
  width: 60rpx;
  height: 60rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-round;
  margin: $spacing-xs 0;

  text {
    font-size: $font-xs;
    color: $text-placeholder;
  }
}

.overview-balance {
  @include flex-between;
  padding: $spacing-md $spacing-lg;
  background: $bg-grey;
  border-radius: $radius-lg;
  margin-bottom: $spacing-md;
}

.balance-label {
  font-size: $font-sm;
  color: $text-secondary;
}

.balance-value {
  display: flex;
  align-items: center;

  &.positive {
    color: $income-color;
  }

  &.negative {
    color: $expense-color;
  }
}

.balance-sign {
  font-size: $font-lg;
  margin-right: 4rpx;
}

.balance-amount {
  font-size: $font-lg;
  font-weight: $font-semibold;
}

.overview-progress {
  margin-top: $spacing-md;
}

.progress-bar {
  height: 16rpx;
  background: $bg-grey;
  border-radius: $radius-full;
  overflow: hidden;
  display: flex;
}

.progress-expense {
  height: 100%;
  background: $expense-color;
  transition: width $transition-slow;
}

.progress-income {
  height: 100%;
  background: $income-color;
  transition: width $transition-slow;
}

.progress-labels {
  @include flex-between;
  margin-top: $spacing-xs;
}

.progress-label {
  font-size: $font-xs;

  &.expense {
    color: $expense-color;
  }

  &.income {
    color: $income-color;
  }
}

// 通用区域样式
.section {
  background: $bg-white;
  margin: $spacing-md $page-padding;
  padding: $spacing-lg;
  border-radius: $radius-2xl;
  box-shadow: $shadow-sm;
}

.section-header {
  @include flex-between;
  margin-bottom: $spacing-lg;
}

.section-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-semibold;
}

.section-tabs {
  display: flex;
  background: $bg-grey;
  border-radius: $radius-full;
  padding: 4rpx;
}

.tab-item {
  padding: $spacing-xs $spacing-md;
  border-radius: $radius-full;
  transition: all $transition-fast;

  text {
    font-size: $font-xs;
    color: $text-secondary;
  }

  &.active {
    background: $bg-white;
    box-shadow: $shadow-xs;

    text {
      color: $primary-color;
      font-weight: $font-medium;
    }
  }
}

.empty-tip {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-2xl;

  .empty-icon {
    font-size: 60rpx;
    margin-bottom: $spacing-md;
  }

  text {
    font-size: $font-sm;
    color: $text-placeholder;
  }
}

// 饼图视图
.pie-chart-view {
  display: flex;
  gap: $spacing-lg;
}

.pie-chart {
  width: 280rpx;
  flex-shrink: 0;
}

.pie-container {
  position: relative;
  width: 280rpx;
  height: 280rpx;
}

.pie-segment {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: $radius-round;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160rpx;
  height: 160rpx;
  background: $bg-white;
  border-radius: $radius-round;
  @include flex-center;
  flex-direction: column;
}

.center-label {
  font-size: $font-xs;
  color: $text-secondary;
}

.center-value {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-semibold;
}

.pie-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.legend-item {
  display: flex;
  align-items: center;
}

.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: $radius-xs;
  margin-right: $spacing-sm;
}

.legend-name {
  flex: 1;
  font-size: $font-sm;
  color: $text-primary;
}

.legend-percent {
  font-size: $font-sm;
  color: $text-secondary;
}

// 条形图视图
.bar-chart-view {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.bar-item {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

.bar-info {
  @include flex-between;
  margin-bottom: $spacing-xs;
}

.bar-left {
  display: flex;
  align-items: center;
}

.bar-icon {
  font-size: 36rpx;
  margin-right: $spacing-sm;
}

.bar-text {
  display: flex;
  flex-direction: column;
}

.bar-name {
  font-size: $font-md;
  color: $text-primary;
}

.bar-count {
  font-size: $font-xs;
  color: $text-placeholder;
}

.bar-amount {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
}

.bar-progress {
  height: 20rpx;
  background: $bg-grey;
  border-radius: $radius-full;
  overflow: hidden;
  margin-bottom: 4rpx;
}

.bar-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width $transition-slow;
}

.bar-percent {
  font-size: $font-xs;
  color: $text-secondary;
}

// 每日趋势
.daily-chart {
  overflow-x: auto;
}

.chart-container {
  min-width: 100%;
  padding-bottom: $spacing-md;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 260rpx;
  gap: $spacing-xs;
}

.chart-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-wrapper {
  display: flex;
  gap: 4rpx;
  align-items: flex-end;
  height: 200rpx;
}

.bar {
  width: 20rpx;
  border-radius: $radius-xs;
  min-height: 4rpx;
  transition: height $transition-slow;

  &.expense-bar {
    background: $expense-color;
  }

  &.income-bar {
    background: $income-color;
  }
}

.bar-date {
  font-size: 20rpx;
  color: $text-secondary;
  margin-top: $spacing-xs;
}

.chart-legend {
  @include flex-center;
  gap: $spacing-xl;
  padding-top: $spacing-md;
  border-top: 1rpx solid $border-light;

  .legend-item {
    display: flex;
    align-items: center;

    text {
      font-size: $font-xs;
      color: $text-secondary;
    }
  }

  .legend-dot {
    width: 20rpx;
    height: 20rpx;
    border-radius: $radius-xs;
    margin-right: $spacing-xs;

    &.expense {
      background: $expense-color;
    }

    &.income {
      background: $income-color;
    }
  }
}

// 月度对比
.month-compare {
  display: flex;
  align-items: center;
}

.compare-item {
  flex: 1;
  text-align: center;
  padding: $spacing-md;
}

.compare-label {
  font-size: $font-xs;
  color: $text-secondary;
  display: block;
  margin-bottom: $spacing-xs;
}

.compare-value {
  font-size: $font-lg;
  font-weight: $font-semibold;

  &.expense {
    color: $expense-color;
  }
}

.compare-diff {
  padding: $spacing-md $spacing-lg;
  background: $bg-grey;
  border-radius: $radius-lg;
}

.diff-label {
  font-size: $font-xs;
  color: $text-secondary;
  display: block;
  margin-bottom: $spacing-xs;
}

.diff-value {
  display: flex;
  align-items: center;
  font-size: $font-md;
  font-weight: $font-semibold;

  &.up {
    color: $expense-color;
  }

  &.down {
    color: $income-color;
  }
}

.diff-icon {
  margin-right: 4rpx;
}
</style>
