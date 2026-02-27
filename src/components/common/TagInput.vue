<template>
  <div
    ref="tagInputRef"
    class="tag-input"
    :class="{ 'tag-input-focused': isFocused, 'tag-input-disabled': disabled }"
  >
    <!-- 已选标签 -->
    <div class="tag-input-tags">
      <span
        v-for="(tag, index) in modelValue"
        :key="tag"
        class="tag-input-tag"
        :style="{ backgroundColor: getTagColor(tag) }"
      >
        <span class="tag-input-tag-text">{{ tag }}</span>
        <button
          type="button"
          class="tag-input-tag-remove"
          :aria-label="`删除标签 ${tag}`"
          @click="removeTag(index)"
        >
          ×
        </button>
      </span>

      <!-- 输入框 -->
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="tag-input-field"
        :placeholder="modelValue.length === 0 ? placeholder : ''"
        :disabled="disabled"
        :aria-label="ariaLabel"
        @input="handleInput"
        @keydown="handleKeydown"
        @focus="handleFocus"
        @blur="handleBlur"
      />
    </div>

    <!-- 自动完成下拉菜单 -->
    <Teleport to="body">
      <Transition name="suggestions-fade">
        <div
          v-if="showSuggestions && filteredSuggestions.length > 0"
          ref="suggestionsRef"
          class="tag-input-suggestions"
          :style="suggestionsStyle"
          role="listbox"
        >
          <div
            v-for="(suggestion, index) in filteredSuggestions"
            :key="suggestion"
            class="tag-input-suggestion"
            :class="{ 'tag-input-suggestion-focused': focusedIndex === index }"
            role="option"
            :aria-selected="focusedIndex === index"
            @click="selectSuggestion(suggestion)"
            @mouseenter="focusedIndex = index"
          >
            <span
              class="tag-input-suggestion-color"
              :style="{ backgroundColor: getTagColor(suggestion) }"
            ></span>
            <span class="tag-input-suggestion-text">{{ suggestion }}</span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

/**
 * TagInput 组件
 * 
 * 标签输入组件，支持输入、删除、自动完成和颜色显示
 * 
 * 验收标准：
 * - 需求 4.3: 允许为任务添加多个标签
 * - 需求 4.4: 支持创建、编辑、删除自定义标签
 * - 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
 * - 需求 19.2: 支持完整的键盘导航
 */

interface Props {
  /** 当前选中的标签列表 */
  modelValue: string[]
  /** 可用的标签建议列表 */
  suggestions?: string[]
  /** 占位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** ARIA 标签 */
  ariaLabel?: string
  /** 分隔符（用于快速输入多个标签） */
  separators?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  suggestions: () => [],
  placeholder: '添加标签...',
  disabled: false,
  ariaLabel: '标签输入',
  separators: () => [',', 'Enter'],
})

interface Emits {
  (e: 'update:modelValue', value: string[]): void
  (e: 'change', value: string[]): void
}

const emit = defineEmits<Emits>()

// 引用
const tagInputRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const suggestionsRef = ref<HTMLElement>()

// 状态
const inputValue = ref('')
const isFocused = ref(false)
const showSuggestions = ref(false)
const focusedIndex = ref(0)
const suggestionsStyle = ref<Record<string, string>>({})

/**
 * 预定义的标签颜色
 */
const tagColors: Record<string, string> = {
  工作: '#3b82f6',
  个人: '#10b981',
  学习: '#f59e0b',
  紧急: '#ef4444',
  重要: '#8b5cf6',
  待办: '#6b7280',
}

/**
 * 获取标签颜色
 */
const getTagColor = (tag: string): string => {
  // 如果有预定义颜色，使用预定义颜色
  if (tagColors[tag]) {
    return tagColors[tag]
  }
  
  // 否则根据标签名称生成颜色
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // 确保 hue 为正数
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 65%, 55%)`
}

/**
 * 过滤后的建议列表
 */
const filteredSuggestions = computed(() => {
  if (!inputValue.value) {
    return []
  }
  
  const query = inputValue.value.toLowerCase().trim()
  
  return props.suggestions
    .filter((suggestion) => {
      // 排除已选中的标签
      if (props.modelValue.includes(suggestion)) {
        return false
      }
      // 匹配输入内容
      return suggestion.toLowerCase().includes(query)
    })
    .slice(0, 5) // 最多显示 5 个建议
})

/**
 * 添加标签
 */
const addTag = (tag: string) => {
  const trimmedTag = tag.trim()
  
  // 验证标签
  if (!trimmedTag) {
    return
  }
  
  // 检查是否已存在
  if (props.modelValue.includes(trimmedTag)) {
    inputValue.value = ''
    return
  }
  
  // 验证标签长度（需求 18.5）
  if (trimmedTag.length > 20) {
    // 可以在这里显示错误提示
    return
  }
  
  // 添加标签
  const newTags = [...props.modelValue, trimmedTag]
  emit('update:modelValue', newTags)
  emit('change', newTags)
  
  // 清空输入
  inputValue.value = ''
  showSuggestions.value = false
  focusedIndex.value = 0
}

/**
 * 删除标签
 */
const removeTag = (index: number) => {
  const newTags = [...props.modelValue]
  newTags.splice(index, 1)
  emit('update:modelValue', newTags)
  emit('change', newTags)
  
  // 聚焦输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
}

/**
 * 选择建议
 */
const selectSuggestion = (suggestion: string) => {
  addTag(suggestion)
  
  // 聚焦输入框
  nextTick(() => {
    inputRef.value?.focus()
  })
}

/**
 * 处理输入
 */
const handleInput = () => {
  // 检查是否包含分隔符
  const value = inputValue.value
  
  for (const separator of props.separators) {
    if (separator === 'Enter') continue // Enter 在 keydown 中处理
    
    if (value.includes(separator)) {
      const tags = value.split(separator).map(t => t.trim()).filter(t => t)
      
      if (tags.length > 0) {
        // 添加所有标签
        tags.forEach(tag => addTag(tag))
        inputValue.value = ''
        return
      }
    }
  }
  
  // 显示建议
  if (inputValue.value.trim()) {
    showSuggestions.value = true
    focusedIndex.value = 0
    nextTick(() => {
      updateSuggestionsPosition()
    })
  } else {
    showSuggestions.value = false
  }
}

/**
 * 处理键盘事件
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    
    // 如果有聚焦的建议，选择它
    if (showSuggestions.value && filteredSuggestions.value[focusedIndex.value]) {
      selectSuggestion(filteredSuggestions.value[focusedIndex.value])
    } else if (inputValue.value.trim()) {
      // 否则添加当前输入
      addTag(inputValue.value)
    }
  } else if (event.key === 'Backspace' && !inputValue.value && props.modelValue.length > 0) {
    // 如果输入为空且按下 Backspace，删除最后一个标签
    event.preventDefault()
    removeTag(props.modelValue.length - 1)
  } else if (event.key === 'ArrowDown') {
    // 只有在有建议时才处理箭头键
    if (showSuggestions.value && filteredSuggestions.value.length > 0) {
      event.preventDefault()
      moveFocus(1)
    }
  } else if (event.key === 'ArrowUp') {
    // 只有在有建议时才处理箭头键
    if (showSuggestions.value && filteredSuggestions.value.length > 0) {
      event.preventDefault()
      moveFocus(-1)
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    showSuggestions.value = false
    inputValue.value = ''
  }
}

/**
 * 移动焦点
 */
const moveFocus = (direction: number) => {
  const maxIndex = filteredSuggestions.value.length - 1
  let newIndex = focusedIndex.value + direction
  
  // 循环导航
  if (newIndex < 0) {
    newIndex = maxIndex
  } else if (newIndex > maxIndex) {
    newIndex = 0
  }
  
  focusedIndex.value = newIndex
  
  // 滚动到可见区域
  scrollToFocusedSuggestion()
}

/**
 * 滚动到聚焦的建议
 */
const scrollToFocusedSuggestion = () => {
  nextTick(() => {
    const focusedElement = suggestionsRef.value?.querySelectorAll('.tag-input-suggestion')[focusedIndex.value] as HTMLElement
    
    if (focusedElement && typeof focusedElement.scrollIntoView === 'function') {
      focusedElement.scrollIntoView({ block: 'nearest' })
    }
  })
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
  
  // 延迟关闭建议，以便点击建议时能够触发
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

/**
 * 更新建议位置
 */
const updateSuggestionsPosition = () => {
  if (!tagInputRef.value || !suggestionsRef.value) return
  
  const inputRect = tagInputRef.value.getBoundingClientRect()
  const suggestionsHeight = suggestionsRef.value.offsetHeight
  const viewportHeight = window.innerHeight
  
  const spaceBelow = viewportHeight - inputRect.bottom
  const spaceAbove = inputRect.top
  
  let top: number
  if (spaceBelow >= suggestionsHeight || spaceBelow >= spaceAbove) {
    top = inputRect.bottom + window.scrollY + 4
  } else {
    top = inputRect.top + window.scrollY - suggestionsHeight - 4
  }
  
  suggestionsStyle.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${inputRect.left + window.scrollX}px`,
    width: `${inputRect.width}px`,
    zIndex: '1000',
  }
}

/**
 * 处理外部点击
 */
const handleClickOutside = (event: MouseEvent) => {
  if (!showSuggestions.value) return
  
  const target = event.target as Node
  if (
    tagInputRef.value &&
    !tagInputRef.value.contains(target) &&
    suggestionsRef.value &&
    !suggestionsRef.value.contains(target)
  ) {
    showSuggestions.value = false
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (showSuggestions.value) {
    updateSuggestionsPosition()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize)
})
</script>

<style scoped>
/* 标签输入容器 */
.tag-input {
  width: 100%;
  min-height: 40px;
  padding: 4px 8px;
  background-color: var(--input-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  transition: all 0.2s;
  cursor: text;
}

.tag-input:hover:not(.tag-input-disabled) {
  border-color: var(--primary-color, #3b82f6);
}

.tag-input-focused {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
  border-color: var(--primary-color, #3b82f6);
}

.tag-input-disabled {
  background-color: var(--input-disabled-bg, #f3f4f6);
  cursor: not-allowed;
  opacity: 0.6;
}

/* 标签容器 */
.tag-input-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

/* 单个标签 */
.tag-input-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  color: white;
  font-weight: 500;
  transition: opacity 0.2s;
}

.tag-input-tag:hover {
  opacity: 0.9;
}

.tag-input-tag-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 删除按钮 */
.tag-input-tag-remove {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  transition: background-color 0.2s;
}

.tag-input-tag-remove:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

/* 输入框 */
.tag-input-field {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  padding: 4px 0;
}

.tag-input-field::placeholder {
  color: var(--text-tertiary, #9ca3af);
}

.tag-input-field:disabled {
  cursor: not-allowed;
}

/* 建议下拉菜单 */
.tag-input-suggestions {
  background-color: var(--menu-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

/* 单个建议 */
.tag-input-suggestion {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary, #1f2937);
  transition: background-color 0.15s;
}

.tag-input-suggestion:hover,
.tag-input-suggestion-focused {
  background-color: var(--hover-bg, #f3f4f6);
}

.tag-input-suggestion-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.tag-input-suggestion-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

/* 过渡动画 */
.suggestions-fade-enter-active,
.suggestions-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.suggestions-fade-enter-from,
.suggestions-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 暗色主题 */
:global(.dark) .tag-input,
:global(.dark) .tag-input-suggestions {
  --input-bg: #1f2937;
  --menu-bg: #1f2937;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-tertiary: #6b7280;
  --hover-bg: #374151;
  --input-disabled-bg: #374151;
}

/* 滚动条样式 */
.tag-input-suggestions::-webkit-scrollbar {
  width: 6px;
}

.tag-input-suggestions::-webkit-scrollbar-track {
  background: transparent;
}

.tag-input-suggestions::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #d1d5db);
  border-radius: 3px;
}

.tag-input-suggestions::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #9ca3af);
}
</style>
