<template>
  <div class="filter-panel" role="region" aria-label="过滤面板">
    <!-- 面板标题 -->
    <div class="filter-panel-header">
      <h3 class="filter-panel-title">过滤条件</h3>
      <div class="filter-panel-actions">
        <span
          v-if="activeFilterCount > 0"
          class="filter-badge"
          :aria-label="`${activeFilterCount} 个活动过滤条件`"
        >
          {{ activeFilterCount }}
        </span>
        <button
          v-if="activeFilterCount > 0"
          class="filter-clear-btn"
          title="清除所有过滤条件"
          aria-label="清除所有过滤条件"
          @click="handleClearAll"
        >
          ✕ 清除
        </button>
      </div>
    </div>

    <!-- 完成状态过滤 -->
    <div class="filter-section" role="group" aria-labelledby="filter-status-label">
      <h4 id="filter-status-label" class="filter-section-title">完成状态</h4>
      <div class="filter-status-group">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          class="filter-status-btn"
          :class="{ 'filter-status-btn-active': currentStatus === option.value }"
          :aria-pressed="currentStatus === option.value"
          :aria-label="`按${option.label}过滤`"
          @click="handleStatusChange(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- 优先级过滤 -->
    <div class="filter-section" role="group" aria-labelledby="filter-priority-label">
      <h4 id="filter-priority-label" class="filter-section-title">优先级</h4>
      <div class="filter-priority-group">
        <button
          v-for="option in priorityOptions"
          :key="option.value"
          class="filter-priority-btn"
          :class="[
            `filter-priority-${option.value}`,
            { 'filter-priority-btn-active': selectedPriorities.includes(option.value) }
          ]"
          :aria-pressed="selectedPriorities.includes(option.value)"
          :aria-label="`${option.label}优先级`"
          @click="handlePriorityToggle(option.value)"
        >
          <span class="filter-priority-dot" aria-hidden="true"></span>
          {{ option.label }}
        </button>
      </div>
    </div>

    <!-- 标签过滤 -->
    <div class="filter-section" role="group" aria-labelledby="filter-tags-label">
      <h4 id="filter-tags-label" class="filter-section-title">标签</h4>
      <div v-if="availableTags.length > 0" class="filter-tags-group">
        <button
          v-for="tag in availableTags"
          :key="tag"
          class="filter-tag-btn"
          :class="{ 'filter-tag-btn-active': selectedTags.includes(tag) }"
          :aria-pressed="selectedTags.includes(tag)"
          :aria-label="`标签: ${tag}`"
          @click="handleTagToggle(tag)"
        >
          #{{ tag }}
        </button>
      </div>
      <p v-else class="filter-empty-hint">暂无标签</p>
    </div>

    <!-- 保存为智能列表 -->
    <div v-if="activeFilterCount > 0" class="filter-section filter-save-section">
      <button
        class="filter-save-btn"
        title="保存当前过滤条件为智能列表"
        aria-label="保存当前过滤条件为智能列表"
        @click="handleSaveAsSmartList"
      >
        💾 保存为智能列表
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * FilterPanel 组件
 *
 * 提供优先级、标签、完成状态过滤选项，支持多条件组合和保存为智能列表
 *
 * 验收标准：
 * - 需求 8.5: 允许用户按优先级过滤任务
 * - 需求 8.6: 允许用户按标签过滤任务
 * - 需求 8.7: 允许用户按完成状态过滤任务
 * - 需求 8.8: 支持多条件组合过滤
 * - 需求 8.10: 允许用户保存自定义过滤条件为智能列表
 */

import { computed } from 'vue'
import type { Priority, TaskFilter } from '@/types'

interface PriorityOption {
  value: Priority
  label: string
}

interface StatusOption {
  value: 'all' | 'incomplete' | 'completed'
  label: string
}

interface Props {
  /** 当前过滤条件 */
  filter: TaskFilter
  /** 所有可用标签 */
  availableTags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  availableTags: () => [],
})

interface Emits {
  (e: 'update:filter', filter: TaskFilter): void
  (e: 'clear'): void
  (e: 'saveSmartList', filter: TaskFilter): void
}

const emit = defineEmits<Emits>()

/**
 * 优先级选项
 */
const priorityOptions: PriorityOption[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
  { value: 'none', label: '无' },
]

/**
 * 完成状态选项
 */
const statusOptions: StatusOption[] = [
  { value: 'all', label: '全部' },
  { value: 'incomplete', label: '未完成' },
  { value: 'completed', label: '已完成' },
]

/**
 * 当前选中的优先级列表
 */
const selectedPriorities = computed((): Priority[] => {
  return props.filter.priority ?? []
})

/**
 * 当前选中的标签列表
 */
const selectedTags = computed((): string[] => {
  return props.filter.tags ?? []
})

/**
 * 当前完成状态
 */
const currentStatus = computed((): 'all' | 'incomplete' | 'completed' => {
  if (props.filter.completed === undefined) return 'all'
  return props.filter.completed ? 'completed' : 'incomplete'
})

/**
 * 活动过滤条件数量
 */
const activeFilterCount = computed((): number => {
  let count = 0
  if (selectedPriorities.value.length > 0) count++
  if (selectedTags.value.length > 0) count++
  if (props.filter.completed !== undefined) count++
  return count
})

/**
 * 切换优先级过滤
 */
function handlePriorityToggle(priority: Priority): void {
  const current = [...selectedPriorities.value]
  const index = current.indexOf(priority)
  if (index >= 0) {
    current.splice(index, 1)
  } else {
    current.push(priority)
  }
  emitFilterUpdate({ priority: current.length > 0 ? current : undefined })
}

/**
 * 切换标签过滤
 */
function handleTagToggle(tag: string): void {
  const current = [...selectedTags.value]
  const index = current.indexOf(tag)
  if (index >= 0) {
    current.splice(index, 1)
  } else {
    current.push(tag)
  }
  emitFilterUpdate({ tags: current.length > 0 ? current : undefined })
}

/**
 * 切换完成状态过滤
 */
function handleStatusChange(status: 'all' | 'incomplete' | 'completed'): void {
  let completed: boolean | undefined
  if (status === 'completed') completed = true
  else if (status === 'incomplete') completed = false
  else completed = undefined
  emitFilterUpdate({ completed })
}

/**
 * 发出过滤条件更新事件
 */
function emitFilterUpdate(updates: Partial<TaskFilter>): void {
  const newFilter: TaskFilter = { ...props.filter, ...updates }
  // 清理 undefined 值
  if (!newFilter.priority?.length) delete newFilter.priority
  if (!newFilter.tags?.length) delete newFilter.tags
  emit('update:filter', newFilter)
}

/**
 * 清除所有过滤条件
 */
function handleClearAll(): void {
  emit('clear')
}

/**
 * 保存为智能列表
 */
function handleSaveAsSmartList(): void {
  emit('saveSmartList', { ...props.filter })
}
</script>

<style scoped>
/* 过滤面板容器 */
.filter-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
}

/* 面板标题 */
.filter-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

.filter-panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 活动过滤条件徽章 */
.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: var(--primary-color, #3b82f6);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

/* 清除按钮 */
.filter-clear-btn {
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-clear-btn:hover {
  background-color: var(--hover-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

/* 过滤分区 */
.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-section-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 完成状态按钮组 */
.filter-status-group {
  display: flex;
  gap: 4px;
  background-color: var(--hover-bg, #f3f4f6);
  border-radius: 8px;
  padding: 3px;
}

.filter-status-btn {
  flex: 1;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-status-btn:hover {
  color: var(--text-primary, #1f2937);
}

.filter-status-btn-active {
  background-color: #fff;
  color: var(--text-primary, #1f2937);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 优先级按钮组 */
.filter-priority-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-priority-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: transparent;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 16px;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-priority-btn:hover {
  border-color: var(--text-secondary, #9ca3af);
}

.filter-priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.filter-priority-high .filter-priority-dot { background-color: #ef4444; }
.filter-priority-medium .filter-priority-dot { background-color: #f59e0b; }
.filter-priority-low .filter-priority-dot { background-color: #3b82f6; }
.filter-priority-none .filter-priority-dot { background-color: #9ca3af; }

.filter-priority-btn-active {
  border-color: var(--primary-color, #3b82f6);
  background-color: var(--active-bg, #eff6ff);
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
}

.filter-priority-btn-active.filter-priority-high {
  border-color: #ef4444;
  background-color: #fef2f2;
  color: #dc2626;
}

.filter-priority-btn-active.filter-priority-medium {
  border-color: #f59e0b;
  background-color: #fffbeb;
  color: #d97706;
}

.filter-priority-btn-active.filter-priority-low {
  border-color: #3b82f6;
  background-color: #eff6ff;
  color: #2563eb;
}

.filter-priority-btn-active.filter-priority-none {
  border-color: #6b7280;
  background-color: #f9fafb;
  color: #4b5563;
}

/* 标签按钮组 */
.filter-tags-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-tag-btn {
  padding: 4px 10px;
  background: transparent;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 16px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-tag-btn:hover {
  border-color: var(--text-secondary, #9ca3af);
}

.filter-tag-btn-active {
  border-color: var(--primary-color, #3b82f6);
  background-color: var(--active-bg, #eff6ff);
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
}

.filter-empty-hint {
  font-size: 12px;
  color: var(--text-secondary, #9ca3af);
  margin: 0;
}

/* 保存为智能列表 */
.filter-save-section {
  padding-top: 8px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.filter-save-btn {
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: 1px dashed var(--border-color, #d1d5db);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-save-btn:hover {
  border-color: var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
  background-color: var(--active-bg, #eff6ff);
}

/* 暗色主题 */
:global(.dark) .filter-panel-title {
  color: #f9fafb;
}

:global(.dark) .filter-clear-btn {
  color: #9ca3af;
}

:global(.dark) .filter-clear-btn:hover {
  background-color: #374151;
  color: #f9fafb;
}

:global(.dark) .filter-status-group {
  background-color: #374151;
}

:global(.dark) .filter-status-btn {
  color: #9ca3af;
}

:global(.dark) .filter-status-btn:hover {
  color: #f9fafb;
}

:global(.dark) .filter-status-btn-active {
  background-color: #4b5563;
  color: #f9fafb;
  box-shadow: none;
}

:global(.dark) .filter-priority-btn {
  border-color: #4b5563;
  color: #9ca3af;
}

:global(.dark) .filter-priority-btn:hover {
  border-color: #6b7280;
}

:global(.dark) .filter-priority-btn-active {
  border-color: #60a5fa;
  background-color: #1e3a5f;
  color: #93c5fd;
}

:global(.dark) .filter-priority-btn-active.filter-priority-high {
  border-color: #f87171;
  background-color: #451a1a;
  color: #fca5a5;
}

:global(.dark) .filter-priority-btn-active.filter-priority-medium {
  border-color: #fbbf24;
  background-color: #451a03;
  color: #fcd34d;
}

:global(.dark) .filter-priority-btn-active.filter-priority-low {
  border-color: #60a5fa;
  background-color: #1e3a5f;
  color: #93c5fd;
}

:global(.dark) .filter-priority-btn-active.filter-priority-none {
  border-color: #6b7280;
  background-color: #374151;
  color: #d1d5db;
}

:global(.dark) .filter-tag-btn {
  border-color: #4b5563;
  color: #9ca3af;
}

:global(.dark) .filter-tag-btn:hover {
  border-color: #6b7280;
}

:global(.dark) .filter-tag-btn-active {
  border-color: #60a5fa;
  background-color: #1e3a5f;
  color: #93c5fd;
}

:global(.dark) .filter-empty-hint {
  color: #6b7280;
}

:global(.dark) .filter-save-section {
  border-top-color: #374151;
}

:global(.dark) .filter-save-btn {
  border-color: #4b5563;
  color: #9ca3af;
}

:global(.dark) .filter-save-btn:hover {
  border-color: #60a5fa;
  color: #93c5fd;
  background-color: #1e3a5f;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .filter-panel {
    padding: 8px;
    gap: 12px;
  }

  .filter-priority-group,
  .filter-tags-group {
    gap: 4px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .filter-status-btn,
  .filter-priority-btn,
  .filter-tag-btn,
  .filter-clear-btn,
  .filter-save-btn {
    transition: none;
  }
}
</style>
