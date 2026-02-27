<template>
  <div class="view-selector" role="tablist" aria-label="视图选择器">
    <button
      v-for="view in views"
      :key="view.type"
      class="view-selector-item"
      :class="{ 'view-selector-item-active': currentView === view.type }"
      role="tab"
      :aria-selected="currentView === view.type"
      :aria-current="currentView === view.type ? 'true' : undefined"
      :aria-label="`${view.label}视图，${getCount(view.type)} 个任务`"
      :title="`${view.label} (${view.shortcut})`"
      @click="handleSelect(view.type)"
    >
      <span class="view-selector-icon" aria-hidden="true">{{ view.icon }}</span>
      <span class="view-selector-label">{{ view.label }}</span>
      <span
        v-if="getCount(view.type) > 0"
        class="view-selector-count"
        aria-hidden="true"
      >
        {{ getCount(view.type) }}
      </span>
      <kbd class="view-selector-shortcut" aria-hidden="true">{{ view.shortcut }}</kbd>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * ViewSelector 组件
 *
 * 显示预定义视图列表，支持数字键 1-4 快捷切换，高亮当前视图，显示各视图的任务数量
 *
 * 验收标准：
 * - 需求 8.1: 提供内置视图（今天、即将到来、收件箱、所有任务）
 * - 需求 8.2: "今天"视图显示截止日期为今天的所有未完成任务
 * - 需求 8.3: "即将到来"视图显示未来 7 天内截止的所有未完成任务
 * - 需求 8.4: "收件箱"视图显示默认项目中的所有任务
 * - 需求 14.6: 支持使用数字键 1-4 快速切换视图
 */

import { onMounted, onUnmounted } from 'vue'
import type { ViewType } from '@/types'

interface ViewOption {
  type: ViewType
  label: string
  icon: string
  shortcut: string
}

interface Props {
  /** 当前选中的视图 */
  currentView: ViewType
  /** 各视图的任务数量 { today: 3, upcoming: 5, inbox: 10, all: 20 } */
  viewCounts?: Record<ViewType, number>
}

const props = withDefaults(defineProps<Props>(), {
  viewCounts: () => ({ today: 0, upcoming: 0, inbox: 0, all: 0 }),
})

interface Emits {
  (e: 'change', view: ViewType): void
}

const emit = defineEmits<Emits>()

/**
 * 预定义视图列表
 */
const views: ViewOption[] = [
  { type: 'today', label: '今天', icon: '📅', shortcut: '1' },
  { type: 'upcoming', label: '即将到来', icon: '📆', shortcut: '2' },
  { type: 'inbox', label: '收件箱', icon: '📥', shortcut: '3' },
  { type: 'all', label: '所有任务', icon: '📋', shortcut: '4' },
]

/**
 * 快捷键到视图的映射
 */
const shortcutMap: Record<string, ViewType> = {
  '1': 'today',
  '2': 'upcoming',
  '3': 'inbox',
  '4': 'all',
}

/**
 * 获取视图的任务数量
 */
const getCount = (type: ViewType): number => {
  return props.viewCounts[type] ?? 0
}

/**
 * 选择视图
 */
const handleSelect = (view: ViewType): void => {
  emit('change', view)
}

/**
 * 键盘快捷键处理
 */
const handleKeyDown = (event: KeyboardEvent): void => {
  // 在输入框中不响应快捷键
  const target = event.target as HTMLElement
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  ) {
    return
  }

  const view = shortcutMap[event.key]
  if (view) {
    event.preventDefault()
    handleSelect(view)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
/* 视图选择器容器 */
.view-selector {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
}

/* 视图选项 */
.view-selector-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-primary, #1f2937);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.view-selector-item:hover {
  background-color: var(--hover-bg, #f3f4f6);
}

.view-selector-item:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 激活状态 */
.view-selector-item-active {
  background-color: var(--active-bg, #eff6ff);
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
}

.view-selector-item-active:hover {
  background-color: var(--active-hover-bg, #dbeafe);
}

/* 图标 */
.view-selector-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

/* 标签 */
.view-selector-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 任务数量徽章 */
.view-selector-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background-color: var(--badge-bg, #e5e7eb);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--badge-text, #6b7280);
  flex-shrink: 0;
}

.view-selector-item-active .view-selector-count {
  background-color: var(--badge-active-bg, #bfdbfe);
  color: var(--primary-color, #3b82f6);
}

/* 快捷键提示 */
.view-selector-shortcut {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: var(--kbd-bg, #f3f4f6);
  border: 1px solid var(--kbd-border, #e5e7eb);
  border-radius: 4px;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-secondary, #9ca3af);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.view-selector:hover .view-selector-shortcut {
  opacity: 1;
}

/* 暗色主题 */
:global(.dark) .view-selector-item {
  color: var(--text-primary, #f9fafb);
}

:global(.dark) .view-selector-item:hover {
  background-color: #374151;
}

:global(.dark) .view-selector-item-active {
  background-color: #1e3a5f;
  color: #93c5fd;
}

:global(.dark) .view-selector-item-active:hover {
  background-color: #1e3a5f;
}

:global(.dark) .view-selector-count {
  background-color: #374151;
  color: #9ca3af;
}

:global(.dark) .view-selector-item-active .view-selector-count {
  background-color: #1e3a5f;
  color: #93c5fd;
}

:global(.dark) .view-selector-shortcut {
  background-color: #374151;
  border-color: #4b5563;
  color: #6b7280;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .view-selector {
    padding: 0 6px;
    gap: 2px;
  }

  .view-selector-item {
    padding: 8px 10px;
    font-size: 13px;
  }

  .view-selector-shortcut {
    display: none;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .view-selector-item,
  .view-selector-shortcut {
    transition: none;
  }
}
</style>
