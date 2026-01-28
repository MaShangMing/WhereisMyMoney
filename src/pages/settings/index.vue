<template>
  <view class="page">
    <!-- 用户信息卡片（简化版） -->
    <view class="user-card">
      <view class="user-avatar">
        <text>💰</text>
      </view>
      <view class="user-info">
        <text class="user-name">我的账本</text>
        <text class="user-desc">智能记账，轻松生活</text>
      </view>
      <view class="user-stats">
        <view class="stat-item">
          <text class="stat-value">{{ totalTransactions }}</text>
          <text class="stat-label">记录</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ totalDays }}</text>
          <text class="stat-label">天</text>
        </view>
      </view>
    </view>

    <!-- 自动记账 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">自动记账</text>
        <view class="section-badge new" v-if="isIOS">
          <text>NEW</text>
        </view>
      </view>

      <!-- Android 通知监听 -->
      <view class="setting-item" @click="toggleNotificationListener" v-if="!isIOS">
        <view class="setting-icon">
          <text>🔔</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">通知监听</text>
          <text class="setting-desc">自动识别微信/支付宝支付通知</text>
        </view>
        <switch
          :checked="notificationEnabled"
          color="#10B981"
          @change="toggleNotificationListener"
        />
      </view>

      <!-- iOS 快捷指令 -->
      <view class="setting-item" @click="goToiOSGuide" v-if="isIOS">
        <view class="setting-icon">
          <text>⚡</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">快捷指令配置</text>
          <text class="setting-desc">通过快捷指令实现自动记账</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <!-- 扫描识别 -->
      <view class="setting-item" @click="goToScan">
        <view class="setting-icon">
          <text>📷</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">扫描识别</text>
          <text class="setting-desc">拍照或选择截图识别支付信息</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <!-- 剪贴板识别 -->
      <view class="setting-item" @click="testClipboard">
        <view class="setting-icon">
          <text>📋</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">剪贴板识别</text>
          <text class="setting-desc">从剪贴板读取并识别支付信息</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">数据管理</text>
      </view>

      <view class="setting-item" @click="goToCategories">
        <view class="setting-icon">
          <text>📑</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">分类管理</text>
          <text class="setting-desc">管理收入/支出分类</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <view class="setting-item" @click="goToAccounts">
        <view class="setting-icon">
          <text>💳</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">账户管理</text>
          <text class="setting-desc">管理支付账户</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <view class="setting-item" @click="exportData">
        <view class="setting-icon">
          <text>📤</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">导出数据</text>
          <text class="setting-desc">导出账单为 CSV 文件</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <view class="setting-item" @click="backupData">
        <view class="setting-icon">
          <text>☁️</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">备份数据</text>
          <text class="setting-desc">备份所有数据到本地</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <view class="setting-item" @click="restoreData">
        <view class="setting-icon">
          <text>📥</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">恢复数据</text>
          <text class="setting-desc">从备份文件恢复数据</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>
    </view>

    <!-- 偏好设置 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">偏好设置</text>
      </view>

      <view class="setting-item" @click="toggleAccessibility">
        <view class="setting-icon">
          <text>👁️</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">无障碍模式</text>
          <text class="setting-desc">支持屏幕朗读器</text>
        </view>
        <switch
          :checked="accessibilityEnabled"
          color="#10B981"
          @change="toggleAccessibility"
        />
      </view>

      <view class="setting-item" @click="toggleHaptics">
        <view class="setting-icon">
          <text>📳</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">触觉反馈</text>
          <text class="setting-desc">操作时的振动反馈</text>
        </view>
        <switch
          :checked="hapticsEnabled"
          color="#10B981"
          @change="toggleHaptics"
        />
      </view>
    </view>

    <!-- 关于 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">关于</text>
      </view>

      <view class="setting-item">
        <view class="setting-icon">
          <text>📱</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">版本</text>
        </view>
        <text class="setting-value">v1.0.0</text>
      </view>

      <view class="setting-item" @click="showPrivacyPolicy">
        <view class="setting-icon">
          <text>🔒</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">隐私政策</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>

      <view class="setting-item" @click="showFeedback">
        <view class="setting-icon">
          <text>💬</text>
        </view>
        <view class="setting-content">
          <text class="setting-label">意见反馈</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="footer">
      <text class="footer-text">所有数据仅存储在您的设备本地</text>
      <text class="footer-text">Made with ❤️</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { exportToCSV, backupData as dbBackup, restoreData as dbRestore } from '@/utils/db'
import { parsePaymentText } from '@/utils/parser'

const store = useTransactionStore()

// 状态
const notificationEnabled = ref(false)
const accessibilityEnabled = ref(false)
const hapticsEnabled = ref(true)
const isIOS = ref(false)

// 计算属性
const totalTransactions = computed(() => store.transactions.length)
const totalDays = computed(() => {
  if (store.transactions.length === 0) return 0
  const dates = new Set(store.transactions.map(t => t.createdAt.split('T')[0]))
  return dates.size
})

// 方法
function toggleNotificationListener() {
  // #ifdef APP-PLUS
  if (uni.getSystemInfoSync().platform === 'android') {
    if (!notificationEnabled.value) {
      uni.showModal({
        title: '开启通知监听',
        content: '需要授予通知访问权限才能自动识别支付通知。点击确定后将跳转到系统设置。',
        success: (res) => {
          if (res.confirm) {
            plus.runtime.openURL('android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS')
          }
        }
      })
    } else {
      notificationEnabled.value = false
      uni.setStorageSync('notificationEnabled', false)
    }
  }
  // #endif

  // #ifdef H5
  uni.showToast({ title: '请在App中使用', icon: 'none' })
  // #endif
}

function goToiOSGuide() {
  uni.navigateTo({ url: '/pages/ios-guide/index' })
}

function goToScan() {
  uni.navigateTo({ url: '/pages/scan/index' })
}

async function testClipboard() {
  try {
    let clipboardText = ''

    // #ifdef APP-PLUS
    clipboardText = await new Promise<string>((resolve) => {
      uni.getClipboardData({
        success: (res) => resolve(res.data),
        fail: () => resolve('')
      })
    })
    // #endif

    // #ifdef H5
    clipboardText = await navigator.clipboard.readText()
    // #endif

    if (!clipboardText) {
      uni.showToast({ title: '剪贴板为空', icon: 'none' })
      return
    }

    const paymentInfo = parsePaymentText(clipboardText)

    if (paymentInfo) {
      uni.showModal({
        title: '识别成功',
        content: `金额: ¥${paymentInfo.amount.toFixed(2)}\n商户: ${paymentInfo.merchant || '未知'}\n类型: ${paymentInfo.type === 'income' ? '收入' : '支出'}`,
        confirmText: '添加记录',
        confirmColor: '#10B981',
        success: async (res) => {
          if (res.confirm) {
            const defaultCategory = paymentInfo.type === 'income'
              ? store.incomeCategories[0]
              : store.expenseCategories[0]
            const defaultAccount = store.accounts.find(a =>
              a.name === (paymentInfo.source === 'wechat' ? '微信' : '支付宝')
            ) || store.accounts[0]

            await store.addTransaction({
              type: paymentInfo.type,
              amount: paymentInfo.amount,
              categoryId: defaultCategory?.id || 1,
              accountId: defaultAccount?.id || 1,
              merchant: paymentInfo.merchant,
              note: '',
              source: paymentInfo.source,
              createdAt: new Date().toISOString(),
              confirmed: false
            })

            uni.showToast({ title: '已添加到待确认', icon: 'success' })
            setTimeout(() => {
              uni.navigateTo({ url: '/pages/pending/index' })
            }, 1000)
          }
        }
      })
    } else {
      uni.showToast({ title: '未识别到支付信息', icon: 'none' })
    }
  } catch (e) {
    console.error('剪贴板读取失败', e)
    uni.showToast({ title: '读取失败', icon: 'none' })
  }
}

function goToCategories() {
  uni.navigateTo({ url: '/pages/categories/index' })
}

function goToAccounts() {
  uni.navigateTo({ url: '/pages/accounts/index' })
}

async function exportData() {
  try {
    const csv = await exportToCSV()

    // #ifdef APP-PLUS
    const fileName = `账单导出_${new Date().toISOString().split('T')[0]}.csv`
    const filePath = `_doc/${fileName}`

    plus.io.resolveLocalFileSystemURL('_doc/', (entry: any) => {
      entry.getFile(fileName, { create: true }, (fileEntry: any) => {
        fileEntry.createWriter((writer: any) => {
          writer.write(csv)
          uni.showModal({
            title: '导出成功',
            content: `文件已保存到：${filePath}`,
            showCancel: false
          })
        })
      })
    })
    // #endif

    // #ifdef H5
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `账单导出_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    uni.showToast({ title: '导出成功', icon: 'success' })
    // #endif
  } catch (e) {
    console.error('导出失败', e)
    uni.showToast({ title: '导出失败', icon: 'error' })
  }
}

async function backupData() {
  try {
    const jsonData = await dbBackup()

    // #ifdef APP-PLUS
    const fileName = `账本备份_${new Date().toISOString().split('T')[0]}.json`

    plus.io.resolveLocalFileSystemURL('_doc/', (entry: any) => {
      entry.getFile(fileName, { create: true }, (fileEntry: any) => {
        fileEntry.createWriter((writer: any) => {
          writer.write(jsonData)
          uni.showModal({
            title: '备份成功',
            content: `备份文件：${fileName}`,
            showCancel: false
          })
        })
      })
    })
    // #endif

    // #ifdef H5
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `账本备份_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    uni.showToast({ title: '备份成功', icon: 'success' })
    // #endif
  } catch (e) {
    console.error('备份失败', e)
    uni.showToast({ title: '备份失败', icon: 'error' })
  }
}

async function restoreData() {
  uni.showModal({
    title: '恢复数据',
    content: '恢复数据将覆盖现有数据，确定继续吗？',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        // #ifdef APP-PLUS
        uni.showToast({ title: '请选择备份文件', icon: 'none' })
        // #endif

        // #ifdef H5
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e: any) => {
          const file = e.target.files[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = async (event) => {
              try {
                const jsonData = event.target?.result as string
                await dbRestore(jsonData)
                await store.loadTransactions()
                await store.loadCategories()
                await store.loadAccounts()
                uni.showToast({ title: '恢复成功', icon: 'success' })
              } catch (e) {
                uni.showToast({ title: '恢复失败', icon: 'error' })
              }
            }
            reader.readAsText(file)
          }
        }
        input.click()
        // #endif
      }
    }
  })
}

function toggleAccessibility() {
  accessibilityEnabled.value = !accessibilityEnabled.value
  uni.setStorageSync('accessibilityEnabled', accessibilityEnabled.value)

  if (accessibilityEnabled.value) {
    uni.showToast({ title: '已开启无障碍模式', icon: 'success' })
  }
}

function toggleHaptics() {
  hapticsEnabled.value = !hapticsEnabled.value
  uni.setStorageSync('hapticsEnabled', hapticsEnabled.value)
}

function showPrivacyPolicy() {
  uni.showModal({
    title: '隐私政策',
    content: '我的账本尊重并保护用户隐私。\n\n1. 所有数据仅存储在本地设备\n2. 通知监听仅用于识别支付信息\n3. 不会上传任何个人数据\n4. 您可以随时导出或删除数据\n\n如有疑问，请联系我们。',
    showCancel: false
  })
}

function showFeedback() {
  uni.showModal({
    title: '意见反馈',
    content: '如果您有任何建议或发现问题，欢迎通过以下方式联系我们：\n\n邮箱：feedback@example.com',
    showCancel: false
  })
}

onMounted(() => {
  // 检测平台
  const systemInfo = uni.getSystemInfoSync()
  isIOS.value = systemInfo.platform === 'ios'

  // 读取设置
  notificationEnabled.value = uni.getStorageSync('notificationEnabled') || false
  accessibilityEnabled.value = uni.getStorageSync('accessibilityEnabled') || false
  hapticsEnabled.value = uni.getStorageSync('hapticsEnabled') !== false
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: calc(120rpx + $safe-area-bottom);
}

// 用户卡片
.user-card {
  display: flex;
  align-items: center;
  background: $primary-gradient;
  margin: $spacing-lg $page-padding;
  padding: $spacing-xl;
  border-radius: $radius-2xl;
  box-shadow: $shadow-primary;
}

.user-avatar {
  width: 100rpx;
  height: 100rpx;
  @include flex-center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-xl;
  margin-right: $spacing-lg;
  font-size: 48rpx;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: $font-xl;
  color: $text-inverse;
  font-weight: $font-semibold;
  display: block;
  margin-bottom: 4rpx;
}

.user-desc {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.8);
}

.user-stats {
  display: flex;
  gap: $spacing-lg;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: $font-xl;
  color: $text-inverse;
  font-weight: $font-bold;
  display: block;
}

.stat-label {
  font-size: $font-xs;
  color: rgba(255, 255, 255, 0.8);
}

// 通用区域样式
.section {
  background: $bg-white;
  margin: 0 $page-padding $spacing-md;
  border-radius: $radius-2xl;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.section-header {
  display: flex;
  align-items: center;
  padding: $spacing-lg $spacing-lg $spacing-sm;
}

.section-title {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-semibold;
}

.section-badge {
  margin-left: $spacing-sm;
  padding: 4rpx 12rpx;
  border-radius: $radius-full;
  font-size: 20rpx;

  &.new {
    background: $expense-light;
    color: $expense-color;
  }
}

.setting-item {
  display: flex;
  align-items: center;
  padding: $spacing-md $spacing-lg;
  transition: background-color $transition-fast;

  &:active {
    background-color: $bg-grey;
  }
}

.setting-icon {
  width: 72rpx;
  height: 72rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;
  margin-right: $spacing-md;
  font-size: 32rpx;
}

.setting-content {
  flex: 1;
}

.setting-label {
  font-size: $font-md;
  color: $text-primary;
  display: block;
  margin-bottom: 4rpx;
}

.setting-desc {
  font-size: $font-xs;
  color: $text-placeholder;
}

.setting-value {
  font-size: $font-md;
  color: $text-secondary;
}

.setting-arrow {
  font-size: 32rpx;
  color: $text-placeholder;
}

// 底部信息
.footer {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl;
}

.footer-text {
  font-size: $font-xs;
  color: $text-placeholder;
  margin-bottom: $spacing-xs;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
