<template>
  <view class="page">
    <!-- 通知监听设置 -->
    <view class="section">
      <view class="section-title">自动记账</view>
      <view class="setting-item" @click="toggleNotificationListener">
        <view class="setting-info">
          <text class="setting-label">通知监听</text>
          <text class="setting-desc">自动识别微信/支付宝支付通知</text>
        </view>
        <switch 
          :checked="notificationEnabled" 
          color="#4CAF50"
          @change="toggleNotificationListener"
        />
      </view>
      <view class="setting-item" @click="goToiOSGuide" v-if="isIOS">
        <view class="setting-info">
          <text class="setting-label">快捷指令配置</text>
          <text class="setting-desc">配置iOS快捷指令实现自动记账</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="setting-item" @click="testClipboard">
        <view class="setting-info">
          <text class="setting-label">剪贴板识别</text>
          <text class="setting-desc">从剪贴板识别支付信息</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
    
    <!-- 数据管理 -->
    <view class="section">
      <view class="section-title">数据管理</view>
      <view class="setting-item" @click="goToCategories">
        <view class="setting-info">
          <text class="setting-label">分类管理</text>
          <text class="setting-desc">管理收入/支出分类</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="setting-item" @click="goToAccounts">
        <view class="setting-info">
          <text class="setting-label">账户管理</text>
          <text class="setting-desc">管理支付账户</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="setting-item" @click="exportData">
        <view class="setting-info">
          <text class="setting-label">导出数据</text>
          <text class="setting-desc">导出账单为CSV文件</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="setting-item" @click="backupData">
        <view class="setting-info">
          <text class="setting-label">备份数据</text>
          <text class="setting-desc">备份所有数据到本地</text>
        </view>
        <text class="arrow">›</text>
      </view>
      <view class="setting-item" @click="restoreData">
        <view class="setting-info">
          <text class="setting-label">恢复数据</text>
          <text class="setting-desc">从备份文件恢复数据</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
    
    <!-- 关于 -->
    <view class="section">
      <view class="section-title">关于</view>
      <view class="setting-item">
        <view class="setting-info">
          <text class="setting-label">版本</text>
        </view>
        <text class="setting-value">1.0.0</text>
      </view>
      <view class="setting-item" @click="showPrivacyPolicy">
        <view class="setting-info">
          <text class="setting-label">隐私政策</text>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>
    
    <!-- 统计信息 -->
    <view class="stats-card">
      <view class="stats-item">
        <text class="stats-value">{{ totalTransactions }}</text>
        <text class="stats-label">总记录数</text>
      </view>
      <view class="stats-item">
        <text class="stats-value">{{ categoriesCount }}</text>
        <text class="stats-label">分类数</text>
      </view>
      <view class="stats-item">
        <text class="stats-value">{{ accountsCount }}</text>
        <text class="stats-label">账户数</text>
      </view>
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
const isIOS = ref(false)

// 计算属性
const totalTransactions = computed(() => store.transactions.length)
const categoriesCount = computed(() => store.categories.length)
const accountsCount = computed(() => store.accounts.length)

// 方法
function toggleNotificationListener() {
  // #ifdef APP-PLUS
  if (uni.getSystemInfoSync().platform === 'android') {
    if (!notificationEnabled.value) {
      // 请求通知监听权限
      uni.showModal({
        title: '开启通知监听',
        content: '需要授予通知访问权限才能自动识别支付通知。点击确定后将跳转到系统设置。',
        success: (res) => {
          if (res.confirm) {
            // 跳转到通知监听设置页面
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
  uni.showToast({ title: '请在App中使用此功能', icon: 'none' })
  // #endif
}

function goToiOSGuide() {
  uni.showModal({
    title: 'iOS 快捷指令配置',
    content: '1. 打开「快捷指令」App\n2. 创建新的自动化\n3. 选择「收到通知时」触发\n4. 选择微信或支付宝\n5. 添加「运行快捷指令」操作\n\n详细教程请访问官网。',
    showCancel: false
  })
}

async function testClipboard() {
  try {
    // #ifdef APP-PLUS
    const clipboardText = await new Promise<string>((resolve) => {
      uni.getClipboardData({
        success: (res) => resolve(res.data),
        fail: () => resolve('')
      })
    })
    // #endif
    
    // #ifdef H5
    const clipboardText = await navigator.clipboard.readText()
    // #endif
    
    if (!clipboardText) {
      uni.showToast({ title: '剪贴板为空', icon: 'none' })
      return
    }
    
    const paymentInfo = parsePaymentText(clipboardText)
    
    if (paymentInfo) {
      uni.showModal({
        title: '识别成功',
        content: `金额: ¥${paymentInfo.amount}\n商户: ${paymentInfo.merchant || '未知'}\n来源: ${paymentInfo.source}`,
        confirmText: '添加记录',
        success: async (res) => {
          if (res.confirm) {
            // 创建待确认记录
            const defaultCategory = store.expenseCategories[0]
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
          }
        }
      })
    } else {
      uni.showToast({ title: '未识别到支付信息', icon: 'none' })
    }
  } catch (e) {
    console.error('剪贴板读取失败', e)
    uni.showToast({ title: '读取剪贴板失败', icon: 'none' })
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
    success: async (res) => {
      if (res.confirm) {
        // #ifdef APP-PLUS
        // 选择文件
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

function showPrivacyPolicy() {
  uni.showModal({
    title: '隐私政策',
    content: '我的账本尊重并保护用户隐私。\n\n1. 所有数据仅存储在本地设备\n2. 通知监听仅用于识别支付信息\n3. 不会上传任何个人数据\n\n如有疑问，请联系我们。',
    showCancel: false
  })
}

onMounted(() => {
  // 检测平台
  const systemInfo = uni.getSystemInfoSync()
  isIOS.value = systemInfo.platform === 'ios'
  
  // 读取通知监听状态
  notificationEnabled.value = uni.getStorageSync('notificationEnabled') || false
})
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: 120rpx;
}

.section {
  background-color: $bg-white;
  margin: 20rpx;
  border-radius: $radius-lg;
  overflow: hidden;
}

.section-title {
  font-size: $font-sm;
  color: $text-secondary;
  padding: 24rpx 30rpx 12rpx;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid $border-light;
  
  &:last-child {
    border-bottom: none;
  }
}

.setting-info {
  flex: 1;
}

.setting-label {
  font-size: $font-md;
  color: $text-primary;
  display: block;
}

.setting-desc {
  font-size: $font-xs;
  color: $text-placeholder;
  margin-top: 6rpx;
  display: block;
}

.setting-value {
  font-size: $font-md;
  color: $text-secondary;
}

.arrow {
  font-size: 32rpx;
  color: $text-placeholder;
}

.stats-card {
  display: flex;
  background-color: $bg-white;
  margin: 20rpx;
  padding: 30rpx;
  border-radius: $radius-lg;
}

.stats-item {
  flex: 1;
  text-align: center;
}

.stats-value {
  font-size: $font-xxl;
  font-weight: 600;
  color: $primary-color;
  display: block;
}

.stats-label {
  font-size: $font-xs;
  color: $text-secondary;
  margin-top: 10rpx;
  display: block;
}
</style>
