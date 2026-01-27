<template>
  <view class="pie-chart-container">
    <canvas 
      canvas-id="pieChart" 
      :id="canvasId"
      class="pie-canvas"
      :style="{ width: size + 'rpx', height: size + 'rpx' }"
    ></canvas>
    <view class="chart-center" v-if="showCenter">
      <text class="center-value">{{ centerValue }}</text>
      <text class="center-label">{{ centerLabel }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

interface ChartData {
  name: string
  value: number
  color: string
}

const props = withDefaults(defineProps<{
  data: ChartData[]
  size?: number
  showCenter?: boolean
  centerValue?: string
  centerLabel?: string
}>(), {
  size: 400,
  showCenter: true,
  centerValue: '',
  centerLabel: ''
})

const canvasId = ref('pieChart_' + Math.random().toString(36).substr(2, 9))

// 绘制饼图
function drawPieChart() {
  if (!props.data || props.data.length === 0) return
  
  const ctx = uni.createCanvasContext(canvasId.value)
  const total = props.data.reduce((sum, item) => sum + item.value, 0)
  
  if (total === 0) return
  
  // 转换 rpx 到 px
  const systemInfo = uni.getSystemInfoSync()
  const ratio = systemInfo.windowWidth / 750
  const sizePx = props.size * ratio
  
  const centerX = sizePx / 2
  const centerY = sizePx / 2
  const radius = sizePx / 2 - 10
  const innerRadius = radius * 0.6 // 环形图内圆半径
  
  let startAngle = -Math.PI / 2 // 从顶部开始
  
  props.data.forEach(item => {
    const percentage = item.value / total
    const endAngle = startAngle + percentage * 2 * Math.PI
    
    // 绘制扇形
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.closePath()
    ctx.setFillStyle(item.color)
    ctx.fill()
    
    startAngle = endAngle
  })
  
  // 绘制中心白圆（形成环形图）
  if (props.showCenter) {
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI)
    ctx.setFillStyle('#ffffff')
    ctx.fill()
  }
  
  ctx.draw()
}

watch(() => props.data, () => {
  nextTick(() => {
    setTimeout(drawPieChart, 100)
  })
}, { deep: true })

onMounted(() => {
  setTimeout(drawPieChart, 300)
})
</script>

<style lang="scss" scoped>
.pie-chart-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-canvas {
  display: block;
}

.chart-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.center-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #333333;
}

.center-label {
  font-size: 24rpx;
  color: #999999;
  margin-top: 8rpx;
}
</style>
