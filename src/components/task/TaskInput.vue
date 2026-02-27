<template>
  <div class="task-input-container">
    <div
      class="task-input-wrapper"
      :class="{ 
        'task-input-focused': isFocused,
        'task-input-error': hasError
      }"
    >
      <!-- 输入框 -->
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="task-input-field"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        :maxlength="maxLength"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
      />

      <!-- 字符计数 -->
      <div class="task-input-counter" :class="{ 'task-input-counter-warning': isNearLimit }">
        {{ charCountText }}
      </div>
    </div>

    <!-- 错误提示 -->
    <Transition name="error-fade">
      <div v-if="errorMessage" class="task-input-error-message" role="alert">
        {{ errorMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { validateTaskTitle, getRemainingCharsText } from '@/utils/validation'

/**
 * TaskInput 组件
 * 
 * 任务输入组件，用于快速添加新任务
 * 
 * 验收标准：
 * - 需求 1.1: 用户输入任务文本并提交，创建新任务
 * - 需求 7.1: 支持自然语言输入（暂时跳过）
 * - 需求 7.8: 实时显示解析结果预览（暂时跳过）
 * - 需求 18.2: 限制任务标题最多 200 个字符
 * - 需求 18.6: 显示剩余字符数提示
 * - 需求 14.1: 支持使用 Enter 键快速添加任务
 * - 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
 * - 需求 19.2: 支持完整的键盘导航
 */

interface Props {
  /** 占位符 */
  placeholder?: string
  /** ARIA 标签 */
  ariaLabel?: string
  /** 是否自动聚焦 */
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '添加新任务...',
  ariaLabel: '任务输入',
  autofocus: false,
})

interface Emits {
  /** 提交任务 */
  (e: 'submit', title: string): void
  /** 输入变化 */
  (e: 'input', value: string): void
}

const emit = defineEmits<Emits>()

// 引用
const inputRef = ref<HTMLInputElement>()

// 状态
const inputValue = ref('')
const isFocused = ref(false)
const errorMessage = ref('')

// 常量
const maxLength = 200

/**
 * 当前字符数
 */
const charCount = computed(() => inputValue.value.length)

/**
 * 是否接近字符限制
 */
const isNearLimit = computed(() => {
  const remaining = maxLength - charCount.value
  return remaining <= 20 && remaining > 0
})

/**
 * 是否有错误
 */
const hasError = computed(() => !!errorMessage.value)

/**
 * 字符计数文本
 */
const charCountText = computed(() => {
  return getRemainingCharsText(charCount.value, maxLength)
})

/**
 * 处理输入
 */
const handleInput = () => {
  // 清除错误消息
  if (errorMessage.value) {
    errorMessage.value = ''
  }

  // 触发输入事件
  emit('input', inputValue.value)
}

/**
 * 处理键盘事件
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    submitTask()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    clearInput()
  }
}

/**
 * 处理聚焦
 */
const handleFocus = () => {
  isFocused.value = true
}

/**
 * 处理失焦
 */
const handleBlur = () => {
  isFocused.value = false
}

/**
 * 提交任务
 */
const submitTask = () => {
  const title = inputValue.value.trim()

  // 验证任务标题
  const validation = validateTaskTitle(title)

  if (!validation.valid) {
    errorMessage.value = validation.error || '任务标题无效'
    return
  }

  // 触发提交事件
  emit('submit', title)

  // 清空输入
  clearInput()
}

/**
 * 清空输入
 */
const clearInput = () => {
  inputValue.value = ''
  errorMessage.value = ''
}

/**
 * 聚焦输入框
 */
const focus = () => {
  nextTick(() => {
    inputRef.value?.focus()
  })
}

/**
 * 设置输入值
 */
const setValue = (value: string) => {
  inputValue.value = value
}

// 自动聚焦
if (props.autofocus) {
  nextTick(() => {
    focus()
  })
}

// 暴露方法给父组件
defineExpose({
  focus,
  setValue,
  clearInput,
})
</script>

<style scoped>
/* 容器 */
.task-input-container {
  width: 100%;
}

/* 输入框包装器 */
.task-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background-color: var(--input-bg, #ffffff);
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  transition: all 0.2s;
}

.task-input-wrapper:hover {
  border-color: var(--primary-color, #3b82f6);
}

.task-input-focused {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.task-input-error {
  border-color: var(--error-color, #ef4444);
}

.task-input-error:hover,
.task-input-error.task-input-focused {
  border-color: var(--error-color, #ef4444);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* 输入框 */
.task-input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--text-primary, #1f2937);
  padding: 0;
  line-height: 1.5;
}

.task-input-field::placeholder {
  color: var(--text-tertiary, #9ca3af);
}

/* 字符计数 */
.task-input-counter {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-tertiary, #9ca3af);
  font-variant-numeric: tabular-nums;
  transition: color 0.2s;
}

.task-input-counter-warning {
  color: var(--warning-color, #f59e0b);
  font-weight: 500;
}

/* 错误提示 */
.task-input-error-message {
  margin-top: 8px;
  padding: 8px 12px;
  background-color: var(--error-bg, #fef2f2);
  border-left: 3px solid var(--error-color, #ef4444);
  border-radius: 4px;
  font-size: 13px;
  color: var(--error-color, #ef4444);
}

/* 错误提示过渡动画 */
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.2s ease;
}

.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 暗色主题 */
:global(.dark) .task-input-wrapper {
  --input-bg: #1f2937;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-tertiary: #6b7280;
  --error-bg: #7f1d1d;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .task-input-wrapper {
    padding: 10px 12px;
  }

  .task-input-field {
    font-size: 14px;
  }

  .task-input-counter {
    font-size: 11px;
  }
}

/* 可访问性：确保焦点指示器清晰可见 */
.task-input-field:focus-visible {
  outline: none;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .task-input-wrapper {
    border-width: 2px;
  }

  .task-input-focused {
    border-width: 3px;
  }
}
</style>
