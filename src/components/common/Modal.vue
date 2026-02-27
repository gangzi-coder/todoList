<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="modal-overlay"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click="handleOverlayClick"
        @keydown.esc="handleEscape"
      >
        <div
          ref="modalContainerRef"
          class="modal-container"
          :class="{ 'modal-small': size === 'small', 'modal-large': size === 'large' }"
          @click.stop
          @keydown="handleFocusTrap"
        >
          <!-- 头部 -->
          <div v-if="title || $slots.header" class="modal-header">
            <slot name="header">
              <h2 :id="titleId" class="modal-title">{{ title }}</h2>
            </slot>
            <button
              v-if="showClose"
              class="modal-close"
              type="button"
              aria-label="关闭对话框"
              @click="handleClose"
            >
              ✕
            </button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <slot>{{ content }}</slot>
          </div>

          <!-- 底部按钮 -->
          <div v-if="showFooter" class="modal-footer">
            <slot name="footer">
              <button
                v-if="showCancel"
                class="modal-button modal-button-cancel"
                type="button"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button
                v-if="showConfirm"
                class="modal-button modal-button-confirm"
                type="button"
                :class="{ 'modal-button-danger': confirmDanger }"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref, onMounted, onUnmounted } from 'vue'

/**
 * Modal 组件
 * 
 * 通用模态框组件，支持标题、内容、确认/取消按钮
 * 
 * 验收标准：
 * - 需求 13.6: 使用动画过渡效果提升用户体验
 * - 需求 14.3: 支持使用 Esc 键关闭弹窗
 * - 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
 */

interface Props {
  /** 是否显示模态框 */
  modelValue: boolean
  /** 标题 */
  title?: string
  /** 内容文本（当不使用默认插槽时） */
  content?: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 是否显示确认按钮 */
  showConfirm?: boolean
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 是否显示关闭按钮 */
  showClose?: boolean
  /** 是否显示底部 */
  showFooter?: boolean
  /** 点击遮罩是否关闭 */
  closeOnClickOverlay?: boolean
  /** 按 Esc 键是否关闭 */
  closeOnEscape?: boolean
  /** 确认按钮是否为危险样式（用于删除等操作） */
  confirmDanger?: boolean
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  content: '',
  confirmText: '确认',
  cancelText: '取消',
  showConfirm: true,
  showCancel: true,
  showClose: true,
  showFooter: true,
  closeOnClickOverlay: true,
  closeOnEscape: true,
  confirmDanger: false,
  size: 'medium',
})

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'close'): void
}

const emit = defineEmits<Emits>()

// 生成唯一的标题 ID（用于 ARIA）
const titleId = computed(() => `modal-title-${Math.random().toString(36).substr(2, 9)}`)

// 模态框容器引用（用于焦点陷阱）
const modalContainerRef = ref<HTMLElement | null>(null)

/**
 * 获取模态框内所有可聚焦元素
 */
const getFocusableElements = (): HTMLElement[] => {
  if (!modalContainerRef.value) return []
  const selectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  return Array.from(modalContainerRef.value.querySelectorAll<HTMLElement>(selectors))
    .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

/**
 * 焦点陷阱：Tab 键在模态框内循环
 */
const handleFocusTrap = (event: KeyboardEvent) => {
  if (event.key !== 'Tab') return

  const focusableElements = getFocusableElements()
  if (focusableElements.length === 0) return

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey) {
    // Shift+Tab：如果焦点在第一个元素，跳到最后一个
    if (document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
  } else {
    // Tab：如果焦点在最后一个元素，跳到第一个
    if (document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

/**
 * 关闭模态框
 */
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}

/**
 * 处理确认
 */
const handleConfirm = () => {
  emit('confirm')
}

/**
 * 处理取消
 */
const handleCancel = () => {
  emit('cancel')
  close()
}

/**
 * 处理关闭按钮点击
 */
const handleClose = () => {
  close()
}

/**
 * 处理遮罩点击
 */
const handleOverlayClick = () => {
  if (props.closeOnClickOverlay) {
    close()
  }
}

/**
 * 处理 Esc 键
 */
const handleEscape = () => {
  if (props.closeOnEscape) {
    close()
  }
}

// 保存打开模态框前的焦点元素，关闭时恢复
let previouslyFocusedElement: HTMLElement | null = null

// 监听模态框显示状态，管理 body 滚动和焦点
watch(
  () => props.modelValue,
  (newValue) => {
    nextTick(() => {
      if (newValue) {
        // 记录之前的焦点元素
        previouslyFocusedElement = document.activeElement as HTMLElement
        // 显示模态框时禁止 body 滚动
        document.body.style.overflow = 'hidden'
        // 自动聚焦模态框内第一个可聚焦元素
        nextTick(() => {
          const focusableElements = getFocusableElements()
          if (focusableElements.length > 0) {
            focusableElements[0].focus()
          }
        })
      } else {
        // 关闭模态框时恢复 body 滚动
        document.body.style.overflow = ''
        // 恢复之前的焦点
        if (previouslyFocusedElement) {
          previouslyFocusedElement.focus()
          previouslyFocusedElement = null
        }
      }
    })
  }
)
</script>

<style scoped>
/* 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* 模态框容器 */
.modal-container {
  background-color: var(--modal-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-small {
  max-width: 400px;
}

.modal-large {
  max-width: 700px;
}

/* 头部 */
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;
}

.modal-close:hover {
  background-color: var(--hover-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.modal-close:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

/* 内容 */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  color: var(--text-primary, #1f2937);
  line-height: 1.6;
}

/* 底部 */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

/* 按钮 */
.modal-button {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.modal-button:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.modal-button-cancel {
  background-color: var(--button-secondary-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
  border-color: var(--border-color, #e5e7eb);
}

.modal-button-cancel:hover {
  background-color: var(--button-secondary-hover, #e5e7eb);
}

.modal-button-confirm {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.modal-button-confirm:hover {
  background-color: var(--primary-hover, #2563eb);
}

.modal-button-danger {
  background-color: var(--danger-color, #ef4444);
}

.modal-button-danger:hover {
  background-color: var(--danger-hover, #dc2626);
}

/* 过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9);
  opacity: 0;
}

/* 暗色主题 */
:global(.dark) .modal-container {
  --modal-bg: #1f2937;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --hover-bg: #374151;
  --button-secondary-bg: #374151;
  --button-secondary-hover: #4b5563;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .modal-overlay {
    padding: 0;
  }

  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 12px 20px;
  }
}
</style>
