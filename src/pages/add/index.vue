<template>
  <view class="page">
    <!-- 类型切换 -->
    <view class="type-tabs">
      <view 
        class="type-tab" 
        :class="{ active: formData.type === 'expense' }"
        @click="formData.type = 'expense'"
      >
        <text>支出</text>
      </view>
      <view 
        class="type-tab" 
        :class="{ active: formData.type === 'income' }"
        @click="formData.type = 'income'"
      >
        <text>收入</text>
      </view>
    </view>
    
    <!-- 金额输入 -->
    <view class="amount-section">
      <text class="currency">¥</text>
      <input 
        class="amount-input"
        type="digit"
        v-model="amountInput"
        placeholder="0.00"
        :placeholder-style="'color: #cccccc'"
        @input="onAmountInput"
      />
    </view>
    
    <!-- 分类选择 -->
    <view class="section">
      <view class="section-title">选择分类</view>
      <view class="category-grid">
        <view 
          v-for="category in currentCategories" 
          :key="category.id"
          class="category-item"
          :class="{ active: formData.categoryId === category.id }"
          @click="selectCategory(category.id!)"
        >
          <view class="category-icon">
            <text>{{ category.icon }}</text>
          </view>
          <text class="category-name">{{ category.name }}</text>
        </view>
      </view>
    </view>
    
    <!-- 账户选择 -->
    <view class="section">
      <view class="section-title">账户</view>
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
    </view>
    
    <!-- 详细信息 -->
    <view class="section">
      <view class="form-item">
        <text class="form-label">商户</text>
        <input 
          class="form-input" 
          v-model="formData.merchant" 
          placeholder="可选，如：瑞幸咖啡"
        />
      </view>
      <view class="form-item">
        <text class="form-label">备注</text>
        <input 
          class="form-input" 
          v-model="formData.note" 
          placeholder="可选，添加备注"
        />
      </view>
      <view class="form-item" @click="showDatePicker">
        <text class="form-label">日期</text>
        <view class="form-value">
          <text>{{ formatDisplayDate(formData.createdAt) }}</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
    
    <!-- 保存按钮 -->
    <view class="action-section">
      <button class="save-btn" @click="saveTransaction">
        {{ isEdit ? '保存修改' : '保存' }}
      </button>
      <button v-if="isEdit" class="delete-btn" @click="deleteTransaction">
        删除
      </button>
    </view>
    
    <!-- 日期选择器 -->
    <picker 
      v-show="false"
      ref="datePickerRef"
      mode="date" 
      :value="datePickerValue"
      @change="onDateChange"
    />
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
const datePickerValue = ref(new Date().toISOString().split('T')[0])

// 计算属性
const currentCategories = computed(() => {
  return formData.value.type === 'expense' 
    ? store.expenseCategories 
    : store.incomeCategories
})

const accounts = computed(() => store.accounts)

// 监听类型变化，自动选择第一个分类
watch(() => formData.value.type, () => {
  if (currentCategories.value.length > 0 && !isEdit.value) {
    formData.value.categoryId = currentCategories.value[0].id!
  }
})

// 方法
function onAmountInput(e: any) {
  const value = e.detail.value
  // 限制只能输入数字和小数点
  const filtered = value.replace(/[^\d.]/g, '')
  // 限制小数点后两位
  const parts = filtered.split('.')
  if (parts.length > 2) {
    amountInput.value = parts[0] + '.' + parts[1]
  } else if (parts.length === 2 && parts[1].length > 2) {
    amountInput.value = parts[0] + '.' + parts[1].slice(0, 2)
  } else {
    amountInput.value = filtered
  }
  formData.value.amount = parseFloat(amountInput.value) || 0
}

function selectCategory(id: number) {
  formData.value.categoryId = id
}

function selectAccount(id: number) {
  formData.value.accountId = id
}

function showDatePicker() {
  // 使用 uni-app 的日期选择
  uni.showActionSheet({
    itemList: ['今天', '昨天', '选择日期'],
    success: (res) => {
      const now = new Date()
      if (res.tapIndex === 0) {
        setDate(now)
      } else if (res.tapIndex === 1) {
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        setDate(yesterday)
      } else {
        // 选择日期
        uni.showModal({
          title: '选择日期',
          editable: true,
          placeholderText: 'YYYY-MM-DD',
          success: (modalRes) => {
            if (modalRes.confirm && modalRes.content) {
              const date = new Date(modalRes.content)
              if (!isNaN(date.getTime())) {
                setDate(date)
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
  datePickerValue.value = date.toISOString().split('T')[0]
}

function onDateChange(e: any) {
  const date = new Date(e.detail.value)
  setDate(date)
}

function formatDisplayDate(isoString: string): string {
  const date = new Date(isoString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const dateStr = isoString.split('T')[0]
  if (dateStr === today.toISOString().split('T')[0]) {
    return '今天'
  } else if (dateStr === yesterday.toISOString().split('T')[0]) {
    return '昨天'
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
    content: '确定要删除这条记录吗？',
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
    // 新增模式，设置默认分类
    if (currentCategories.value.length > 0) {
      formData.value.categoryId = currentCategories.value[0].id!
    }
  }
})

async function loadTransaction(id: number) {
  const transaction = store.transactions.find(t => t.id === id)
  if (transaction) {
    formData.value = { ...transaction }
    amountInput.value = transaction.amount.toString()
    datePickerValue.value = transaction.createdAt.split('T')[0]
    
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
  padding-bottom: 40rpx;
}

.type-tabs {
  display: flex;
  background-color: $bg-white;
  padding: 20rpx;
}

.type-tab {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  font-size: $font-md;
  color: $text-secondary;
  border-radius: $radius-md;
  transition: all 0.3s;
  
  &.active {
    background-color: $primary-color;
    color: #ffffff;
  }
}

.amount-section {
  display: flex;
  align-items: center;
  background-color: $bg-white;
  padding: 40rpx 30rpx;
  margin-top: 20rpx;
}

.currency {
  font-size: $font-xxl;
  color: $text-primary;
  margin-right: 10rpx;
}

.amount-input {
  flex: 1;
  font-size: 80rpx;
  font-weight: 600;
  color: $text-primary;
}

.section {
  background-color: $bg-white;
  margin-top: 20rpx;
  padding: 30rpx;
}

.section-title {
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: 20rpx;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.category-item {
  width: calc(20% - 16rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 0;
  border-radius: $radius-md;
  transition: all 0.3s;
  
  &.active {
    background-color: rgba(76, 175, 80, 0.1);
    
    .category-icon {
      background-color: $primary-color;
    }
  }
}

.category-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: $bg-grey;
  border-radius: $radius-round;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-bottom: 10rpx;
  transition: all 0.3s;
}

.category-name {
  font-size: $font-xs;
  color: $text-secondary;
}

.account-list {
  display: flex;
  gap: 20rpx;
  overflow-x: auto;
}

.account-item {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: $bg-grey;
  border-radius: $radius-md;
  white-space: nowrap;
  transition: all 0.3s;
  
  &.active {
    background-color: $primary-color;
    
    .account-icon,
    .account-name {
      color: #ffffff;
    }
  }
}

.account-icon {
  font-size: 32rpx;
  margin-right: 10rpx;
}

.account-name {
  font-size: $font-sm;
  color: $text-primary;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $border-light;
  
  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  width: 120rpx;
  font-size: $font-md;
  color: $text-primary;
}

.form-input {
  flex: 1;
  font-size: $font-md;
  color: $text-primary;
  text-align: right;
}

.form-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  
  text {
    font-size: $font-md;
    color: $text-primary;
  }
  
  .arrow {
    margin-left: 10rpx;
    color: $text-placeholder;
  }
}

.action-section {
  padding: 40rpx 30rpx;
}

.save-btn {
  width: 100%;
  background-color: $primary-color;
  color: #ffffff;
  border: none;
  border-radius: $radius-md;
  padding: 28rpx 0;
  font-size: $font-lg;
}

.delete-btn {
  width: 100%;
  background-color: #ffffff;
  color: $danger-color;
  border: 2rpx solid $danger-color;
  border-radius: $radius-md;
  padding: 28rpx 0;
  font-size: $font-lg;
  margin-top: 20rpx;
}
</style>
