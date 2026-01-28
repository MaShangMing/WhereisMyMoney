<template>
  <view class="page" :class="{ 'keyboard-open': showCalculator }">
    <!-- 类型切换 -->
    <view class="type-switch">
      <view class="switch-track" :class="formData.type">
        <view
          class="switch-option"
          :class="{ active: formData.type === 'expense' }"
          @click="formData.type = 'expense'"
        >
          <text>支出</text>
        </view>
        <view
          class="switch-option"
          :class="{ active: formData.type === 'income' }"
          @click="formData.type = 'income'"
        >
          <text>收入</text>
        </view>
      </view>
    </view>

    <!-- 金额显示区域 -->
    <view class="amount-display" @click="showCalculator = true">
      <text class="currency-sign">¥</text>
      <view class="amount-value">
        <text class="amount-text" :class="{ placeholder: !amountInput }">
          {{ amountInput || '0.00' }}
        </text>
        <text class="cursor" v-if="showCalculator">|</text>
      </view>
      <view class="amount-hint" v-if="!showCalculator">
        <text>点击输入金额</text>
      </view>
    </view>

    <!-- 快捷金额选择 -->
    <view class="quick-amount" v-if="!showCalculator">
      <view
        v-for="amount in quickAmounts"
        :key="amount"
        class="quick-amount-item"
        @click="setQuickAmount(amount)"
      >
        <text>{{ amount }}</text>
      </view>
    </view>

    <!-- 分类选择 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">选择分类</text>
        <view class="section-action" @click="manageCategories">
          <text>管理</text>
        </view>
      </view>
      <scroll-view class="category-scroll" scroll-x>
        <view class="category-grid">
          <view
            v-for="category in currentCategories"
            :key="category.id"
            class="category-item"
            :class="{ active: formData.categoryId === category.id }"
            @click="selectCategory(category.id!)"
          >
            <view class="category-icon" :class="{ active: formData.categoryId === category.id }">
              <text>{{ category.icon }}</text>
            </view>
            <text class="category-name">{{ category.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 账户选择 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">账户</text>
      </view>
      <scroll-view class="account-scroll" scroll-x>
        <view class="account-list">
          <view
            v-for="account in accounts"
            :key="account.id"
            class="account-item"
            :class="{ active: formData.accountId === account.id }"
            @click="selectAccount(account.id!)"
          >
            <text class="account-icon">{{ account.icon }}</text>
            <text class="account-name">{{ account.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 详细信息 -->
    <view class="detail-section">
      <view class="detail-item" @click="focusMerchant">
        <view class="detail-icon">🏪</view>
        <view class="detail-content">
          <input
            ref="merchantInput"
            class="detail-input"
            v-model="formData.merchant"
            placeholder="商户名称（可选）"
            :placeholder-style="'color: #9CA3AF'"
            @focus="showCalculator = false"
          />
        </view>
      </view>
      <view class="detail-item" @click="focusNote">
        <view class="detail-icon">📝</view>
        <view class="detail-content">
          <input
            ref="noteInput"
            class="detail-input"
            v-model="formData.note"
            placeholder="添加备注（可选）"
            :placeholder-style="'color: #9CA3AF'"
            @focus="showCalculator = false"
          />
        </view>
      </view>
      <view class="detail-item" @click="showDatePicker">
        <view class="detail-icon">📅</view>
        <view class="detail-content">
          <text class="detail-value">{{ formatDisplayDate(formData.createdAt) }}</text>
        </view>
        <text class="detail-arrow">›</text>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="bottom-actions" v-if="!showCalculator">
      <button class="save-btn" :class="formData.type" @click="saveTransaction" :disabled="!canSave">
        <text>{{ isEdit ? '保存修改' : '保存' }}</text>
      </button>
      <button v-if="isEdit" class="delete-btn" @click="deleteTransaction">
        <text>删除记录</text>
      </button>
    </view>

    <!-- 计算器键盘 -->
    <view class="calculator-keyboard" :class="{ show: showCalculator }">
      <view class="keyboard-header">
        <view class="keyboard-date" @click="showDatePicker">
          <text class="date-icon">📅</text>
          <text class="date-text">{{ formatDisplayDate(formData.createdAt) }}</text>
        </view>
        <view class="keyboard-actions">
          <view class="keyboard-clear" @click="clearAmount">
            <text>C</text>
          </view>
        </view>
      </view>
      <view class="keyboard-body">
        <view class="keyboard-row">
          <view class="key" @click="inputKey('7')"><text>7</text></view>
          <view class="key" @click="inputKey('8')"><text>8</text></view>
          <view class="key" @click="inputKey('9')"><text>9</text></view>
          <view class="key operator" @click="inputKey('+')"><text>+</text></view>
        </view>
        <view class="keyboard-row">
          <view class="key" @click="inputKey('4')"><text>4</text></view>
          <view class="key" @click="inputKey('5')"><text>5</text></view>
          <view class="key" @click="inputKey('6')"><text>6</text></view>
          <view class="key operator" @click="inputKey('-')"><text>-</text></view>
        </view>
        <view class="keyboard-row">
          <view class="key" @click="inputKey('1')"><text>1</text></view>
          <view class="key" @click="inputKey('2')"><text>2</text></view>
          <view class="key" @click="inputKey('3')"><text>3</text></view>
          <view class="key backspace" @click="backspace">
            <text>⌫</text>
          </view>
        </view>
        <view class="keyboard-row">
          <view class="key zero" @click="inputKey('0')"><text>0</text></view>
          <view class="key" @click="inputKey('.')"><text>.</text></view>
          <view class="key confirm" :class="formData.type" @click="confirmAmount">
            <text>{{ hasOperator ? '=' : '完成' }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 背景遮罩 -->
    <view class="overlay" v-if="showCalculator" @click="confirmAmount"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useTransactionStore } from '@/stores/transaction'
import type { Transaction, TransactionType, Category } from '@/types'

const store = useTransactionStore()

// 表单数据
const formData = ref<Omit<Transaction, 'id'>>({
  type: 'expense',
  amount: 0,
  categoryId: 0,
  accountId: 1,
  merchant: '',
  note: '',
  source: 'manual',
  createdAt: new Date().toISOString(),
  confirmed: true
})

const amountInput = ref('')
const isEdit = ref(false)
const editId = ref<number | null>(null)
const showCalculator = ref(false)

// 快捷金额
const quickAmounts = [10, 20, 50, 100, 200, 500]

// 计算属性
const currentCategories = computed(() => {
  return formData.value.type === 'expense'
    ? store.expenseCategories
    : store.incomeCategories
})

const accounts = computed(() => store.accounts)

const canSave = computed(() => {
  return formData.value.amount > 0 && formData.value.categoryId > 0
})

const hasOperator = computed(() => {
  return amountInput.value.includes('+') || amountInput.value.includes('-')
})

// 监听类型变化，自动选择第一个分类
watch(() => formData.value.type, () => {
  if (currentCategories.value.length > 0 && !isEdit.value) {
    formData.value.categoryId = currentCategories.value[0].id!
  }
})

// 方法
function setQuickAmount(amount: number) {
  amountInput.value = amount.toString()
  formData.value.amount = amount
  // 触发震动反馈
  uni.vibrateShort({ type: 'light' })
}

function inputKey(key: string) {
  // 触发震动反馈
  uni.vibrateShort({ type: 'light' })

  // 处理运算符
  if (key === '+' || key === '-') {
    // 如果已有运算符，先计算
    if (hasOperator.value) {
      calculateResult()
    }
    if (amountInput.value && !amountInput.value.endsWith('+') && !amountInput.value.endsWith('-')) {
      amountInput.value += key
    }
    return
  }

  // 处理小数点
  if (key === '.') {
    const parts = amountInput.value.split(/[+\-]/)
    const lastPart = parts[parts.length - 1]
    if (lastPart.includes('.')) return
    if (!lastPart) {
      amountInput.value += '0.'
    } else {
      amountInput.value += '.'
    }
    return
  }

  // 处理数字
  const parts = amountInput.value.split(/[+\-]/)
  const lastPart = parts[parts.length - 1]
  
  // 限制小数位数
  if (lastPart.includes('.')) {
    const decimalPart = lastPart.split('.')[1]
    if (decimalPart && decimalPart.length >= 2) return
  }
  
  // 限制整数位数
  if (!lastPart.includes('.') && lastPart.length >= 8) return

  amountInput.value += key
  updateAmount()
}

function backspace() {
  uni.vibrateShort({ type: 'light' })
  if (amountInput.value.length > 0) {
    amountInput.value = amountInput.value.slice(0, -1)
    updateAmount()
  }
}

function clearAmount() {
  uni.vibrateShort({ type: 'medium' })
  amountInput.value = ''
  formData.value.amount = 0
}

function calculateResult() {
  if (!hasOperator.value) return

  try {
    // 简单计算（只支持加减）
    const result = eval(amountInput.value)
    if (!isNaN(result) && result >= 0) {
      amountInput.value = result.toFixed(2).replace(/\.?0+$/, '')
      formData.value.amount = parseFloat(amountInput.value)
    }
  } catch (e) {
    // 计算出错，忽略
  }
}

function updateAmount() {
  if (!hasOperator.value) {
    const amount = parseFloat(amountInput.value) || 0
    formData.value.amount = amount
  }
}

function confirmAmount() {
  if (hasOperator.value) {
    calculateResult()
  }
  showCalculator.value = false
  updateAmount()
}

function selectCategory(id: number) {
  formData.value.categoryId = id
  uni.vibrateShort({ type: 'light' })
}

function selectAccount(id: number) {
  formData.value.accountId = id
  uni.vibrateShort({ type: 'light' })
}

function manageCategories() {
  uni.navigateTo({ url: '/pages/categories/index' })
}

function focusMerchant() {
  showCalculator.value = false
}

function focusNote() {
  showCalculator.value = false
}

function showDatePicker() {
  showCalculator.value = false
  uni.showActionSheet({
    itemList: ['今天', '昨天', '前天', '选择其他日期'],
    success: (res) => {
      const now = new Date()
      if (res.tapIndex === 0) {
        setDate(now)
      } else if (res.tapIndex === 1) {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        setDate(yesterday)
      } else if (res.tapIndex === 2) {
        const dayBefore = new Date(now)
        dayBefore.setDate(dayBefore.getDate() - 2)
        setDate(dayBefore)
      } else {
        // 使用日期选择器
        uni.showModal({
          title: '选择日期',
          editable: true,
          placeholderText: 'YYYY-MM-DD 格式',
          success: (modalRes) => {
            if (modalRes.confirm && modalRes.content) {
              const date = new Date(modalRes.content)
              if (!isNaN(date.getTime())) {
                setDate(date)
              } else {
                uni.showToast({ title: '日期格式错误', icon: 'none' })
              }
            }
          }
        })
      }
    }
  })
}

function setDate(date: Date) {
  formData.value.createdAt = date.toISOString()
}

function formatDisplayDate(isoString: string): string {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const dayBefore = new Date(today)
  dayBefore.setDate(dayBefore.getDate() - 2)

  const dateStr = isoString.split('T')[0]
  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天'
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天'
  } else if (dateStr === dayBefore.toISOString().split('T')[0]) {
    return '前天'
  } else {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
}

async function saveTransaction() {
  // 验证
  if (formData.value.amount <= 0) {
    uni.showToast({ title: '请输入金额', icon: 'none' })
    return
  }

  if (!formData.value.categoryId) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }

  try {
    if (isEdit.value && editId.value) {
      await store.updateTransaction({ ...formData.value, id: editId.value })
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await store.addTransaction(formData.value)
      uni.showToast({ title: '保存成功', icon: 'success' })
    }

    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  } catch (e) {
    console.error('保存失败', e)
    uni.showToast({ title: '保存失败', icon: 'error' })
  }
}

async function deleteTransaction() {
  if (!editId.value) return

  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？此操作不可撤销。',
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm) {
        await store.deleteTransaction(editId.value!)
        uni.showToast({ title: '删除成功', icon: 'success' })
        setTimeout(() => {
          uni.navigateBack()
        }, 500)
      }
    }
  })
}

// 页面加载
onLoad((options) => {
  if (options?.id) {
    // 编辑模式
    isEdit.value = true
    editId.value = parseInt(options.id)
    loadTransaction(editId.value)
  } else {
    // 新增模式
    if (options?.type) {
      formData.value.type = options.type as TransactionType
    }
    // 设置默认分类
    if (currentCategories.value.length > 0) {
      formData.value.categoryId = currentCategories.value[0].id!
    }
    // 默认显示计算器
    setTimeout(() => {
      showCalculator.value = true
    }, 300)
  }
})

async function loadTransaction(id: number) {
  const transaction = store.transactions.find(t => t.id === id)
  if (transaction) {
    formData.value = { ...transaction }
    amountInput.value = transaction.amount.toString()

    // 设置页面标题
    uni.setNavigationBarTitle({ title: '编辑记录' })
  }
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: calc(200rpx + $safe-area-bottom);
  transition: padding-bottom $transition-normal;

  &.keyboard-open {
    padding-bottom: calc(520rpx + $safe-area-bottom);
  }
}

// 类型切换
.type-switch {
  padding: $spacing-lg $page-padding;
  background: $bg-white;
}

.switch-track {
  display: flex;
  background: $bg-grey;
  border-radius: $radius-full;
  padding: 6rpx;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    width: calc(50% - 6rpx);
    height: calc(100% - 12rpx);
    background: $bg-white;
    border-radius: $radius-full;
    transition: transform $transition-normal;
    box-shadow: $shadow-sm;
  }

  &.expense::before {
    transform: translateX(0);
    background: $expense-light;
  }

  &.income::before {
    transform: translateX(100%);
    background: $income-light;
  }
}

.switch-option {
  flex: 1;
  padding: $spacing-md 0;
  text-align: center;
  position: relative;
  z-index: 1;
  transition: color $transition-normal;

  text {
    font-size: $font-md;
    font-weight: $font-medium;
    color: $text-secondary;
  }

  &.active text {
    color: $text-primary;
    font-weight: $font-semibold;
  }
}

// 金额显示
.amount-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-2xl $page-padding;
  background: $bg-white;
  margin-top: 2rpx;
}

.currency-sign {
  font-size: $font-xxl;
  color: $text-primary;
  font-weight: $font-medium;
  margin-right: 8rpx;
}

.amount-value {
  display: flex;
  align-items: center;
}

.amount-text {
  font-size: 72rpx;
  font-weight: $font-bold;
  color: $text-primary;
  font-variant-numeric: tabular-nums;

  &.placeholder {
    color: $text-placeholder;
  }
}

.cursor {
  font-size: 72rpx;
  color: $primary-color;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.amount-hint {
  margin-left: $spacing-md;

  text {
    font-size: $font-xs;
    color: $text-placeholder;
  }
}

// 快捷金额
.quick-amount {
  display: flex;
  gap: $spacing-sm;
  padding: 0 $page-padding $spacing-lg;
  background: $bg-white;
  flex-wrap: wrap;
  justify-content: center;
}

.quick-amount-item {
  padding: $spacing-sm $spacing-lg;
  background: $bg-grey;
  border-radius: $radius-full;
  @include press-effect;

  text {
    font-size: $font-sm;
    color: $text-primary;
  }
}

// 分类区域
.section {
  background: $bg-white;
  margin-top: $spacing-md;
  padding: $spacing-lg $page-padding;
}

.section-header {
  @include flex-between;
  margin-bottom: $spacing-md;
}

.section-title {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
}

.section-action {
  padding: 8rpx 16rpx;

  text {
    font-size: $font-xs;
    color: $primary-color;
  }
}

.category-scroll {
  white-space: nowrap;
}

.category-grid {
  display: inline-flex;
  gap: $spacing-lg;
  padding-right: $spacing-lg;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120rpx;
  @include press-effect;
}

.category-icon {
  width: 88rpx;
  height: 88rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-xl;
  margin-bottom: $spacing-sm;
  font-size: 44rpx;
  transition: all $transition-normal;
  border: 3rpx solid transparent;

  &.active {
    background: $primary-soft;
    border-color: $primary-color;
  }
}

.category-name {
  font-size: $font-xs;
  color: $text-secondary;
  @include text-ellipsis;
  width: 100%;
  text-align: center;
}

// 账户选择
.account-scroll {
  white-space: nowrap;
}

.account-list {
  display: inline-flex;
  gap: $spacing-md;
}

.account-item {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-lg;
  background: $bg-grey;
  border-radius: $radius-full;
  border: 2rpx solid transparent;
  transition: all $transition-normal;
  @include press-effect;

  &.active {
    background: $primary-soft;
    border-color: $primary-color;
  }
}

.account-icon {
  font-size: 32rpx;
  margin-right: 8rpx;
}

.account-name {
  font-size: $font-sm;
  color: $text-primary;
}

// 详细信息
.detail-section {
  background: $bg-white;
  margin-top: $spacing-md;
}

.detail-item {
  display: flex;
  align-items: center;
  padding: $spacing-lg $page-padding;
  border-bottom: 1rpx solid $border-light;

  &:last-child {
    border-bottom: none;
  }
}

.detail-icon {
  width: 48rpx;
  font-size: 32rpx;
  margin-right: $spacing-md;
}

.detail-content {
  flex: 1;
}

.detail-input {
  width: 100%;
  font-size: $font-md;
  color: $text-primary;
}

.detail-value {
  font-size: $font-md;
  color: $text-primary;
}

.detail-arrow {
  font-size: 32rpx;
  color: $text-placeholder;
}

// 底部操作
.bottom-actions {
  padding: $spacing-lg $page-padding;
  background: $bg-white;
  margin-top: $spacing-md;
}

.save-btn {
  width: 100%;
  padding: $spacing-lg 0;
  border-radius: $radius-xl;
  font-size: $font-lg;
  font-weight: $font-medium;
  border: none;
  @include press-effect;

  &.expense {
    background: $expense-color;
    color: $text-inverse;
    box-shadow: $shadow-danger;
  }

  &.income {
    background: $income-color;
    color: $text-inverse;
    box-shadow: $shadow-primary;
  }

  &[disabled] {
    opacity: 0.5;
    box-shadow: none;
  }
}

.delete-btn {
  width: 100%;
  padding: $spacing-md 0;
  margin-top: $spacing-md;
  background: transparent;
  border: 2rpx solid $border-color;
  border-radius: $radius-xl;
  color: $danger-color;
  font-size: $font-md;
}

// 计算器键盘
.calculator-keyboard {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: $bg-white;
  border-radius: $radius-2xl $radius-2xl 0 0;
  box-shadow: 0 -8rpx 24rpx rgba(0, 0, 0, 0.1);
  transform: translateY(100%);
  transition: transform $transition-normal;
  z-index: $z-modal;
  padding-bottom: $safe-area-bottom;

  &.show {
    transform: translateY(0);
  }
}

.keyboard-header {
  @include flex-between;
  padding: $spacing-md $spacing-lg;
  border-bottom: 1rpx solid $border-light;
}

.keyboard-date {
  display: flex;
  align-items: center;
  padding: 8rpx 16rpx;
  background: $bg-grey;
  border-radius: $radius-full;
}

.date-icon {
  font-size: 28rpx;
  margin-right: 8rpx;
}

.date-text {
  font-size: $font-sm;
  color: $text-primary;
}

.keyboard-actions {
  display: flex;
  gap: $spacing-md;
}

.keyboard-clear {
  width: 64rpx;
  height: 64rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;

  text {
    font-size: $font-md;
    color: $text-secondary;
    font-weight: $font-medium;
  }
}

.keyboard-body {
  padding: $spacing-md;
}

.keyboard-row {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }
}

.key {
  flex: 1;
  height: 100rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;
  transition: all $transition-fast;

  text {
    font-size: $font-xl;
    color: $text-primary;
    font-weight: $font-medium;
  }

  &:active {
    background: darken(#F9FAFB, 5%);
    transform: scale(0.96);
  }

  &.operator {
    background: #E0E7FF;

    text {
      color: #4F46E5;
    }
  }

  &.backspace {
    background: $expense-light;

    text {
      color: $expense-color;
    }
  }

  &.zero {
    flex: 2;
  }

  &.confirm {
    &.expense {
      background: $expense-color;

      text {
        color: $text-inverse;
      }
    }

    &.income {
      background: $income-color;

      text {
        color: $text-inverse;
      }
    }
  }
}

// 遮罩
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: $z-modal-backdrop;
}
</style>
