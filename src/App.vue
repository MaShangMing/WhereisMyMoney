<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useTransactionStore } from '@/stores/transaction'
import { initDatabase } from '@/utils/db'

onLaunch(async () => {
  console.log('App Launch')
  // 初始化数据库
  await initDatabase()
  
  // 初始化 store
  const transactionStore = useTransactionStore()
  await transactionStore.loadTransactions()
  await transactionStore.loadCategories()
  await transactionStore.loadAccounts()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import '@/uni.scss';

page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.container {
  padding: 20rpx;
}

// 通用按钮样式
.btn-primary {
  background-color: $primary-color;
  color: #ffffff;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
}

.btn-secondary {
  background-color: #ffffff;
  color: $primary-color;
  border: 2rpx solid $primary-color;
  border-radius: 12rpx;
  padding: 24rpx 48rpx;
  font-size: 32rpx;
}

// 卡片样式
.card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}
</style>
