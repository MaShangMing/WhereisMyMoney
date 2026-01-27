<template>
  <view class="page">
    <!-- 账户总览 -->
    <view class="total-card">
      <text class="total-label">总资产</text>
      <text class="total-value">¥{{ formatMoney(totalBalance) }}</text>
    </view>
    
    <!-- 账户列表 -->
    <view class="account-list">
      <view 
        v-for="account in accounts" 
        :key="account.id"
        class="account-item"
        @click="editAccount(account)"
        @longpress="showAccountActions(account)"
      >
        <view class="account-icon">
          <text>{{ account.icon }}</text>
        </view>
        <view class="account-info">
          <text class="account-name">{{ account.name }}</text>
          <text class="account-balance" :class="account.balance >= 0 ? 'positive' : 'negative'">
            ¥{{ formatMoney(account.balance) }}
          </text>
        </view>
        <text class="arrow">›</text>
      </view>
      
      <!-- 添加账户按钮 -->
      <view class="add-account" @click="showAddDialog">
        <text class="add-icon">+</text>
        <text class="add-text">添加账户</text>
      </view>
    </view>
    
    <!-- 编辑弹窗 -->
    <view class="edit-popup" v-if="showEdit" @click="closeEdit">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ isEditing ? '编辑账户' : '添加账户' }}</text>
          <text class="popup-close" @click="closeEdit">×</text>
        </view>
        
        <view class="popup-body">
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
              maxlength="10"
            />
          </view>
          
          <!-- 余额输入 -->
          <view class="form-section">
            <text class="form-label">账户余额</text>
            <view class="balance-input">
              <text class="currency">¥</text>
              <input 
                class="form-input balance" 
                type="digit"
                v-model="balanceInput" 
                placeholder="0.00"
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
  // 检查是否有交易使用此账户
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
}

.total-card {
  background: linear-gradient(135deg, $primary-color, $primary-dark);
  margin: 20rpx;
  padding: 40rpx;
  border-radius: $radius-lg;
  text-align: center;
}

.total-label {
  font-size: $font-sm;
  color: rgba(255, 255, 255, 0.8);
  display: block;
  margin-bottom: 16rpx;
}

.total-value {
  font-size: 64rpx;
  font-weight: 600;
  color: #ffffff;
}

.account-list {
  padding: 0 20rpx 20rpx;
}

.account-item {
  display: flex;
  align-items: center;
  background-color: $bg-white;
  padding: 24rpx;
  border-radius: $radius-md;
  margin-bottom: 16rpx;
}

.account-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: $bg-grey;
  border-radius: $radius-round;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  margin-right: 20rpx;
}

.account-info {
  flex: 1;
}

.account-name {
  font-size: $font-md;
  color: $text-primary;
  display: block;
  margin-bottom: 8rpx;
}

.account-balance {
  font-size: $font-lg;
  font-weight: 600;
  
  &.positive {
    color: $income-color;
  }
  
  &.negative {
    color: $expense-color;
  }
}

.arrow {
  font-size: 32rpx;
  color: $text-placeholder;
}

.add-account {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-white;
  padding: 32rpx;
  border-radius: $radius-md;
  border: 2rpx dashed $border-color;
}

.add-icon {
  font-size: 40rpx;
  color: $primary-color;
  margin-right: 10rpx;
}

.add-text {
  font-size: $font-md;
  color: $primary-color;
}

// 编辑弹窗
.edit-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.popup-content {
  width: 90%;
  max-width: 600rpx;
  background-color: $bg-white;
  border-radius: $radius-lg;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid $border-light;
}

.popup-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
}

.popup-close {
  font-size: 48rpx;
  color: $text-secondary;
  padding: 0 10rpx;
}

.popup-body {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: 16rpx;
  display: block;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.icon-option {
  width: calc(16.66% - 14rpx);
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-grey;
  border-radius: $radius-md;
  font-size: 40rpx;
  transition: all 0.3s;
  
  &.active {
    background-color: rgba(76, 175, 80, 0.2);
    border: 2rpx solid $primary-color;
  }
}

.form-input {
  width: 100%;
  padding: 24rpx;
  background-color: $bg-grey;
  border-radius: $radius-md;
  font-size: $font-md;
}

.balance-input {
  display: flex;
  align-items: center;
  background-color: $bg-grey;
  border-radius: $radius-md;
  padding-left: 24rpx;
}

.currency {
  font-size: $font-lg;
  color: $text-primary;
}

.balance {
  flex: 1;
  padding-left: 10rpx;
  background-color: transparent;
}

.popup-footer {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx 30rpx;
}

.btn {
  flex: 1;
  padding: 24rpx 0;
  border-radius: $radius-md;
  font-size: $font-md;
  
  &.cancel {
    background-color: $bg-grey;
    color: $text-primary;
  }
  
  &.confirm {
    background-color: $primary-color;
    color: #ffffff;
  }
}
</style>
