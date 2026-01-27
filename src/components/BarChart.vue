<template>
  <view class="bar-chart-container">
    <view class="chart-bars">
      <view 
        v-for="(item, index) in displayData" 
        :key="index"
        class="bar-item"
      >
        <view class="bar-wrapper">
          <view 
            class="bar expense" 
            :style="{ height: getBarHeight(item.expense) + 'rpx' }"
            v-if="showExpense && item.expense > 0"
          >
            <text class="bar-value" v-if="item.expense > 0">{{ formatValue(item.expense) }}</text>
          </view>
          <view 
            class="bar income" 
            :style="{ height: getBarHeight(item.income) + 'rpx' }"
            v-if="showIncome && item.income > 0"
          >
            <text class="bar-value" v-if="item.income > 0">{{ formatValue(item.income) }}</text>
          </view>
        </view>
        <text class="bar-label">{{ item.label }}</text>
      </view>
    </view>
    
    <view class="chart-legend" v-if="showLegend">
      <view class="legend-item" v-if="showExpense">
        <view class="legend-dot expense"></view>
        <text>支出</text>
      </view>
      <view class="legend-item" v-if="showIncome">
        <view class="legend-dot income"></view>
        <text>收入</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface BarData {
  label: string
  income: number
  expense: number
}

const props = withDefaults(defineProps<{
  data: BarData[]
  maxHeight?: number
  showExpense?: boolean
  showIncome?: boolean
  showLegend?: boolean
}>(), {
  maxHeight: 200,
  showExpense: true,
  showIncome: true,
  showLegend: true
})

// 只显示最近的数据
const displayData = computed(() => {
  return props.data.slice(-10) // 最多显示10条
})

// 计算最大值
const maxValue = computed(() => {
  let max = 0
  displayData.value.forEach(item => {
    if (props.showExpense) max = Math.max(max, item.expense)
    if (props.showIncome) max = Math.max(max, item.income)
  })
  return max || 1
})

// 计算柱状图高度
function getBarHeight(value: number): number {
  return (value / maxValue.value) * props.maxHeight
}

// 格式化数值
function formatValue(value: number): string {
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + 'w'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'k'
  }
  return value.toFixed(0)
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.bar-chart-container {
  padding: 20rpx 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  min-height: 280rpx;
  padding: 20rpx 0;
}

.bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 4rpx;
  min-height: 220rpx;
}

.bar {
  width: 24rpx;
  border-radius: 4rpx 4rpx 0 0;
  position: relative;
  min-height: 4rpx;
  transition: height 0.3s ease;
  
  &.expense {
    background: linear-gradient(180deg, #FF6B6B, #EE5A5A);
  }
  
  &.income {
    background: linear-gradient(180deg, #4CAF50, #43A047);
  }
}

.bar-value {
  position: absolute;
  top: -40rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 20rpx;
  color: $text-secondary;
  white-space: nowrap;
}

.bar-label {
  font-size: 22rpx;
  color: $text-secondary;
  margin-top: 12rpx;
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
    font-size: 24rpx;
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
