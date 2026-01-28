<template>
  <view class="page">
    <!-- 头部说明 -->
    <view class="header">
      <view class="header-icon">
        <text>📷</text>
      </view>
      <text class="header-title">扫描识别</text>
      <text class="header-desc">拍照或选择截图，自动识别支付信息</text>
    </view>

    <!-- 预览区域 -->
    <view class="preview-area">
      <image 
        v-if="selectedImage" 
        :src="selectedImage" 
        mode="aspectFit" 
        class="preview-image"
        @click="previewImage"
      />
      <view v-else class="preview-placeholder" @click="chooseImage">
        <view class="placeholder-icon">
          <text>🖼️</text>
        </view>
        <text class="placeholder-text">点击选择图片</text>
        <text class="placeholder-hint">支持支付截图、账单截图等</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <view class="action-btn camera" @click="takePhoto">
        <text class="btn-icon">📸</text>
        <text class="btn-text">拍照</text>
      </view>
      <view class="action-btn album" @click="chooseFromAlbum">
        <text class="btn-icon">🖼️</text>
        <text class="btn-text">相册</text>
      </view>
      <view class="action-btn clipboard" @click="pasteFromClipboard">
        <text class="btn-icon">📋</text>
        <text class="btn-text">粘贴</text>
      </view>
    </view>

    <!-- 识别结果 -->
    <view class="result-section" v-if="scanResult">
      <view class="result-header">
        <text class="result-title">识别结果</text>
        <view class="result-status" :class="scanResult.success ? 'success' : 'error'">
          <text>{{ scanResult.success ? '识别成功' : '识别失败' }}</text>
        </view>
      </view>
      
      <view class="result-content" v-if="scanResult.success">
        <view class="result-item">
          <text class="item-label">金额</text>
          <view class="item-value amount">
            <text>¥{{ scanResult.amount.toFixed(2) }}</text>
          </view>
        </view>
        <view class="result-item" v-if="scanResult.merchant">
          <text class="item-label">商户</text>
          <text class="item-value">{{ scanResult.merchant }}</text>
        </view>
        <view class="result-item">
          <text class="item-label">类型</text>
          <view class="item-value type-tag" :class="scanResult.type">
            <text>{{ scanResult.type === 'income' ? '收入' : '支出' }}</text>
          </view>
        </view>
        <view class="result-item">
          <text class="item-label">来源</text>
          <view class="item-value source-tag" :class="scanResult.source">
            <text>{{ getSourceName(scanResult.source) }}</text>
          </view>
        </view>
        
        <!-- 原文本 -->
        <view class="raw-text" v-if="scanResult.rawText">
          <text class="raw-label">识别文本</text>
          <text class="raw-content">{{ scanResult.rawText }}</text>
        </view>
      </view>
      
      <view class="result-content error" v-else>
        <text class="error-text">未能识别有效的支付信息</text>
        <text class="error-hint">请尝试选择更清晰的截图</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="bottom-section" v-if="scanResult?.success">
      <button class="confirm-btn" @click="addTransaction">
        <text>添加到账本</text>
      </button>
      <button class="edit-btn" @click="editAndAdd">
        <text>编辑后添加</text>
      </button>
    </view>

    <!-- 使用说明 -->
    <view class="tips-section">
      <view class="tips-header">
        <text class="tips-icon">💡</text>
        <text class="tips-title">使用提示</text>
      </view>
      <view class="tips-list">
        <view class="tip-item">
          <text class="tip-dot">•</text>
          <text class="tip-text">支持微信、支付宝支付成功截图</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot">•</text>
          <text class="tip-text">支持银行账单短信截图</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot">•</text>
          <text class="tip-text">图片越清晰，识别越准确</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot">•</text>
          <text class="tip-text">iOS用户也可使用快捷指令自动记账</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view class="loading-overlay" v-if="isProcessing">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <text class="loading-text">识别中...</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import { parsePaymentText, recommendCategory } from '@/utils/parser'
import type { ParsedPaymentInfo, TransactionSource } from '@/types'

const store = useTransactionStore()

// 状态
const selectedImage = ref('')
const isProcessing = ref(false)
const scanResult = ref<ParsedPaymentInfo | null>(null)

// 方法
function takePhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      selectedImage.value = res.tempFilePaths[0]
      processImage(res.tempFilePaths[0])
    }
  })
}

function chooseFromAlbum() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album'],
    success: (res) => {
      selectedImage.value = res.tempFilePaths[0]
      processImage(res.tempFilePaths[0])
    }
  })
}

function chooseImage() {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      selectedImage.value = res.tempFilePaths[0]
      processImage(res.tempFilePaths[0])
    }
  })
}

function previewImage() {
  if (selectedImage.value) {
    uni.previewImage({
      urls: [selectedImage.value]
    })
  }
}

async function pasteFromClipboard() {
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
    
    isProcessing.value = true
    
    // 直接解析剪贴板文本
    const result = parsePaymentText(clipboardText)
    
    setTimeout(() => {
      isProcessing.value = false
      if (result) {
        scanResult.value = result
        uni.showToast({ title: '识别成功', icon: 'success' })
      } else {
        scanResult.value = { 
          source: 'clipboard',
          amount: 0,
          merchant: '',
          type: 'expense',
          rawText: clipboardText,
          success: false 
        } as any
        uni.showToast({ title: '未识别到支付信息', icon: 'none' })
      }
    }, 500)
    
  } catch (e) {
    uni.showToast({ title: '读取剪贴板失败', icon: 'none' })
  }
}

async function processImage(imagePath: string) {
  isProcessing.value = true
  scanResult.value = null
  
  try {
    // 调用 OCR 识别
    const text = await performOCR(imagePath)
    
    if (text) {
      const result = parsePaymentText(text)
      if (result) {
        scanResult.value = { ...result, success: true } as any
        uni.showToast({ title: '识别成功', icon: 'success' })
      } else {
        scanResult.value = {
          source: 'clipboard',
          amount: 0,
          merchant: '',
          type: 'expense',
          rawText: text,
          success: false
        } as any
      }
    } else {
      uni.showToast({ title: '图片识别失败', icon: 'none' })
    }
  } catch (e) {
    console.error('OCR 处理失败', e)
    uni.showToast({ title: '识别失败', icon: 'none' })
  } finally {
    isProcessing.value = false
  }
}

/**
 * OCR 文字识别
 * 在实际应用中，可以接入腾讯云 OCR、百度 OCR 等服务
 * 这里提供基于本地处理的模拟实现
 */
async function performOCR(imagePath: string): Promise<string> {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    // 使用原生 OCR 能力（如果有）
    // iOS 可以使用 Vision Framework
    // Android 可以使用 ML Kit
    
    // 这里模拟 OCR 处理延迟
    setTimeout(() => {
      // 实际项目中，这里应该调用真实的 OCR API
      // 示例：调用腾讯云 OCR
      // const result = await callTencentOCR(imagePath)
      // resolve(result)
      
      // 模拟返回空结果，提示用户使用剪贴板功能
      resolve('')
    }, 1500)
    // #endif
    
    // #ifdef H5
    // H5 环境可以使用 Tesseract.js 等库
    setTimeout(() => {
      resolve('')
    }, 1500)
    // #endif
  })
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

async function addTransaction() {
  if (!scanResult.value?.success) return
  
  const result = scanResult.value
  
  // 获取推荐分类
  const categoryName = recommendCategory(result.merchant)
  let categoryId = store.expenseCategories[0]?.id || 1
  
  if (categoryName) {
    const category = store.categories.find(c => c.name === categoryName && c.type === result.type)
    if (category) {
      categoryId = category.id!
    }
  }
  
  // 获取账户
  const accountName = result.source === 'wechat' ? '微信' : (result.source === 'alipay' ? '支付宝' : '现金')
  const account = store.accounts.find(a => a.name === accountName) || store.accounts[0]
  
  try {
    await store.addTransaction({
      type: result.type,
      amount: result.amount,
      categoryId,
      accountId: account?.id || 1,
      merchant: result.merchant,
      note: '',
      source: result.source,
      createdAt: new Date().toISOString(),
      confirmed: false // 添加到待确认
    })
    
    uni.showToast({ title: '已添加到待确认', icon: 'success' })
    
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/pending/index' })
    }, 1000)
  } catch (e) {
    uni.showToast({ title: '添加失败', icon: 'error' })
  }
}

function editAndAdd() {
  if (!scanResult.value?.success) return
  
  const result = scanResult.value
  const params = new URLSearchParams({
    amount: result.amount.toString(),
    merchant: result.merchant || '',
    type: result.type,
    source: result.source
  })
  
  uni.navigateTo({
    url: `/pages/add/index?${params.toString()}`
  })
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: calc(100rpx + $safe-area-bottom);
}

// 头部
.header {
  background: $primary-gradient;
  padding: $spacing-2xl $page-padding;
  text-align: center;
}

.header-icon {
  width: 120rpx;
  height: 120rpx;
  @include flex-center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-round;
  margin: 0 auto $spacing-lg;
  font-size: 60rpx;
}

.header-title {
  font-size: $font-xl;
  color: $text-inverse;
  font-weight: $font-semibold;
  display: block;
  margin-bottom: $spacing-sm;
}

.header-desc {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.8);
}

// 预览区域
.preview-area {
  margin: $spacing-lg $page-padding;
  background: $bg-white;
  border-radius: $radius-xl;
  overflow: hidden;
  box-shadow: $shadow-card;
}

.preview-image {
  width: 100%;
  height: 400rpx;
}

.preview-placeholder {
  height: 300rpx;
  @include flex-center;
  flex-direction: column;
}

.placeholder-icon {
  width: 100rpx;
  height: 100rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-round;
  margin-bottom: $spacing-md;
  font-size: 48rpx;
}

.placeholder-text {
  font-size: $font-md;
  color: $text-primary;
  margin-bottom: $spacing-xs;
}

.placeholder-hint {
  font-size: $font-xs;
  color: $text-placeholder;
}

// 操作按钮
.action-buttons {
  display: flex;
  gap: $spacing-md;
  padding: 0 $page-padding;
  margin-bottom: $spacing-lg;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg;
  background: $bg-white;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  @include press-effect;
}

.btn-icon {
  font-size: 48rpx;
  margin-bottom: $spacing-sm;
}

.btn-text {
  font-size: $font-sm;
  color: $text-primary;
}

// 识别结果
.result-section {
  margin: 0 $page-padding $spacing-lg;
  background: $bg-white;
  border-radius: $radius-xl;
  overflow: hidden;
  box-shadow: $shadow-card;
}

.result-header {
  @include flex-between;
  padding: $spacing-lg;
  border-bottom: 1rpx solid $border-light;
}

.result-title {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
}

.result-status {
  padding: 6rpx 16rpx;
  border-radius: $radius-full;
  font-size: $font-xs;

  &.success {
    background: $income-light;
    color: $income-color;
  }

  &.error {
    background: $expense-light;
    color: $expense-color;
  }
}

.result-content {
  padding: $spacing-lg;

  &.error {
    text-align: center;
    padding: $spacing-xl;
  }
}

.result-item {
  @include flex-between;
  padding: $spacing-md 0;
  border-bottom: 1rpx solid $border-light;

  &:last-child {
    border-bottom: none;
  }
}

.item-label {
  font-size: $font-sm;
  color: $text-secondary;
}

.item-value {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;

  &.amount {
    font-size: $font-xl;
    color: $primary-color;
  }
}

.type-tag {
  padding: 6rpx 16rpx;
  border-radius: $radius-full;
  font-size: $font-xs;

  &.income {
    background: $income-light;
    color: $income-color;
  }

  &.expense {
    background: $expense-light;
    color: $expense-color;
  }
}

.source-tag {
  padding: 6rpx 16rpx;
  border-radius: $radius-full;
  font-size: $font-xs;

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

.raw-text {
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background: $bg-grey;
  border-radius: $radius-lg;
}

.raw-label {
  font-size: $font-xs;
  color: $text-secondary;
  display: block;
  margin-bottom: $spacing-sm;
}

.raw-content {
  font-size: $font-sm;
  color: $text-primary;
  line-height: $line-height-relaxed;
}

.error-text {
  font-size: $font-md;
  color: $text-primary;
  display: block;
  margin-bottom: $spacing-sm;
}

.error-hint {
  font-size: $font-sm;
  color: $text-secondary;
}

// 底部操作
.bottom-section {
  padding: 0 $page-padding $spacing-lg;
}

.confirm-btn {
  width: 100%;
  padding: $spacing-lg 0;
  background: $primary-gradient;
  color: $text-inverse;
  font-size: $font-lg;
  font-weight: $font-medium;
  border-radius: $radius-xl;
  border: none;
  box-shadow: $shadow-primary;
  @include press-effect;
}

.edit-btn {
  width: 100%;
  padding: $spacing-md 0;
  margin-top: $spacing-md;
  background: transparent;
  color: $primary-color;
  font-size: $font-md;
  border: 2rpx solid $primary-color;
  border-radius: $radius-xl;
}

// 使用提示
.tips-section {
  margin: 0 $page-padding;
  padding: $spacing-lg;
  background: $bg-white;
  border-radius: $radius-xl;
}

.tips-header {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-md;
}

.tips-icon {
  font-size: 32rpx;
  margin-right: $spacing-sm;
}

.tips-title {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.tip-item {
  display: flex;
  align-items: flex-start;
}

.tip-dot {
  color: $primary-color;
  margin-right: $spacing-sm;
}

.tip-text {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: $line-height-normal;
}

// 加载状态
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex-center;
  z-index: $z-toast;
}

.loading-content {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl;
  background: $bg-white;
  border-radius: $radius-xl;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid $border-color;
  border-top-color: $primary-color;
  border-radius: $radius-round;
  animation: spin 0.8s linear infinite;
  margin-bottom: $spacing-md;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: $font-md;
  color: $text-primary;
}
</style>
