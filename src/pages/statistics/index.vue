<template>
  <view class="page">
    <!-- 月份选择 -->
    <view class="month-selector">
      <view class="month-arrow" @click="prevMonth">
        <text>‹</text>
      </view>
      <text class="month-text">{{ currentMonthText }}</text>
      <view class="month-arrow" @click="nextMonth">
        <text>›</text>
      </view>
    </view>
    
    <!-- 概览卡片 -->
    <view class="overview-card">
      <view class="overview-item">
        <text class="overview-label">总支出</text>
        <text class="overview-value expense">¥{{ formatMoney(stats.totalExpense) }}</text>
      </view>
      <view class="overview-divider"></view>
      <view class="overview-item">
        <text class="overview-label">总收入</text>
        <text class="overview-value income">¥{{ formatMoney(stats.totalIncome) }}</text>
      </view>
      <view class="overview-divider"></view>
      <view class="overview-item">
        <text class="overview-label">结余</text>
        <text class="overview-value" :class="stats.balance >= 0 ? 'income' : 'expense'">
          ¥{{ formatMoney(Math.abs(stats.balance)) }}
        </text>
      </view>
    </view>
    
    <!-- 分类统计 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">支出分类</text>
      </view>
      
      <view v-if="stats.categoryStats.length === 0" class="empty-state">
        <text>本月暂无支出记录</text>
      </view>
      
      <view v-else class="category-stats">
        <view 
          v-for="item in stats.categoryStats" 
          :key="item.categoryId"
          class="category-stat-item"
        >
          <view class="category-info">
            <text class="category-icon">{{ item.categoryIcon }}</text>
            <view class="category-detail">
              <text class="category-name">{{ item.categoryName }}</text>
              <text class="category-count">{{ item.count }}笔</text>
            </view>
          </view>
          <view class="category-progress">
            <view class="progress-bar">
              <view 
                class="progress-fill" 
                :style="{ width: item.percentage + '%' }"
              ></view>
            </view>
            <text class="category-percentage">{{ item.percentage.toFixed(1) }}%</text>
          </view>
          <text class="category-amount">¥{{ formatMoney(item.amount) }}</text>
        </view>
      </view>
    </view>
    
    <!-- 日统计 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">每日统计</text>
      </view>
      
      <view v-if="stats.dailyStats.length === 0" class="empty-state">
        <text>本月暂无记录</text>
      </view>
      
      <view v-else class="daily-chart">
        <view 
          v-for="day in stats.dailyStats" 
          :key="day.date"
          class="daily-bar"
        >
          <view class="bar-container">
            <view 
              class="bar expense-bar" 
              :style="{ height: getBarHeight(day.expense) + 'rpx' }"
            ></view>
            <view 
              class="bar income-bar" 
              :style="{ height: getBarHeight(day.income) + 'rpx' }"
            ></view>
          </view>
          <text class="day-label">{{ formatDayLabel(day.date) }}</text>
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
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import type { StatisticsData, CategoryStat, DailyStat } from '@/types'

const store = useTransactionStore()

// 当前选择的月份
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())

// 计算属性
const currentMonthText = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
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

// 获取最大日支出/收入，用于计算柱状图高度
const maxDailyAmount = computed(() => {
  let max = 0
  stats.value.dailyStats.forEach(day => {
    max = Math.max(max, day.income, day.expense)
  })
  return max || 1
})

// 方法
function formatMoney(amount: number): string {
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
  const now = new Date()
  if (currentYear.value === now.getFullYear() && currentMonth.value === now.getMonth()) {
    return // 不能超过当前月份
  }
  
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function getBarHeight(amount: number): number {
  const maxHeight = 200
  return (amount / maxDailyAmount.value) * maxHeight
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return date.getDate().toString()
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: 120rpx;
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  background-color: $bg-white;
}

.month-arrow {
  padding: 10rpx 30rpx;
  
  text {
    font-size: 48rpx;
    color: $text-secondary;
  }
}

.month-text {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
  padding: 0 40rpx;
}

.overview-card {
  display: flex;
  background-color: $bg-white;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: $radius-lg;
}

.overview-item {
  flex: 1;
  text-align: center;
}

.overview-label {
  font-size: $font-sm;
  color: $text-secondary;
  display: block;
  margin-bottom: 10rpx;
}

.overview-value {
  font-size: $font-xl;
  font-weight: 600;
}

.overview-divider {
  width: 1rpx;
  background-color: $border-color;
  margin: 0 10rpx;
}

.income {
  color: $income-color;
}

.expense {
  color: $expense-color;
}

.section {
  background-color: $bg-white;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: $radius-lg;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.empty-state {
  text-align: center;
  padding: 40rpx;
  
  text {
    font-size: $font-sm;
    color: $text-placeholder;
  }
}

.category-stats {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.category-stat-item {
  display: flex;
  align-items: center;
}

.category-info {
  display: flex;
  align-items: center;
  width: 180rpx;
}

.category-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.category-detail {
  display: flex;
  flex-direction: column;
}

.category-name {
  font-size: $font-sm;
  color: $text-primary;
}

.category-count {
  font-size: $font-xs;
  color: $text-placeholder;
}

.category-progress {
  flex: 1;
  display: flex;
  align-items: center;
  margin: 0 20rpx;
}

.progress-bar {
  flex: 1;
  height: 16rpx;
  background-color: $bg-grey;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: $expense-color;
  border-radius: 8rpx;
  transition: width 0.3s;
}

.category-percentage {
  font-size: $font-xs;
  color: $text-secondary;
  width: 80rpx;
  text-align: right;
}

.category-amount {
  font-size: $font-sm;
  color: $text-primary;
  font-weight: 600;
  width: 160rpx;
  text-align: right;
}

.daily-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 300rpx;
  padding-top: 20rpx;
}

.daily-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-container {
  display: flex;
  gap: 4rpx;
  align-items: flex-end;
  height: 220rpx;
}

.bar {
  width: 16rpx;
  border-radius: 4rpx;
  min-height: 4rpx;
}

.expense-bar {
  background-color: $expense-color;
}

.income-bar {
  background-color: $income-color;
}

.day-label {
  font-size: $font-xs;
  color: $text-secondary;
  margin-top: 10rpx;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  margin-top: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  
  text {
    font-size: $font-xs;
    color: $text-secondary;
  }
}

.legend-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
  
  &.income {
    background-color: $income-color;
  }
  
  &.expense {
    background-color: $expense-color;
  }
}
</style>
