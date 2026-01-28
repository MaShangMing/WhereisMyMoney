<template>
  <view class="page">
    <!-- 类型切换 -->
    <view class="type-switch">
      <view class="switch-container">
        <view
          class="switch-option"
          :class="{ active: currentType === 'expense' }"
          @click="currentType = 'expense'"
        >
          <text class="option-icon">📤</text>
          <text class="option-label">支出分类</text>
          <text class="option-count">{{ expenseCount }}个</text>
        </view>
        <view
          class="switch-option"
          :class="{ active: currentType === 'income' }"
          @click="currentType = 'income'"
        >
          <text class="option-icon">📥</text>
          <text class="option-label">收入分类</text>
          <text class="option-count">{{ incomeCount }}个</text>
        </view>
      </view>
    </view>

    <!-- 分类列表 -->
    <view class="category-list">
      <view
        v-for="(category, index) in currentCategories"
        :key="category.id"
        class="category-card"
        @click="editCategory(category)"
        @longpress="showCategoryActions(category)"
      >
        <view class="card-main">
          <view class="category-icon">
            <text>{{ category.icon }}</text>
          </view>
          <text class="category-name">{{ category.name }}</text>
        </view>
        <view class="card-actions">
          <view class="sort-btn" @click.stop="moveUp(index)" v-if="index > 0">
            <text>↑</text>
          </view>
          <view class="sort-btn" @click.stop="moveDown(index)" v-if="index < currentCategories.length - 1">
            <text>↓</text>
          </view>
        </view>
      </view>

      <!-- 添加分类按钮 -->
      <view class="add-card" @click="showAddDialog">
        <view class="add-icon">
          <text>+</text>
        </view>
        <text class="add-text">添加{{ currentType === 'expense' ? '支出' : '收入' }}分类</text>
      </view>
    </view>

    <!-- 编辑弹窗 -->
    <view class="popup-overlay" v-if="showEdit" @click="closeEdit">
      <view class="popup-container" @click.stop>
        <view class="popup-header">
          <text class="popup-title">{{ isEditing ? '编辑分类' : '添加分类' }}</text>
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
            <text class="preview-name">{{ editForm.name || '分类名称' }}</text>
          </view>

          <!-- 图标选择 -->
          <view class="form-section">
            <text class="form-label">选择图标</text>
            <scroll-view scroll-y class="icon-scroll">
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
            </scroll-view>
          </view>

          <!-- 名称输入 -->
          <view class="form-section">
            <text class="form-label">分类名称</text>
            <input
              class="form-input"
              v-model="editForm.name"
              placeholder="请输入分类名称"
              :placeholder-style="'color: #9CA3AF'"
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
  '🍜', '🍔', '🍕', '☕', '🍰', '🥤', '🍦', '🍿',
  '🚗', '🚌', '🚇', '✈️', '⛽', '🚕', '🚲', '🛵',
  '🛒', '👕', '👟', '💄', '🎒', '📱', '💻', '⌚',
  '🎮', '🎬', '🎵', '📚', '🏋️', '🎯', '🎨', '🎭',
  '🏠', '💡', '🔧', '🧹', '🛋️', '🌿', '🪴', '🛁',
  '💊', '🏥', '💉', '🩺', '🧴', '🦷', '💆', '🧘',
  '🎁', '💒', '🎂', '🧧', '💐', '🎊', '🎉', '💝',
  '💰', '💵', '💳', '📈', '🏆', '💼', '🎓', '📝',
  '📦', '❓', '⭐', '❤️', '🔥', '✨', '🌟', '💫'
]

// 计算属性
const expenseCount = computed(() => store.expenseCategories.length)
const incomeCount = computed(() => store.incomeCategories.length)

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
    confirmColor: '#EF4444',
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

  const tempOrder = current.sortOrder
  current.sortOrder = prev.sortOrder
  prev.sortOrder = tempOrder

  await store.updateCategory(current)
  await store.updateCategory(prev)

  uni.vibrateShort({ type: 'light' })
}

async function moveDown(index: number) {
  if (index >= currentCategories.value.length - 1) return

  const categories = [...currentCategories.value]
  const current = categories[index]
  const next = categories[index + 1]

  const tempOrder = current.sortOrder
  current.sortOrder = next.sortOrder
  next.sortOrder = tempOrder

  await store.updateCategory(current)
  await store.updateCategory(next)

  uni.vibrateShort({ type: 'light' })
}
</script>

<style lang="scss" scoped>
@import '@/uni.scss';

.page {
  min-height: 100vh;
  background-color: $bg-color;
  padding-bottom: calc(100rpx + $safe-area-bottom);
}

// 类型切换
.type-switch {
  padding: $spacing-lg $page-padding;
}

.switch-container {
  display: flex;
  gap: $spacing-md;
}

.switch-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg;
  background: $bg-white;
  border-radius: $radius-xl;
  box-shadow: $shadow-sm;
  border: 3rpx solid transparent;
  transition: all $transition-normal;
  @include press-effect;

  &.active {
    border-color: $primary-color;
    background: $primary-soft;
  }
}

.option-icon {
  font-size: 48rpx;
  margin-bottom: $spacing-sm;
}

.option-label {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
  margin-bottom: 4rpx;
}

.option-count {
  font-size: $font-xs;
  color: $text-secondary;
}

// 分类列表
.category-list {
  padding: 0 $page-padding;
}

.category-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $bg-white;
  padding: $spacing-md $spacing-lg;
  border-radius: $radius-xl;
  margin-bottom: $spacing-md;
  box-shadow: $shadow-sm;
  @include press-effect;
}

.card-main {
  display: flex;
  align-items: center;
}

.category-icon {
  width: 80rpx;
  height: 80rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;
  margin-right: $spacing-md;
  font-size: 40rpx;
}

.category-name {
  font-size: $font-md;
  color: $text-primary;
  font-weight: $font-medium;
}

.card-actions {
  display: flex;
  gap: $spacing-sm;
}

.sort-btn {
  width: 64rpx;
  height: 64rpx;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;

  text {
    font-size: $font-lg;
    color: $text-secondary;
  }
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
  background: $bg-grey;
  border-radius: $radius-xl;
  margin-bottom: $spacing-lg;
}

.preview-icon {
  width: 100rpx;
  height: 100rpx;
  @include flex-center;
  background: $bg-white;
  border-radius: $radius-xl;
  margin-bottom: $spacing-md;
  font-size: 56rpx;
  box-shadow: $shadow-sm;
}

.preview-name {
  font-size: $font-lg;
  color: $text-primary;
  font-weight: $font-medium;
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

.icon-scroll {
  max-height: 320rpx;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
}

.icon-option {
  width: calc(12.5% - #{$spacing-sm * 0.875});
  aspect-ratio: 1;
  @include flex-center;
  background: $bg-grey;
  border-radius: $radius-lg;
  font-size: 36rpx;
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
