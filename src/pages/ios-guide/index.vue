<template>
  <view class="page">
    <!-- 顶部介绍 -->
    <view class="intro-section">
      <view class="intro-icon">
        <text>⚡</text>
      </view>
      <text class="intro-title">iOS 自动记账</text>
      <text class="intro-desc">通过快捷指令实现支付通知自动记账</text>
    </view>

    <!-- 步骤指引 -->
    <view class="steps-section">
      <view class="step-item" v-for="(step, index) in steps" :key="index">
        <view class="step-number">
          <text>{{ index + 1 }}</text>
        </view>
        <view class="step-content">
          <text class="step-title">{{ step.title }}</text>
          <text class="step-desc">{{ step.desc }}</text>
          <view class="step-image" v-if="step.image">
            <image :src="step.image" mode="aspectFit" />
          </view>
          <view class="step-action" v-if="step.action" @click="handleAction(step.action)">
            <text>{{ step.actionText }}</text>
            <text class="action-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <!-- URL Scheme 复制 -->
    <view class="url-section">
      <view class="url-header">
        <text class="url-title">URL Scheme</text>
        <view class="copy-btn" @click="copyUrlScheme">
          <text>复制</text>
        </view>
      </view>
      <view class="url-content">
        <text class="url-text" selectable>{{ urlScheme }}</text>
      </view>
      <text class="url-hint">在快捷指令中使用此链接打开App</text>
    </view>

    <!-- 快捷指令预设 -->
    <view class="preset-section">
      <text class="section-title">快速开始</text>
      <text class="section-desc">选择一个预设配置，一键导入快捷指令</text>
      
      <view class="preset-list">
        <view class="preset-item" @click="openPreset('wechat')">
          <view class="preset-icon wechat">
            <text>💚</text>
          </view>
          <view class="preset-info">
            <text class="preset-name">微信支付自动记账</text>
            <text class="preset-desc">收到微信支付通知时自动记录</text>
          </view>
          <text class="preset-arrow">›</text>
        </view>
        
        <view class="preset-item" @click="openPreset('alipay')">
          <view class="preset-icon alipay">
            <text>💙</text>
          </view>
          <view class="preset-info">
            <text class="preset-name">支付宝自动记账</text>
            <text class="preset-desc">收到支付宝通知时自动记录</text>
          </view>
          <text class="preset-arrow">›</text>
        </view>
        
        <view class="preset-item" @click="openPreset('both')">
          <view class="preset-icon both">
            <text>📱</text>
          </view>
          <view class="preset-info">
            <text class="preset-name">双平台自动记账</text>
            <text class="preset-desc">同时监听微信和支付宝通知</text>
          </view>
          <text class="preset-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 高级设置 -->
    <view class="advanced-section">
      <text class="section-title">高级设置</text>
      
      <view class="setting-item" @click="toggleAccessibility">
        <view class="setting-icon">
          <text>👁️</text>
        </view>
        <view class="setting-info">
          <text class="setting-name">无障碍朗读支持</text>
          <text class="setting-desc">开启后支持 VoiceOver 朗读</text>
        </view>
        <switch :checked="accessibilityEnabled" color="#10B981" />
      </view>
      
      <view class="setting-item" @click="goToShareExtension">
        <view class="setting-icon">
          <text>📤</text>
        </view>
        <view class="setting-info">
          <text class="setting-name">分享扩展</text>
          <text class="setting-desc">从其他App分享内容到账本</text>
        </view>
        <text class="setting-arrow">›</text>
      </view>
    </view>

    <!-- 常见问题 -->
    <view class="faq-section">
      <text class="section-title">常见问题</text>
      
      <view class="faq-list">
        <view 
          class="faq-item" 
          v-for="(faq, index) in faqs" 
          :key="index"
          @click="toggleFaq(index)"
        >
          <view class="faq-header">
            <text class="faq-question">{{ faq.question }}</text>
            <text class="faq-toggle">{{ faq.expanded ? '−' : '+' }}</text>
          </view>
          <view class="faq-answer" v-if="faq.expanded">
            <text>{{ faq.answer }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="footer-tip">
      <text class="tip-icon">🔒</text>
      <text class="tip-text">所有数据仅存储在您的设备本地，我们不会上传任何个人信息</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// URL Scheme
const urlScheme = ref('whereismymoney://add?text={通知内容}&source=wechat')

// 配置步骤
const steps = [
  {
    title: '打开快捷指令 App',
    desc: '在 iPhone 上找到并打开「快捷指令」应用',
    image: '',
    action: '',
    actionText: ''
  },
  {
    title: '创建自动化',
    desc: '点击底部「自动化」标签，然后点击右上角「+」创建新的自动化',
    image: '',
    action: '',
    actionText: ''
  },
  {
    title: '选择触发条件',
    desc: '选择「通知」作为触发条件，然后选择「微信」或「支付宝」',
    image: '',
    action: '',
    actionText: ''
  },
  {
    title: '添加打开URL操作',
    desc: '搜索并添加「打开 URL」操作，粘贴下方的 URL Scheme',
    image: '',
    action: 'copyUrl',
    actionText: '复制 URL'
  },
  {
    title: '关闭运行前询问',
    desc: '确保关闭「运行前询问」选项，这样自动化才能静默运行',
    image: '',
    action: '',
    actionText: ''
  }
]

// 无障碍设置
const accessibilityEnabled = ref(false)

// FAQ 数据
const faqs = reactive([
  {
    question: '为什么自动化没有触发？',
    answer: '请检查：1. 快捷指令 App 是否有通知权限；2. 自动化是否已启用；3.「运行前询问」是否已关闭。',
    expanded: false
  },
  {
    question: '如何过滤非支付通知？',
    answer: '在自动化中添加「如果」操作，设置条件为「通知内容包含 支付」，这样只有支付相关通知才会触发。',
    expanded: false
  },
  {
    question: 'App 没有收到数据怎么办？',
    answer: '请确保 URL Scheme 格式正确，并且 App 已正确安装。可以在 Safari 浏览器中直接访问 URL 测试。',
    expanded: false
  },
  {
    question: '支持哪些支付方式？',
    answer: '目前支持微信支付、支付宝两大主流支付平台，会自动识别支付金额和商户信息。',
    expanded: false
  }
])

// 方法
function copyUrlScheme() {
  uni.setClipboardData({
    data: urlScheme.value,
    success: () => {
      uni.showToast({ title: '已复制', icon: 'success' })
    }
  })
}

function handleAction(action: string) {
  if (action === 'copyUrl') {
    copyUrlScheme()
  }
}

function openPreset(type: string) {
  // 生成对应的快捷指令配置
  let presetUrl = ''
  
  switch (type) {
    case 'wechat':
      presetUrl = 'https://www.icloud.com/shortcuts/xxx' // 实际需要创建并发布快捷指令
      break
    case 'alipay':
      presetUrl = 'https://www.icloud.com/shortcuts/xxx'
      break
    case 'both':
      presetUrl = 'https://www.icloud.com/shortcuts/xxx'
      break
  }
  
  // 暂时显示手动配置提示
  uni.showModal({
    title: '手动配置',
    content: '请按照上方步骤手动配置快捷指令自动化，或直接使用扫描识图功能记账。',
    showCancel: false
  })
}

function toggleAccessibility() {
  accessibilityEnabled.value = !accessibilityEnabled.value
  uni.setStorageSync('accessibilityEnabled', accessibilityEnabled.value)
  
  if (accessibilityEnabled.value) {
    uni.showToast({ title: '已开启无障碍支持', icon: 'success' })
  }
}

function goToShareExtension() {
  uni.showModal({
    title: '分享扩展',
    content: '在其他 App 中选择分享，找到「我的账本」即可将支付信息分享到本应用。',
    showCancel: false
  })
}

function toggleFaq(index: number) {
  faqs[index].expanded = !faqs[index].expanded
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: calc(100rpx + $safe-area-bottom);
}

// 介绍区域
.intro-section {
  background: $primary-gradient;
  padding: $spacing-2xl $page-padding;
  text-align: center;
}

.intro-icon {
  width: 120rpx;
  height: 120rpx;
  @include flex-center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-round;
  margin: 0 auto $spacing-lg;
  font-size: 60rpx;
}

.intro-title {
  font-size: $font-xl;
  color: $text-inverse;
  font-weight: $font-semibold;
  display: block;
  margin-bottom: $spacing-sm;
}

.intro-desc {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.8);
}

// 步骤区域
.steps-section {
  padding: $spacing-lg $page-padding;
}

.step-item {
  display: flex;
  padding-bottom: $spacing-lg;
  
  &:not(:last-child) {
    border-left: 2rpx dashed $border-color;
    margin-left: 30rpx;
    padding-left: $spacing-lg;
  }
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  @include flex-center;
  background: $primary-gradient;
  border-radius: $radius-round;
  margin-left: -30rpx;
  margin-right: $spacing-lg;
  flex-shrink: 0;
  
  text {
    font-size: $font-md;
    color: $text-inverse;
    font-weight: $font-bold;
  }
}

.step-content {
  flex: 1;
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
}

.step-title {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
  display: block;
  margin-bottom: $spacing-xs;
}

.step-desc {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: $line-height-relaxed;
}

.step-image {
  margin-top: $spacing-md;
  border-radius: $radius-lg;
  overflow: hidden;
  
  image {
    width: 100%;
    height: 300rpx;
  }
}

.step-action {
  @include flex-between;
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: $primary-soft;
  border-radius: $radius-lg;
  
  text {
    font-size: $font-sm;
    color: $primary-color;
  }
  
  .action-arrow {
    font-size: $font-lg;
  }
}

// URL 区域
.url-section {
  margin: 0 $page-padding $spacing-lg;
  background: $bg-white;
  border-radius: $radius-xl;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}

.url-header {
  @include flex-between;
  margin-bottom: $spacing-md;
}

.url-title {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
}

.copy-btn {
  padding: 8rpx 20rpx;
  background: $primary-color;
  border-radius: $radius-full;
  
  text {
    font-size: $font-xs;
    color: $text-inverse;
  }
}

.url-content {
  padding: $spacing-md;
  background: $bg-grey;
  border-radius: $radius-lg;
  margin-bottom: $spacing-sm;
}

.url-text {
  font-size: $font-sm;
  color: $text-primary;
  font-family: monospace;
  word-break: break-all;
}

.url-hint {
  font-size: $font-xs;
  color: $text-secondary;
}

// 预设区域
.preset-section {
  padding: 0 $page-padding $spacing-lg;
}

.section-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-semibold;
  display: block;
  margin-bottom: $spacing-xs;
}

.section-desc {
  font-size: $font-sm;
  color: $text-secondary;
  display: block;
  margin-bottom: $spacing-lg;
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.preset-item {
  display: flex;
  align-items: center;
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  @include press-effect;
}

.preset-icon {
  width: 80rpx;
  height: 80rpx;
  @include flex-center;
  border-radius: $radius-lg;
  margin-right: $spacing-md;
  font-size: 40rpx;
  
  &.wechat {
    background: #D1FAE5;
  }
  
  &.alipay {
    background: #DBEAFE;
  }
  
  &.both {
    background: #E0E7FF;
  }
}

.preset-info {
  flex: 1;
}

.preset-name {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
  display: block;
  margin-bottom: 4rpx;
}

.preset-desc {
  font-size: $font-xs;
  color: $text-secondary;
}

.preset-arrow {
  font-size: $font-xl;
  color: $text-placeholder;
}

// 高级设置
.advanced-section {
  padding: 0 $page-padding $spacing-lg;
}

.setting-item {
  display: flex;
  align-items: center;
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $radius-xl;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-sm;
}

.setting-icon {
  width: 60rpx;
  height: 60rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;
  margin-right: $spacing-md;
  font-size: 32rpx;
}

.setting-info {
  flex: 1;
}

.setting-name {
  font-size: $font-md;
  color: $text-primary;
  display: block;
  margin-bottom: 4rpx;
}

.setting-desc {
  font-size: $font-xs;
  color: $text-secondary;
}

.setting-arrow {
  font-size: $font-xl;
  color: $text-placeholder;
}

// FAQ
.faq-section {
  padding: 0 $page-padding $spacing-lg;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.faq-item {
  background: $bg-white;
  border-radius: $radius-xl;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.faq-header {
  @include flex-between;
  padding: $spacing-lg;
}

.faq-question {
  font-size: $font-md;
  color: $text-primary;
  flex: 1;
  margin-right: $spacing-md;
}

.faq-toggle {
  font-size: $font-xl;
  color: $primary-color;
  font-weight: $font-medium;
}

.faq-answer {
  padding: 0 $spacing-lg $spacing-lg;
  border-top: 1rpx solid $border-light;
  margin-top: -$spacing-sm;
  padding-top: $spacing-md;
  
  text {
    font-size: $font-sm;
    color: $text-secondary;
    line-height: $line-height-relaxed;
  }
}

// 底部提示
.footer-tip {
  display: flex;
  align-items: flex-start;
  margin: $spacing-lg $page-padding;
  padding: $spacing-lg;
  background: $bg-grey;
  border-radius: $radius-xl;
}

.tip-icon {
  font-size: 32rpx;
  margin-right: $spacing-sm;
}

.tip-text {
  font-size: $font-sm;
  color: $text-secondary;
  line-height: $line-height-relaxed;
  flex: 1;
}
</style>
