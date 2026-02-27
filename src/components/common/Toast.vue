<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      <TransitionGroup name="toast-slide">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="[`toast-${toast.type}`, { 'toast-dismissing': toast.dismissing }]"
          role="alert"
          :aria-label="`${toast.type}消息: ${toast.message}`"
        >
          <!-- 图标 -->
          <div class="toast-icon">
            {{ getIcon(toast.type) }}
          </div>

          <!-- 内容 -->
          <div class="toast-content">
            <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
            <!-- 操作按钮（如重试） -->
            <button
              v-if="toast.actionLabel"
              class="toast-action"
              type="button"
              @click="handleAction(toast)"
            >
              {{ toast.actionLabel }}
            </button>
          </div>

          <!-- 关闭按钮 -->
          <button
            class="toast-close"
            type="button"
            aria-label="关闭消息"
            @click="dismissToast(toast.id)"
          >
            ✕
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

/**
 * Toast 组件
 * 
 * 消息提示组件，支持成功、错误、警告、信息类型
 * 
 * 验收标准：
 * - 需求 17.1: 数据加载失败时显示友好的错误提示信息
 * - 需求 17.2: 数据保存失败时显示错误提示并提供重试选项
 * - 需求 17.3: 用户输入无效数据时显示具体的验证错误信息
 * - 需求 17.6: 为所有错误提示提供关闭按钮
 * - 需求 17.7: 在 5 秒后自动隐藏非关键错误提示
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  title?: string
  duration?: number
  dismissing?: boolean
  /** 操作按钮文本（如"重试"） */
  actionLabel?: string
  /** 操作按钮回调 */
  actionCallback?: () => void
}

interface ToastOptions {
  type?: ToastType
  title?: string
  duration?: number
  /** 操作按钮文本 */
  actionLabel?: string
  /** 操作按钮回调 */
  actionCallback?: () => void
}

// Toast 列表
const toasts = ref<Toast[]>([])

// 定时器映射
const timers = new Map<string, number>()

/**
 * 获取类型对应的图标
 */
const getIcon = (type: ToastType): string => {
  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }
  return icons[type]
}

/**
 * 生成唯一 ID
 */
const generateId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 显示 Toast
 */
const showToast = (message: string, options: ToastOptions = {}): string => {
  const id = generateId()
  const duration = options.duration ?? 5000 // 默认 5 秒

  const toast: Toast = {
    id,
    type: options.type || 'info',
    message,
    title: options.title,
    duration,
    dismissing: false,
    actionLabel: options.actionLabel,
    actionCallback: options.actionCallback,
  }

  toasts.value.push(toast)

  // 设置自动隐藏
  if (duration > 0) {
    const timer = window.setTimeout(() => {
      dismissToast(id)
    }, duration)
    timers.set(id, timer)
  }

  return id
}

/**
 * 处理操作按钮点击（如重试）
 */
const handleAction = (toast: Toast) => {
  if (toast.actionCallback) {
    toast.actionCallback()
  }
  dismissToast(toast.id)
}

/**
 * 关闭 Toast
 */
const dismissToast = (id: string) => {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index === -1) return

  // 标记为正在关闭（用于动画）
  toasts.value[index].dismissing = true

  // 清除定时器
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }

  // 延迟移除（等待动画完成）
  setTimeout(() => {
    const currentIndex = toasts.value.findIndex((t) => t.id === id)
    if (currentIndex !== -1) {
      toasts.value.splice(currentIndex, 1)
    }
  }, 300)
}

/**
 * 显示成功消息
 */
const success = (message: string, title?: string, duration?: number): string => {
  return showToast(message, { type: 'success', title, duration })
}

/**
 * 显示错误消息
 */
const error = (message: string, title?: string, duration?: number): string => {
  return showToast(message, { type: 'error', title, duration })
}

/**
 * 显示警告消息
 */
const warning = (message: string, title?: string, duration?: number): string => {
  return showToast(message, { type: 'warning', title, duration })
}

/**
 * 显示信息消息
 */
const info = (message: string, title?: string, duration?: number): string => {
  return showToast(message, { type: 'info', title, duration })
}

/**
 * 清除所有 Toast
 */
const clearAll = () => {
  toasts.value.forEach((toast) => {
    const timer = timers.get(toast.id)
    if (timer) {
      clearTimeout(timer)
    }
  })
  timers.clear()
  toasts.value = []
}

// 清理定时器
onUnmounted(() => {
  clearAll()
})

// 暴露方法供外部使用
defineExpose({
  showToast,
  success,
  error,
  warning,
  info,
  dismissToast,
  clearAll,
  handleAction,
})
</script>

<style scoped>
/* Toast 容器 */
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

/* Toast 项 */
.toast {
  min-width: 300px;
  max-width: 500px;
  background-color: var(--toast-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  pointer-events: auto;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

/* Toast 类型样式 */
.toast-success {
  border-left-color: var(--success-color, #10b981);
  background-color: var(--success-bg, #f0fdf4);
}

.toast-error {
  border-left-color: var(--error-color, #ef4444);
  background-color: var(--error-bg, #fef2f2);
}

.toast-warning {
  border-left-color: var(--warning-color, #f59e0b);
  background-color: var(--warning-bg, #fffbeb);
}

.toast-info {
  border-left-color: var(--info-color, #3b82f6);
  background-color: var(--info-bg, #eff6ff);
}

/* Toast 图标 */
.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
  color: white;
}

.toast-success .toast-icon {
  background-color: var(--success-color, #10b981);
}

.toast-error .toast-icon {
  background-color: var(--error-color, #ef4444);
}

.toast-warning .toast-icon {
  background-color: var(--warning-color, #f59e0b);
}

.toast-info .toast-icon {
  background-color: var(--info-color, #3b82f6);
}

/* Toast 内容 */
.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary, #1f2937);
}

.toast-message {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-secondary, #4b5563);
  word-wrap: break-word;
}

.toast-success .toast-title,
.toast-success .toast-message {
  color: var(--success-text, #065f46);
}

.toast-error .toast-title,
.toast-error .toast-message {
  color: var(--error-text, #991b1b);
}

.toast-warning .toast-title,
.toast-warning .toast-message {
  color: var(--warning-text, #92400e);
}

.toast-info .toast-title,
.toast-info .toast-message {
  color: var(--info-text, #1e40af);
}

/* 关闭按钮 */
.toast-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: var(--text-primary, #1f2937);
}

.toast-close:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

/* 操作按钮（重试等） */
.toast-action {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--primary-color, #3b82f6);
  background: transparent;
  border: 1px solid var(--primary-color, #3b82f6);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toast-action:hover {
  background: var(--primary-color, #3b82f6);
  color: #fff;
}

.toast-action:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.toast-error .toast-action {
  color: var(--error-color, #ef4444);
  border-color: var(--error-color, #ef4444);
}

.toast-error .toast-action:hover {
  background: var(--error-color, #ef4444);
  color: #fff;
}

/* 过渡动画 */
.toast-slide-enter-active {
  transition: all 0.3s ease;
}

.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* 正在关闭的 Toast */
.toast-dismissing {
  opacity: 0.5;
}

/* 暗色主题 */
:global(.dark) .toast {
  --toast-bg: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
}

:global(.dark) .toast-success {
  --success-bg: #064e3b;
  --success-text: #d1fae5;
}

:global(.dark) .toast-error {
  --error-bg: #7f1d1d;
  --error-text: #fecaca;
}

:global(.dark) .toast-warning {
  --warning-bg: #78350f;
  --warning-text: #fef3c7;
}

:global(.dark) .toast-info {
  --info-bg: #1e3a8a;
  --info-text: #dbeafe;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .toast {
    min-width: auto;
    max-width: 100%;
  }
}
</style>
