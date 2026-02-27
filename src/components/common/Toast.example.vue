<template>
  <div class="toast-example">
    <h1>Toast 组件示例</h1>

    <div class="example-section">
      <h2>基本用法</h2>
      <div class="button-group">
        <button @click="showSuccess">成功消息</button>
        <button @click="showError">错误消息</button>
        <button @click="showWarning">警告消息</button>
        <button @click="showInfo">信息消息</button>
      </div>
    </div>

    <div class="example-section">
      <h2>带标题的消息</h2>
      <div class="button-group">
        <button @click="showSuccessWithTitle">成功（带标题）</button>
        <button @click="showErrorWithTitle">错误（带标题）</button>
      </div>
    </div>

    <div class="example-section">
      <h2>自定义持续时间</h2>
      <div class="button-group">
        <button @click="showShortDuration">短时间（2秒）</button>
        <button @click="showLongDuration">长时间（10秒）</button>
        <button @click="showPersistent">持久显示（不自动关闭）</button>
      </div>
    </div>

    <div class="example-section">
      <h2>多个 Toast</h2>
      <div class="button-group">
        <button @click="showMultiple">显示多个消息</button>
        <button @click="clearAll">清除所有</button>
      </div>
    </div>

    <div class="example-section">
      <h2>实际场景示例</h2>
      <div class="button-group">
        <button @click="simulateSaveSuccess">保存成功</button>
        <button @click="simulateSaveError">保存失败</button>
        <button @click="simulateValidationError">验证错误</button>
        <button @click="simulateNetworkError">网络错误</button>
      </div>
    </div>

    <!-- Toast 组件 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Toast from './Toast.vue'
import { setToastInstance, useToast } from '../../composables/useToast'

const toastRef = ref()
const toast = useToast()

// 初始化 Toast 实例
onMounted(() => {
  if (toastRef.value) {
    setToastInstance(toastRef.value)
  }
})

// 基本用法
const showSuccess = () => {
  toast.success('操作成功完成！')
}

const showError = () => {
  toast.error('操作失败，请重试。')
}

const showWarning = () => {
  toast.warning('请注意，这是一个警告消息。')
}

const showInfo = () => {
  toast.info('这是一条信息提示。')
}

// 带标题的消息
const showSuccessWithTitle = () => {
  toast.success('任务已成功创建并添加到列表中。', '创建成功')
}

const showErrorWithTitle = () => {
  toast.error('无法连接到服务器，请检查网络连接。', '连接失败')
}

// 自定义持续时间
const showShortDuration = () => {
  toast.info('这条消息将在 2 秒后消失。', '短时间提示', 2000)
}

const showLongDuration = () => {
  toast.info('这条消息将在 10 秒后消失。', '长时间提示', 10000)
}

const showPersistent = () => {
  toast.warning('这条消息不会自动消失，请手动关闭。', '持久提示', 0)
}

// 多个 Toast
const showMultiple = () => {
  toast.success('第一条消息')
  setTimeout(() => toast.info('第二条消息'), 500)
  setTimeout(() => toast.warning('第三条消息'), 1000)
  setTimeout(() => toast.error('第四条消息'), 1500)
}

const clearAll = () => {
  toast.clearAll()
}

// 实际场景示例
const simulateSaveSuccess = () => {
  toast.success('您的更改已成功保存。', '保存成功')
}

const simulateSaveError = () => {
  toast.error('保存失败，请稍后重试。如果问题持续存在，请联系支持团队。', '保存失败')
}

const simulateValidationError = () => {
  toast.warning('任务标题不能为空，请输入有效的标题。', '验证错误')
}

const simulateNetworkError = () => {
  toast.error('无法连接到服务器，请检查您的网络连接后重试。', '网络错误', 0)
}
</script>

<style scoped>
.toast-example {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 40px;
  color: var(--text-primary, #1f2937);
}

.example-section {
  margin-bottom: 40px;
}

h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary, #1f2937);
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

button {
  padding: 10px 20px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

button:hover {
  background-color: var(--primary-hover, #2563eb);
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}

button:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}
</style>
