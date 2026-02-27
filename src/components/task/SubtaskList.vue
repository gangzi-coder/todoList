<template>
  <div class="subtask-list" :style="{ paddingLeft: `${indentPx}px` }">
    <!-- 子任务头部：折叠/展开 + 进度 -->
    <div
      v-if="subtasks.length > 0 || canAddSubtask"
      class="subtask-list-header"
    >
      <button
        v-if="subtasks.length > 0"
        class="subtask-list-toggle"
        :aria-label="isExpanded ? '折叠子任务' : '展开子任务'"
        :aria-expanded="isExpanded"
        @click="toggleExpand"
      >
        <span class="subtask-list-toggle-icon" :class="{ 'subtask-list-toggle-icon-expanded': isExpanded }">
          ▶
        </span>
      </button>

      <!-- 子任务进度 -->
      <span v-if="subtasks.length > 0" class="subtask-list-progress">
        子任务 {{ completedCount }}/{{ subtasks.length }}
      </span>

      <!-- 添加子任务按钮 -->
      <button
        v-if="canAddSubtask && !showInput"
        class="subtask-list-add-btn"
        aria-label="添加子任务"
        @click="showInput = true"
      >
        + 添加子任务
      </button>
    </div>

    <!-- 子任务列表 -->
    <Transition name="subtask-collapse">
      <div v-if="isExpanded && subtasks.length > 0" class="subtask-list-items">
        <div
          v-for="subtask in subtasks"
          :key="subtask.id"
          class="subtask-list-item"
        >
          <TaskItem
            :task="subtask"
            @toggle-complete="$emit('toggle-complete', $event)"
            @edit="$emit('edit', $event)"
            @drag-start="$emit('drag-start', $event)"
            @drag-end="$emit('drag-end')"
          />
          <!-- 递归渲染子任务的子任务 -->
          <SubtaskList
            v-if="currentDepth < maxDepth"
            :parent-id="subtask.id"
            :depth="currentDepth + 1"
            :max-depth="maxDepth"
            @toggle-complete="$emit('toggle-complete', $event)"
            @edit="$emit('edit', $event)"
            @drag-start="$emit('drag-start', $event)"
            @drag-end="$emit('drag-end')"
          />
        </div>
      </div>
    </Transition>

    <!-- 添加子任务输入框 -->
    <div v-if="showInput && canAddSubtask" class="subtask-list-input">
      <TaskInput
        ref="taskInputRef"
        placeholder="添加子任务..."
        aria-label="子任务输入"
        :autofocus="true"
        @submit="handleAddSubtask"
      />
      <button
        class="subtask-list-cancel-btn"
        aria-label="取消添加"
        @click="showInput = false"
      >
        取消
      </button>
    </div>

    <!-- 嵌套层级限制提示 -->
    <div v-if="!canAddSubtask && subtasks.length > 0" class="subtask-list-limit-hint">
      已达到最大嵌套层级
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTasks } from '@/composables/useTasks'
import TaskItem from './TaskItem.vue'
import TaskInput from './TaskInput.vue'
import type { Task } from '@/types'

/**
 * SubtaskList 子任务列表组件
 *
 * 显示指定父任务的子任务列表，支持折叠/展开、添加子任务和递归嵌套。
 *
 * 验收标准：
 * - 需求 3.1: 允许用户为任务添加子任务
 * - 需求 3.2: 在父任务下方缩进显示子任务
 * - 需求 3.3: 支持最多 3 层的子任务嵌套
 * - 需求 3.8: 允许用户折叠和展开子任务列表
 */

interface Props {
  /** 父任务 ID */
  parentId: string
  /** 当前嵌套深度（从 1 开始） */
  depth?: number
  /** 最大嵌套深度 */
  maxDepth?: number
}

const props = withDefaults(defineProps<Props>(), {
  depth: 1,
  maxDepth: 3,
})

interface Emits {
  (e: 'toggle-complete', taskId: string): void
  (e: 'edit', taskId: string): void
  (e: 'drag-start', task: Task): void
  (e: 'drag-end'): void
}

defineEmits<Emits>()

const { getSubtasks, createTask } = useTasks()

// 状态
const isExpanded = ref(true)
const showInput = ref(false)
const taskInputRef = ref<InstanceType<typeof TaskInput> | null>(null)

/** 当前深度 */
const currentDepth = computed(() => props.depth)

/** 子任务列表 */
const subtasks = computed(() => getSubtasks(props.parentId))

/** 已完成子任务数 */
const completedCount = computed(() => subtasks.value.filter(t => t.completed).length)

/** 是否可以添加子任务（未超过最大嵌套层级） */
const canAddSubtask = computed(() => currentDepth.value < props.maxDepth)

/** 缩进像素值 */
const indentPx = computed(() => (props.depth > 1 ? 24 : 0))

/** 切换折叠/展开 */
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

/** 添加子任务 */
const handleAddSubtask = async (title: string) => {
  try {
    await createTask({
      title,
      parentId: props.parentId,
    })
    showInput.value = false
  } catch (err) {
    console.error('[SubtaskList] 添加子任务失败:', err)
  }
}
</script>

<style scoped>
.subtask-list {
  width: 100%;
}

/* 头部 */
.subtask-list-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

/* 折叠/展开按钮 */
.subtask-list-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: var(--text-secondary, #6b7280);
  transition: background-color 0.15s;
}

.subtask-list-toggle:hover {
  background-color: var(--hover-bg, #f3f4f6);
}

.subtask-list-toggle:focus-visible {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 1px;
}

.subtask-list-toggle-icon {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s;
}

.subtask-list-toggle-icon-expanded {
  transform: rotate(90deg);
}

/* 进度 */
.subtask-list-progress {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary, #9ca3af);
}

/* 添加按钮 */
.subtask-list-add-btn {
  margin-left: auto;
  padding: 2px 8px;
  border: none;
  background: transparent;
  color: var(--primary-color, #3b82f6);
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.subtask-list-add-btn:hover {
  background-color: var(--primary-light-bg, #eff6ff);
}

.subtask-list-add-btn:focus-visible {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 1px;
}

/* 子任务列表 */
.subtask-list-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
}

.subtask-list-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 输入区域 */
.subtask-list-input {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-top: 8px;
}

.subtask-list-input > :first-child {
  flex: 1;
}

.subtask-list-cancel-btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: transparent;
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  white-space: nowrap;
  transition: background-color 0.15s;
}

.subtask-list-cancel-btn:hover {
  background-color: var(--hover-bg, #f3f4f6);
}

.subtask-list-cancel-btn:focus-visible {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 1px;
}

/* 层级限制提示 */
.subtask-list-limit-hint {
  padding: 4px 0;
  font-size: 11px;
  color: var(--text-tertiary, #9ca3af);
  font-style: italic;
}

/* 折叠/展开动画 */
.subtask-collapse-enter-active,
.subtask-collapse-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.subtask-collapse-enter-from,
.subtask-collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.subtask-collapse-enter-to,
.subtask-collapse-leave-from {
  opacity: 1;
  max-height: 2000px;
}

/* 暗色主题 */
:global(.dark) .subtask-list-header {
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
}

:global(.dark) .subtask-list-toggle:hover {
  background-color: #374151;
}

:global(.dark) .subtask-list-add-btn:hover {
  background-color: #1e3a5f;
}

:global(.dark) .subtask-list-cancel-btn {
  border-color: #374151;
}

:global(.dark) .subtask-list-cancel-btn:hover {
  background-color: #374151;
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .subtask-list-toggle-icon,
  .subtask-list-toggle,
  .subtask-list-add-btn,
  .subtask-list-cancel-btn {
    transition: none;
  }

  .subtask-collapse-enter-active,
  .subtask-collapse-leave-active {
    transition: none;
  }
}
</style>
