<template>
  <div
    ref="dropdownRef"
    class="dropdown"
    :class="{ 'dropdown-open': isOpen, 'dropdown-disabled': disabled }"
  >
    <!-- 触发按钮 -->
    <button
      ref="triggerRef"
      type="button"
      class="dropdown-trigger"
      :class="{ 'dropdown-trigger-active': isOpen }"
      :aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-label="ariaLabel"
      :disabled="disabled"
      @click="toggleDropdown"
      @keydown="handleTriggerKeydown"
    >
      <span class="dropdown-trigger-text">
        <slot name="trigger" :selected="selectedItems">
          {{ displayText }}
        </slot>
      </span>
      <span class="dropdown-trigger-icon" :class="{ 'dropdown-trigger-icon-open': isOpen }">
        ▼
      </span>
    </button>

    <!-- 下拉菜单 -->
    <Teleport to="body">
      <Transition name="dropdown-fade">
        <div
          v-if="isOpen"
          ref="menuRef"
          class="dropdown-menu"
          :style="menuStyle"
          role="listbox"
          :aria-multiselectable="multiple"
          @keydown="handleMenuKeydown"
        >
          <!-- 搜索框 -->
          <div v-if="searchable" class="dropdown-search">
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="dropdown-search-input"
              :placeholder="searchPlaceholder"
              aria-label="搜索选项"
              @keydown.stop="handleSearchKeydown"
            />
          </div>

          <!-- 选项列表 -->
          <div class="dropdown-options" role="list">
            <div
              v-for="(option, index) in filteredOptions"
              :key="getOptionValue(option)"
              class="dropdown-option"
              :class="{
                'dropdown-option-selected': isSelected(option),
                'dropdown-option-focused': focusedIndex === index,
                'dropdown-option-disabled': isOptionDisabled(option)
              }"
              role="option"
              :aria-selected="isSelected(option)"
              :aria-disabled="isOptionDisabled(option)"
              @click="handleOptionClick(option)"
              @mouseenter="focusedIndex = index"
            >
              <!-- 多选复选框 -->
              <span v-if="multiple" class="dropdown-option-checkbox">
                <span v-if="isSelected(option)" class="dropdown-option-checkbox-checked">✓</span>
              </span>

              <!-- 选项内容 -->
              <span class="dropdown-option-content">
                <slot name="option" :option="option" :selected="isSelected(option)">
                  {{ getOptionLabel(option) }}
                </slot>
              </span>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredOptions.length === 0" class="dropdown-empty">
              <slot name="empty">
                {{ emptyText }}
              </slot>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

/**
 * Dropdown 组件
 * 
 * 通用下拉选择组件，支持单选/多选、搜索过滤、键盘导航
 * 
 * 验收标准：
 * - 需求 19.2: 支持完整的键盘导航（上下箭头、Enter、Esc）
 * - 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
 * - 需求 19.3: 确保焦点指示器清晰可见
 */

export interface DropdownOption {
  label?: string
  value: any
  disabled?: boolean
  [key: string]: any
}

interface Props {
  /** 当前选中的值（单选）或值数组（多选） */
  modelValue?: any | any[]
  /** 选项列表 */
  options: DropdownOption[] | string[] | number[]
  /** 是否多选 */
  multiple?: boolean
  /** 是否可搜索 */
  searchable?: boolean
  /** 搜索占位符 */
  searchPlaceholder?: string
  /** 空状态文本 */
  emptyText?: string
  /** 占位符文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** ARIA 标签 */
  ariaLabel?: string
  /** 选项标签字段名 */
  labelKey?: string
  /** 选项值字段名 */
  valueKey?: string
  /** 禁用字段名 */
  disabledKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  multiple: false,
  searchable: false,
  searchPlaceholder: '搜索...',
  emptyText: '无匹配选项',
  placeholder: '请选择',
  disabled: false,
  ariaLabel: '下拉选择',
  labelKey: 'label',
  valueKey: 'value',
  disabledKey: 'disabled',
})

interface Emits {
  (e: 'update:modelValue', value: any | any[]): void
  (e: 'change', value: any | any[]): void
}

const emit = defineEmits<Emits>()

// 引用
const dropdownRef = ref<HTMLElement>()
const triggerRef = ref<HTMLButtonElement>()
const menuRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()

// 状态
const isOpen = ref(false)
const searchQuery = ref('')
const focusedIndex = ref(0)
const menuStyle = ref<Record<string, string>>({})

/**
 * 获取选项的标签
 */
const getOptionLabel = (option: any): string => {
  if (typeof option === 'string' || typeof option === 'number') {
    return String(option)
  }
  return option[props.labelKey] || String(option[props.valueKey])
}

/**
 * 获取选项的值
 */
const getOptionValue = (option: any): any => {
  if (typeof option === 'string' || typeof option === 'number') {
    return option
  }
  return option[props.valueKey]
}

/**
 * 检查选项是否禁用
 */
const isOptionDisabled = (option: any): boolean => {
  if (typeof option === 'object') {
    return option[props.disabledKey] === true
  }
  return false
}

/**
 * 过滤后的选项列表
 */
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value) {
    return props.options
  }

  const query = searchQuery.value.toLowerCase()
  return props.options.filter((option) => {
    const label = getOptionLabel(option).toLowerCase()
    return label.includes(query)
  })
})

/**
 * 选中的项目
 */
const selectedItems = computed(() => {
  if (props.multiple) {
    const values = Array.isArray(props.modelValue) ? props.modelValue : []
    return props.options.filter((option) => 
      values.includes(getOptionValue(option))
    )
  } else {
    return props.options.find((option) => 
      getOptionValue(option) === props.modelValue
    )
  }
})

/**
 * 显示文本
 */
const displayText = computed(() => {
  if (props.multiple) {
    const items = selectedItems.value as any[]
    if (items.length === 0) {
      return props.placeholder
    }
    return items.map(getOptionLabel).join(', ')
  } else {
    const item = selectedItems.value
    if (!item) {
      return props.placeholder
    }
    return getOptionLabel(item)
  }
})

/**
 * 检查选项是否被选中
 */
const isSelected = (option: any): boolean => {
  const value = getOptionValue(option)
  if (props.multiple) {
    const values = Array.isArray(props.modelValue) ? props.modelValue : []
    return values.includes(value)
  } else {
    return props.modelValue === value
  }
}

/**
 * 切换下拉菜单
 */
const toggleDropdown = () => {
  if (props.disabled) return
  
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

/**
 * 打开下拉菜单
 */
const openDropdown = async () => {
  isOpen.value = true
  
  await nextTick()
  
  // 计算菜单位置
  updateMenuPosition()
  
  // 如果可搜索，聚焦搜索框
  if (props.searchable) {
    searchInputRef.value?.focus()
  } else {
    menuRef.value?.focus()
  }
  
  // 重置焦点索引
  focusedIndex.value = 0
}

/**
 * 关闭下拉菜单
 */
const closeDropdown = () => {
  isOpen.value = false
  searchQuery.value = ''
  focusedIndex.value = 0
  
  // 返回焦点到触发按钮
  triggerRef.value?.focus()
}

/**
 * 更新菜单位置
 */
const updateMenuPosition = () => {
  if (!triggerRef.value || !menuRef.value) return
  
  const triggerRect = triggerRef.value.getBoundingClientRect()
  const menuHeight = menuRef.value.offsetHeight
  const viewportHeight = window.innerHeight
  
  // 判断是否有足够空间在下方显示
  const spaceBelow = viewportHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top
  
  let top: number
  if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
    // 在下方显示
    top = triggerRect.bottom + window.scrollY
  } else {
    // 在上方显示
    top = triggerRect.top + window.scrollY - menuHeight
  }
  
  menuStyle.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${triggerRect.left + window.scrollX}px`,
    width: `${triggerRect.width}px`,
    zIndex: '1000',
  }
}

/**
 * 处理选项点击
 */
const handleOptionClick = (option: any) => {
  if (isOptionDisabled(option)) return
  
  const value = getOptionValue(option)
  
  if (props.multiple) {
    const values = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = values.indexOf(value)
    
    if (index > -1) {
      values.splice(index, 1)
    } else {
      values.push(value)
    }
    
    emit('update:modelValue', values)
    emit('change', values)
  } else {
    emit('update:modelValue', value)
    emit('change', value)
    closeDropdown()
  }
}

/**
 * 处理触发按钮键盘事件
 */
const handleTriggerKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
    event.preventDefault()
    if (!isOpen.value) {
      openDropdown()
    }
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (!isOpen.value) {
      openDropdown()
    }
  }
}

/**
 * 处理菜单键盘事件
 */
const handleMenuKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      moveFocus(1)
      break
    case 'ArrowUp':
      event.preventDefault()
      moveFocus(-1)
      break
    case 'Enter':
      event.preventDefault()
      if (filteredOptions.value[focusedIndex.value]) {
        handleOptionClick(filteredOptions.value[focusedIndex.value])
      }
      break
    case 'Escape':
      event.preventDefault()
      closeDropdown()
      break
    case 'Home':
      event.preventDefault()
      focusedIndex.value = 0
      break
    case 'End':
      event.preventDefault()
      focusedIndex.value = filteredOptions.value.length - 1
      break
  }
}

/**
 * 处理搜索框键盘事件
 */
const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    menuRef.value?.focus()
    handleMenuKeydown(event)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeDropdown()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    if (filteredOptions.value[focusedIndex.value]) {
      handleOptionClick(filteredOptions.value[focusedIndex.value])
    }
  }
}

/**
 * 移动焦点
 */
const moveFocus = (direction: number) => {
  const maxIndex = filteredOptions.value.length - 1
  let newIndex = focusedIndex.value + direction
  
  // 循环导航
  if (newIndex < 0) {
    newIndex = maxIndex
  } else if (newIndex > maxIndex) {
    newIndex = 0
  }
  
  // 跳过禁用的选项
  while (isOptionDisabled(filteredOptions.value[newIndex]) && newIndex !== focusedIndex.value) {
    newIndex += direction
    if (newIndex < 0) {
      newIndex = maxIndex
    } else if (newIndex > maxIndex) {
      newIndex = 0
    }
  }
  
  focusedIndex.value = newIndex
  
  // 滚动到可见区域
  scrollToFocusedOption()
}

/**
 * 滚动到聚焦的选项
 */
const scrollToFocusedOption = () => {
  nextTick(() => {
    const optionsContainer = menuRef.value?.querySelector('.dropdown-options') as HTMLElement
    const focusedOption = menuRef.value?.querySelectorAll('.dropdown-option')[focusedIndex.value] as HTMLElement
    
    if (optionsContainer && focusedOption) {
      const containerRect = optionsContainer.getBoundingClientRect()
      const optionRect = focusedOption.getBoundingClientRect()
      
      if (optionRect.bottom > containerRect.bottom) {
        focusedOption.scrollIntoView({ block: 'nearest' })
      } else if (optionRect.top < containerRect.top) {
        focusedOption.scrollIntoView({ block: 'nearest' })
      }
    }
  })
}

/**
 * 处理外部点击
 */
const handleClickOutside = (event: MouseEvent) => {
  if (!isOpen.value) return
  
  const target = event.target as Node
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(target) &&
    menuRef.value &&
    !menuRef.value.contains(target)
  ) {
    closeDropdown()
  }
}

// 监听搜索查询变化，重置焦点索引
watch(searchQuery, () => {
  focusedIndex.value = 0
})

// 监听窗口大小变化，更新菜单位置
const handleResize = () => {
  if (isOpen.value) {
    updateMenuPosition()
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
/* 下拉容器 */
.dropdown {
  position: relative;
  display: inline-block;
  width: 100%;
}

.dropdown-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 触发按钮 */
.dropdown-trigger {
  width: 100%;
  padding: 8px 12px;
  background-color: var(--input-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  transition: all 0.2s;
  text-align: left;
}

.dropdown-trigger:hover:not(:disabled) {
  border-color: var(--primary-color, #3b82f6);
}

.dropdown-trigger:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.dropdown-trigger:disabled {
  cursor: not-allowed;
  background-color: var(--input-disabled-bg, #f3f4f6);
}

.dropdown-trigger-active {
  border-color: var(--primary-color, #3b82f6);
}

.dropdown-trigger-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-trigger-icon {
  font-size: 10px;
  color: var(--text-secondary, #6b7280);
  transition: transform 0.2s;
}

.dropdown-trigger-icon-open {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.dropdown-menu {
  background-color: var(--menu-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 搜索框 */
.dropdown-search {
  padding: 8px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  flex-shrink: 0;
}

.dropdown-search-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  background-color: var(--input-bg, #ffffff);
}

.dropdown-search-input:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: -1px;
}

/* 选项列表 */
.dropdown-options {
  overflow-y: auto;
  flex: 1;
}

.dropdown-option {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary, #1f2937);
  transition: background-color 0.15s;
}

.dropdown-option:hover:not(.dropdown-option-disabled) {
  background-color: var(--hover-bg, #f3f4f6);
}

.dropdown-option-focused:not(.dropdown-option-disabled) {
  background-color: var(--hover-bg, #f3f4f6);
}

.dropdown-option-selected {
  background-color: var(--selected-bg, #eff6ff);
  color: var(--primary-color, #3b82f6);
}

.dropdown-option-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-option-checkbox {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dropdown-option-selected .dropdown-option-checkbox {
  background-color: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
}

.dropdown-option-checkbox-checked {
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.dropdown-option-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.dropdown-empty {
  padding: 16px 12px;
  text-align: center;
  color: var(--text-secondary, #6b7280);
  font-size: 14px;
}

/* 过渡动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 暗色主题 */
:global(.dark) .dropdown-trigger,
:global(.dark) .dropdown-menu,
:global(.dark) .dropdown-search-input {
  --input-bg: #1f2937;
  --menu-bg: #1f2937;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --hover-bg: #374151;
  --selected-bg: #1e3a8a;
  --input-disabled-bg: #374151;
}

/* 滚动条样式 */
.dropdown-options::-webkit-scrollbar {
  width: 6px;
}

.dropdown-options::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-options::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #d1d5db);
  border-radius: 3px;
}

.dropdown-options::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #9ca3af);
}
</style>
