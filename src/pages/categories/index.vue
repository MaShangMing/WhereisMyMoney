<template>
  <view class="page">
    <!-- 类型切换 -->
    <view class="type-tabs">
      <view 
        class="type-tab" 
        :class="{ active: currentType === 'expense' }"
        @click="currentType = 'expense'"
      >
        <text>支出分类</text>
      </view>
      <view 
        class="type-tab" 
        :class="{ active: currentType === 'income' }"
        @click="currentType = 'income'"
      >
        <text>收入分类</text>
      </view>
    </view>
    
    <!-- 分类列表 -->
    <view class="category-list">
      <view 
        v-for="(category, index) in currentCategories" 
        :key="category.id"
        class="category-item"
        @click="editCategory(category)"
        @longpress="showCategoryActions(category)"
      >
        <view class="category-icon">
          <text>{{ category.icon }}</text>
        </view>
        <text class="category-name">{{ category.name }}</text>
        <view class="category-actions">
          <text class="sort-btn" @click.stop="moveUp(index)" v-if="index > 0">↑</text>
          <text class="sort-btn" @click.stop="moveDown(index)" v-if="index < currentCategories.length - 1">↓</text>
        </view>
      </view>
      
      <!-- 添加分类按钮 -->
      <view class="add-category" @click="showAddDialog">
        <text class="add-icon">+</text>
        <text class="add-text">添加分类</text>
      </view>
    </view>
    
    <!-- 编辑弹窗 -->
    <view class="edit-popup" v-if="showEdit" @click="closeEdit">
      <view class="popup-content" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ isEditing ? '编辑分类' : '添加分类' }}</text>
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
            <text class="form-label">分类名称</text>
            <input 
              class="form-input" 
              v-model="editForm.name" 
              placeholder="请输入分类名称"
              maxlength="10"
            />
          </view>
        </view>
        
        <view class="popup-footer">
          <button class="btn cancel" @click="closeEdit">取消</button>
          <button class="btn confirm" @click="saveCategory">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTransactionStore } from '@/stores/transaction'
import type { Category, TransactionType } from '@/types'

const store = useTransactionStore()

// 状态
const currentType = ref<TransactionType>('expense')
const showEdit = ref(false)
const isEditing = ref(false)
const editForm = ref<Partial<Category>>({
  name: '',
  icon: '📦',
  type: 'expense',
  sortOrder: 0
})

// 图标选项
const iconOptions = [
  '🍜', '🍔', '🍕', '☕', '🍰', '🥤',
  '🚗', '🚌', '🚇', '✈️', '⛽', '🚕',
  '🛒', '👕', '👟', '💄', '🎒', '📱',
  '🎮', '🎬', '🎵', '📚', '🏋️', '🎯',
  '🏠', '💡', '🔧', '🧹', '🛋️', '🌿',
  '💊', '🏥', '💉', '🩺', '🧴', '🦷',
  '🎁', '💒', '🎂', '🧧', '💐', '🎊',
  '💰', '💵', '💳', '📈', '🏆', '💼',
  '📦', '❓', '⭐', '❤️', '🔥', '✨'
]

// 计算属性
const currentCategories = computed(() => {
  return currentType.value === 'expense' 
    ? store.expenseCategories 
    : store.incomeCategories
})

// 方法
function showAddDialog() {
  isEditing.value = false
  editForm.value = {
    name: '',
    icon: '📦',
    type: currentType.value,
    sortOrder: currentCategories.value.length + 1
  }
  showEdit.value = true
}

function editCategory(category: Category) {
  isEditing.value = true
  editForm.value = { ...category }
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
  editForm.value = { name: '', icon: '📦', type: 'expense', sortOrder: 0 }
}

async function saveCategory() {
  if (!editForm.value.name?.trim()) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }
  
  try {
    if (isEditing.value && editForm.value.id) {
      await store.updateCategory(editForm.value as Category)
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await store.addCategory({
        name: editForm.value.name!,
        icon: editForm.value.icon!,
        type: editForm.value.type!,
        sortOrder: editForm.value.sortOrder!
      })
      uni.showToast({ title: '添加成功', icon: 'success' })
    }
    closeEdit()
  } catch (e) {
    console.error('保存失败', e)
    uni.showToast({ title: '保存失败', icon: 'error' })
  }
}

function showCategoryActions(category: Category) {
  uni.showActionSheet({
    itemList: ['编辑', '删除'],
    success: async (res) => {
      if (res.tapIndex === 0) {
        editCategory(category)
      } else if (res.tapIndex === 1) {
        deleteCategory(category)
      }
    }
  })
}

async function deleteCategory(category: Category) {
  // 检查是否有交易使用此分类
  const hasTransactions = store.transactions.some(t => t.categoryId === category.id)
  
  if (hasTransactions) {
    uni.showModal({
      title: '无法删除',
      content: '该分类下有交易记录，无法删除。请先删除相关记录或修改其分类。',
      showCancel: false
    })
    return
  }
  
  uni.showModal({
    title: '确认删除',
    content: `确定要删除分类"${category.name}"吗？`,
    success: async (res) => {
      if (res.confirm && category.id) {
        await store.deleteCategory(category.id)
        uni.showToast({ title: '删除成功', icon: 'success' })
      }
    }
  })
}

async function moveUp(index: number) {
  if (index <= 0) return
  
  const categories = [...currentCategories.value]
  const current = categories[index]
  const prev = categories[index - 1]
  
  // 交换排序
  const tempOrder = current.sortOrder
  current.sortOrder = prev.sortOrder
  prev.sortOrder = tempOrder
  
  await store.updateCategory(current)
  await store.updateCategory(prev)
}

async function moveDown(index: number) {
  if (index >= currentCategories.value.length - 1) return
  
  const categories = [...currentCategories.value]
  const current = categories[index]
  const next = categories[index + 1]
  
  // 交换排序
  const tempOrder = current.sortOrder
  current.sortOrder = next.sortOrder
  next.sortOrder = tempOrder
  
  await store.updateCategory(current)
  await store.updateCategory(next)
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
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

.category-list {
  padding: 20rpx;
}

.category-item {
  display: flex;
  align-items: center;
  background-color: $bg-white;
  padding: 24rpx;
  border-radius: $radius-md;
  margin-bottom: 16rpx;
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
  margin-right: 20rpx;
}

.category-name {
  flex: 1;
  font-size: $font-md;
  color: $text-primary;
}

.category-actions {
  display: flex;
  gap: 20rpx;
}

.sort-btn {
  width: 60rpx;
  height: 60rpx;
  background-color: $bg-grey;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: $text-secondary;
}

.add-category {
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
