<!--
  SearchBar 搜索栏组件

  验收标准：
  - 需求 9.1: 提供全局搜索功能
  - 需求 9.2: 在任务标题、备注、标签中搜索
  - 需求 9.3: 实时显示搜索结果
  - 需求 9.4: 在搜索结果中高亮显示匹配的关键词
  - 需求 9.5: 显示搜索结果的任务数量
  - 需求 9.6: 搜索结果为空时显示提示
  - 需求 9.7: 支持 Ctrl+F / Cmd+F 快捷键打开搜索
  - 需求 9.8: 清空搜索框时返回之前的视图
-->

<template>
  <div class="search-bar" role="search" aria-label="搜索任务">
    <!-- 搜索触发按钮（搜索未激活时显示） -->
    <button
      v-if="!isActive"
      class="search-trigger-btn"
      title="搜索任务 (Ctrl+F)"
      aria-label="打开搜索"
      @click="activate"
    >
      <span class="search-icon">🔍</span>
      <span class="search-trigger-text">搜索...</span>
    </button>

    <!-- 搜索输入区域（搜索激活时显示） -->
    <div v-else class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        ref="inputRef"
        class="search-input"
        type="text"
        :value="searchQuery"
        placeholder="搜索任务标题、备注、标签..."
        aria-label="搜索关键词"
        @input="handleInput"
        @keydown.escape="deactivate"
      />
      <!-- 结果数量 -->
      <span
        v-if="searchQuery.trim()"
        class="search-result-count"
        aria-live="polite"
      >
        {{ searchResultCount }} 个结果
      </span>
      <!-- 清除按钮 -->
      <button
        class="search-clear-btn"
        title="关闭搜索 (Esc)"
        aria-label="关闭搜索"
        @click="deactivate"
      >
        ✕
      </button>
    </div>

    <!-- 搜索结果列表 -->
    <div
      v-if="isActive && searchQuery.trim()"
      class="search-results"
      role="listbox"
      aria-label="搜索结果"
    >
      <!-- 空结果提示 -->
      <div v-if="!hasResults" class="search-empty">
        未找到匹配任务
      </div>

      <!-- 结果列表 -->
      <div
        v-for="task in searchResults"
        :key="task.id"
        class="search-result-item"
        role="option"
        :aria-label="task.title"
        @click="$emit('selectTask', task.id)"
      >
        <span
          class="search-result-title"
          v-html="highlightMatch(task.title)"
        />
        <span
          v-if="task.notes && isMatch(task.notes)"
          class="search-result-notes"
          v-html="highlightMatch(task.notes)"
        />
        <div v-if="matchingTags(task).length" class="search-result-tags">
          <span
            v-for="tag in matchingTags(task)"
            :key="tag"
            class="search-result-tag"
            v-html="'#' + highlightMatch(tag)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SearchBar 搜索栏组件
 *
 * 集成 useSearch composable，提供全局搜索功能
 */
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { useSearch } from '@/composables/useSearch'
import type { Task } from '@/types'

const emit = defineEmits<{
  /** 选择搜索结果中的任务 */
  (e: 'selectTask', taskId: string): void
}>()

const {
  searchQuery,
  searchResults,
  searchResultCount,
  hasResults,
  setSearchQuery,
  clearSearch,
  highlightMatch,
  isMatch,
} = useSearch()

/** 搜索是否激活 */
const isActive = ref(false)

/** 输入框引用 */
const inputRef = ref<HTMLInputElement | null>(null)

/**
 * 获取任务中匹配的标签
 */
function matchingTags(task: Task): string[] {
  return task.tags.filter(tag => isMatch(tag))
}

/**
 * 激活搜索
 */
async function activate(): Promise<void> {
  isActive.value = true
  await nextTick()
  inputRef.value?.focus()
}

/**
 * 关闭搜索
 */
function deactivate(): void {
  isActive.value = false
  clearSearch()
}

/**
 * 处理输入
 */
function handleInput(event: Event): void {
  const target = event.target as HTMLInputElement
  setSearchQuery(target.value)
}

/**
 * 处理 Ctrl+F / Cmd+F 快捷键
 */
function handleKeyDown(event: KeyboardEvent): void {
  const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  const modifier = isMac ? event.metaKey : event.ctrlKey

  if (modifier && event.key === 'f') {
    event.preventDefault()
    activate()
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
.search-bar {
  position: relative;
}

.search-trigger-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-secondary, #888);
  cursor: pointer;
  font-size: 13px;
  transition: border-color 0.2s, background-color 0.2s;
}

.search-trigger-btn:hover {
  border-color: var(--primary-color, #4a90d9);
  background: var(--bg-primary, #fff);
}

.search-icon {
  font-size: 14px;
}

.search-trigger-text {
  font-size: 13px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--primary-color, #4a90d9);
  border-radius: 6px;
  background: var(--bg-primary, #fff);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  background: transparent;
  color: var(--text-primary, #333);
  min-width: 120px;
}

.search-input::placeholder {
  color: var(--text-secondary, #888);
}

.search-result-count {
  font-size: 12px;
  color: var(--text-secondary, #888);
  white-space: nowrap;
}

.search-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--bg-secondary, #f5f5f5);
  color: var(--text-secondary, #888);
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.search-clear-btn:hover {
  background: var(--bg-tertiary, #e0e0e0);
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 6px;
  background: var(--bg-primary, #fff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.search-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-secondary, #888);
  font-size: 13px;
}

.search-result-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.search-result-item:hover {
  background: var(--bg-secondary, #f5f5f5);
}

.search-result-title {
  display: block;
  font-size: 13px;
  color: var(--text-primary, #333);
}

.search-result-notes {
  display: block;
  font-size: 12px;
  color: var(--text-secondary, #888);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-result-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.search-result-tag {
  font-size: 11px;
  color: var(--primary-color, #4a90d9);
}

.search-result-item :deep(mark) {
  background: var(--highlight-color, #fff3cd);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}
</style>
