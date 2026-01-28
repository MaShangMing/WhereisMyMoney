<template>
  <view class="page">
    <!-- 总资产卡片 -->
    <view class="total-card">
      <view class="total-bg"></view>
      <view class="total-content">
        <text class="total-label">总资产</text>
        <view class="total-value">
          <text class="currency">¥</text>
          <text class="amount" :class="totalBalance >= 0 ? 'positive' : 'negative'">
            {{ formatMoney(Math.abs(totalBalance)) }}
          </text>
        </view>
        <view class="total-hint">
          <text>共 {{ accounts.length }} 个账户</text>
        </view>
      </view>
    </view>

    <!-- 账户列表 -->
    <view class="account-list">
      <view class="list-header">
        <text class="list-title">我的账户</text>
      </view>

      <view
        v-for="account in accounts"
        :key="account.id"
        class="account-card"
        @click="editAccount(account)"
        @longpress="showAccountActions(account)"
      >
        <view class="card-left">
          <view class="account-icon">
            <text>{{ account.icon }}</text>
          </view>
          <view class="account-info">
            <text class="account-name">{{ account.name }}</text>
            <text class="account-type">支付账户</text>
          </view>
        </view>
        <view class="card-right">
          <text class="account-balance" :class="account.balance >= 0 ? 'positive' : 'negative'">
            ¥{{ formatMoney(account.balance) }}
          </text>
          <text class="account-arrow">›</text>
        </view>
      </view>

      <!-- 添加账户按钮 -->
      <view class="add-card" @click="showAddDialog">
        <view class="add-icon">
          <text>+</text>
        </view>
        <text class="add-text">添加新账户</text>
      </view>
    </view>

    <!-- 编辑弹窗 -->
    <view class="popup-overlay" v-if="showEdit" @click="closeEdit">
      <view class="popup-container" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ isEditing ? '编辑账户' : '添加账户' }}</text>
          <view class="popup-close" @click="closeEdit">
            <text>×</text>
          </view>
        </view>

        <view class="popup-body">
          <!-- 预览 -->
          <view class="preview-section">
            <view class="preview-icon">
              <text>{{ editForm.icon }}</text>
            </view>
            <text class="preview-name">{{ editForm.name || '账户名称' }}</text>
            <text class="preview-balance">¥{{ formatMoney(parseFloat(balanceInput) || 0) }}</text>
          </view>

          <!-- 图标选择 -->
          <view class="form-section">
            <text class="form-label">选择图标</text>
            <view class="icon-grid">
              <view
                v-for="icon in iconOptions"
                :key="icon"
                class="icon-option"
                :class="{ active: editForm.icon === icon }"
                @click="editForm.icon = icon"
              >
                <text>{{ icon }}</text>
              </view>
            </view>
          </view>

          <!-- 名称输入 -->
          <view class="form-section">
            <text class="form-label">账户名称</text>
            <input
              class="form-input"
              v-model="editForm.name"
              placeholder="请输入账户名称"
              :placeholder-style="'color: #9CA3AF'"
              maxlength="10"
            />
          </view>

          <!-- 余额输入 -->
          <view class="form-section">
            <text class="form-label">账户余额</text>
            <view class="balance-input-wrapper">
              <text class="balance-currency">¥</text>
              <input
                class="balance-input"
                type="digit"
                v-model="balanceInput"
                placeholder="0.00"
                :placeholder-style="'color: #9CA3AF'"
              />
            </view>
          </view>
        </view>

        <view class="popup-footer">
          <button class="btn cancel" @click="closeEdit">取消</button>
          <button class="btn confirm" @click="saveAccount">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import type { Account } from '@/types'

const store = useTransactionStore()

// 状态
const showEdit = ref(false)
const isEditing = ref(false)
const editForm = ref<Partial<Account>>({
  name: '',
  icon: '💳',
  balance: 0
})
const balanceInput = ref('')

// 图标选项
const iconOptions = [
  '💵', '💴', '💶', '💷', '💰', '🪙',
  '💳', '💎', '🏦', '🏧', '💹', '📈',
  '💚', '💙', '❤️', '💛', '🧡', '💜',
  '🏠', '🚗', '✈️', '🎮', '📱', '💻'
]

// 计算属性
const accounts = computed(() => store.accounts)

const totalBalance = computed(() => {
  return accounts.value.reduce((sum, account) => sum + account.balance, 0)
})

// 方法
function formatMoney(amount: number): string {
  if (Math.abs(amount) >= 10000) {
    return (amount / 10000).toFixed(2) + '万'
  }
  return amount.toFixed(2)
}

function showAddDialog() {
  isEditing.value = false
  editForm.value = {
    name: '',
    icon: '💳',
    balance: 0
  }
  balanceInput.value = ''
  showEdit.value = true
}

function editAccount(account: Account) {
  isEditing.value = true
  editForm.value = { ...account }
  balanceInput.value = account.balance.toString()
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
  editForm.value = { name: '', icon: '💳', balance: 0 }
  balanceInput.value = ''
}

async function saveAccount() {
  if (!editForm.value.name?.trim()) {
    uni.showToast({ title: '请输入账户名称', icon: 'none' })
    return
  }

  editForm.value.balance = parseFloat(balanceInput.value) || 0

  try {
    if (isEditing.value && editForm.value.id) {
      await store.updateAccount(editForm.value as Account)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await store.addAccount({
        name: editForm.value.name!,
        icon: editForm.value.icon!,
        balance: editForm.value.balance!
      })
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    closeEdit()
  } catch (e) {
    console.error('保存失败', e)
    uni.showToast({ title: '保存失败', icon: 'error' })
  }
}

function showAccountActions(account: Account) {
  uni.showActionSheet({
    itemList: ['编辑', '删除'],
    success: async (res) => {
      if (res.tapIndex === 0) {
        editAccount(account)
      } else if (res.tapIndex === 1) {
        deleteAccount(account)
      }
    }
  })
}

async function deleteAccount(account: Account) {
  const hasTransactions = store.transactions.some(t => t.accountId === account.id)

  if (hasTransactions) {
    uni.showModal({
      title: '无法删除',
      content: '该账户下有交易记录，无法删除。请先删除相关记录或修改其账户。',
      showCancel: false
    })
    return
  }

  uni.showModal({
    title: '确认删除',
    content: `确定要删除账户"${account.name}"吗？`,
    confirmColor: '#EF4444',
    success: async (res) => {
      if (res.confirm && account.id) {
        await store.deleteAccount(account.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
      }
    }
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

// 总资产卡片
.total-card {
  position: relative;
  margin: $spacing-lg $page-padding;
  padding: $spacing-2xl;
  border-radius: $radius-2xl;
  overflow: hidden;
}

.total-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: $primary-gradient;
}

.total-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

.total-label {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-bottom: $spacing-sm;
}

.total-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-bottom: $spacing-md;
}

.currency {
  font-size: $font-xl;
  color: $text-inverse;
  margin-right: 8rpx;
}

.amount {
  font-size: $font-3xl;
  font-weight: $font-bold;
  color: $text-inverse;

  &.positive {
    color: $text-inverse;
  }

  &.negative {
    color: #FCA5A5;
  }
}

.total-hint {
  text {
    font-size: $font-xs;
    color: rgba(255, 255, 255, 0.7);
  }
}

// 账户列表
.account-list {
  padding: 0 $page-padding;
}

.list-header {
  margin-bottom: $spacing-md;
}

.list-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-semibold;
}

.account-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $radius-xl;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-sm;
  @include press-effect;
}

.card-left {
  display: flex;
  align-items: center;
}

.account-icon {
  width: 88rpx;
  height: 88rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-xl;
  margin-right: $spacing-md;
  font-size: 44rpx;
}

.account-info {
  display: flex;
  flex-direction: column;
}

.account-name {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-medium;
  margin-bottom: 4rpx;
}

.account-type {
  font-size: $font-xs;
  color: $text-placeholder;
}

.card-right {
  display: flex;
  align-items: center;
}

.account-balance {
  font-size: $font-xl;
  font-weight: $font-semibold;
  margin-right: $spacing-sm;

  &.positive {
    color: $income-color;
  }

  &.negative {
    color: $expense-color;
  }
}

.account-arrow {
  font-size: 32rpx;
  color: $text-placeholder;
}

// 添加卡片
.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-white;
  padding: $spacing-xl;
  border-radius: $radius-xl;
  border: 2rpx dashed $border-color;
  @include press-effect;
}

.add-icon {
  width: 64rpx;
  height: 64rpx;
  @include flex-center;
  background: $primary-soft;
  border-radius: $radius-lg;
  margin-right: $spacing-md;

  text {
    font-size: $font-xl;
    color: $primary-color;
    font-weight: 300;
  }
}

.add-text {
  font-size: $font-md;
  color: $primary-color;
}

// 弹窗
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  @include flex-center;
  z-index: $z-modal;
}

.popup-container {
  width: 90%;
  max-width: 640rpx;
  background: $bg-white;
  border-radius: $radius-2xl;
  overflow: hidden;
  animation: popIn 0.25s ease-out;
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.popup-header {
  @include flex-between;
  padding: $spacing-lg;
  border-bottom: 1rpx solid $border-light;
}

.popup-title {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-semibold;
}

.popup-close {
  width: 60rpx;
  height: 60rpx;
  @include flex-center;

  text {
    font-size: 48rpx;
    color: $text-secondary;
  }
}

.popup-body {
  padding: $spacing-lg;
  max-height: 60vh;
  overflow-y: auto;
}

// 预览
.preview-section {
  @include flex-center;
  flex-direction: column;
  padding: $spacing-xl;
  background: linear-gradient(135deg, $primary-color 0%, $primary-dark 100%);
  border-radius: $radius-xl;
  margin-bottom: $spacing-lg;
}

.preview-icon {
  width: 100rpx;
  height: 100rpx;
  @include flex-center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: $radius-xl;
  margin-bottom: $spacing-md;
  font-size: 56rpx;
}

.preview-name {
  font-size: $font-lg;
  color: $text-inverse;
  font-weight: $font-medium;
  margin-bottom: 8rpx;
}

.preview-balance {
  font-size: $font-xl;
  color: $text-inverse;
  font-weight: $font-bold;
}

// 表单
.form-section {
  margin-bottom: $spacing-lg;
}

.form-label {
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: $spacing-sm;
  display: block;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.icon-option {
  width: calc(16.66% - #{$spacing-sm * 0.833});
  aspect-ratio: 1;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;
  font-size: 40rpx;
  transition: all $transition-fast;
  border: 2rpx solid transparent;

  &.active {
    background: $primary-soft;
    border-color: $primary-color;
  }
}

.form-input {
  width: 100%;
  padding: $spacing-md;
  background: $bg-grey;
  border-radius: $radius-lg;
  font-size: $font-md;
  color: $text-primary;
}

.balance-input-wrapper {
  display: flex;
  align-items: center;
  background: $bg-grey;
  border-radius: $radius-lg;
  padding-left: $spacing-md;
}

.balance-currency {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-medium;
}

.balance-input {
  flex: 1;
  padding: $spacing-md;
  padding-left: $spacing-sm;
  background: transparent;
  font-size: $font-md;
  color: $text-primary;
}

.popup-footer {
  display: flex;
  gap: $spacing-md;
  padding: $spacing-lg;
  border-top: 1rpx solid $border-light;
}

.btn {
  flex: 1;
  padding: $spacing-md 0;
  border-radius: $radius-lg;
  font-size: $font-md;
  border: none;
  @include press-effect;

  &.cancel {
    background: $bg-grey;
    color: $text-primary;
  }

  &.confirm {
    background: $primary-color;
    color: $text-inverse;
  }
}
</style>
