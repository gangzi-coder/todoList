<template>
  <div class="sort-selector" role="group" aria-label="排序选择器">
    <div class="sort-selector-header">
      <h4 class="sort-selector-title">排序方式</h4>
      <button
        class="sort-direction-btn"
        :title="sortAscending ? '当前：升序，点击切换为降序' : '当前：降序，点击切换为升序'"
        :aria-label="sortAscending ? '升序排列，点击切换为降序' : '降序排列，点击切换为升序'"
        @click="handleToggleDirection"
      >
        <span aria-hidden="true">{{ sortAscending ? '↑' : '↓' }}</span>
        {{ sortAscending ? '升序' : '降序' }}
      </button>
    </div>
    <div class="sort-options">
      <button
        v-for="option in sortOptions"
        :key="option.value"
        class="sort-option-btn"
        :class="{ 'sort-option-btn-active': currentSort === option.value }"
        :aria-pressed="currentSort === option.value"
        :aria-label="`按${option.label}排序`"
        @click="handleSortChange(option.value)"
      >
        <span class="sort-option-icon" aria-hidden="true">{{ option.icon }}</span>
        <span class="sort-option-label">{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SortSelector 组件
 *
 * 提供排序选项（创建时间、截止日期、优先级、标题），支持升序/降序切换
 *
 * 验收标准：
 * - 需求 8.9: 支持按创建时间、截止日期、优先级、标题字母顺序排序
 */

import type { SortOption } from '@/types'

interface SortOptionItem {
  value: SortOption
  label: string
  icon: string
}

interface Props {
  /** 当前排序方式 */
  currentSort: SortOption
  /** 是否升序 */
  sortAscending?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sortAscending: true,
})

interface Emits {
  (e: 'change', payload: { sortBy: SortOption; direction: 'asc' | 'desc' }): void
}

const emit = defineEmits<Emits>()

/**
 * 排序选项列表
 */
const sortOptions: SortOptionItem[] = [
  { value: 'createdAt', label: '创建时间', icon: '🕐' },
  { value: 'dueDate', label: '截止日期', icon: '📅' },
  { value: 'priority', label: '优先级', icon: '🔥' },
  { value: 'title', label: '标题', icon: '🔤' },
]

/**
 * 切换排序方式
 */
function handleSortChange(sortBy: SortOption): void {
  if (sortBy === props.currentSort) {
    // 点击相同排序选项时切换方向
    const newDirection = props.sortAscending ? 'desc' : 'asc'
    emit('change', { sortBy, direction: newDirection })
  } else {
    // 切换到新排序选项时默认升序
    emit('change', { sortBy, direction: 'asc' })
  }
}

/**
 * 切换排序方向
 */
function handleToggleDirection(): void {
  const newDirection = props.sortAscending ? 'desc' : 'asc'
  emit('change', { sortBy: props.currentSort, direction: newDirection })
}
</script>

<style scoped>
/* 排序选择器容器 */
.sort-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

/* 标题行 */
.sort-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sort-selector-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 排序方向按钮 */
.sort-direction-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.sort-direction-btn:hover {
  border-color: var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
  background-color: var(--active-bg, #eff6ff);
}

.sort-direction-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 排序选项列表 */
.sort-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 排序选项按钮 */
.sort-option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.sort-option-btn:hover {
  background-color: var(--hover-bg, #f3f4f6);
}

.sort-option-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 激活状态 */
.sort-option-btn-active {
  background-color: var(--active-bg, #eff6ff);
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
}

.sort-option-btn-active:hover {
  background-color: var(--active-hover-bg, #dbeafe);
}

/* 图标 */
.sort-option-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

/* 标签 */
.sort-option-label {
  flex: 1;
}

/* 暗色主题 */
:global(.dark) .sort-selector-title {
  color: #9ca3af;
}

:global(.dark) .sort-direction-btn {
  border-color: #4b5563;
  color: #9ca3af;
}

:global(.dark) .sort-direction-btn:hover {
  border-color: #60a5fa;
  color: #93c5fd;
  background-color: #1e3a5f;
}

:global(.dark) .sort-option-btn {
  color: #f9fafb;
}

:global(.dark) .sort-option-btn:hover {
  background-color: #374151;
}

:global(.dark) .sort-option-btn-active {
  background-color: #1e3a5f;
  color: #93c5fd;
}

:global(.dark) .sort-option-btn-active:hover {
  background-color: #1e3a5f;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .sort-selector {
    padding: 8px;
  }

  .sort-option-btn {
    padding: 6px 8px;
    font-size: 12px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .sort-direction-btn,
  .sort-option-btn {
    transition: none;
  }
}
</style>
