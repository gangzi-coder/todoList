<template>
  <div
    class="task-item"
    :class="{
      'task-item-completed': task.completed,
      'task-item-overdue': isOverdue && !task.completed,
      'task-item-upcoming': isUpcoming && !task.completed,
      'task-item-dragging': isDragging,
    }"
    :draggable="!task.completed"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleToggleComplete"
    tabindex="0"
    role="button"
    :aria-label="`任务: ${task.title}`"
  >
    <!-- 完成复选框 -->
    <div class="task-item-checkbox-wrapper">
      <input
        type="checkbox"
        class="task-item-checkbox"
        :checked="task.completed"
        :aria-label="`标记任务 ${task.title} 为${task.completed ? '未完成' : '完成'}`"
        @click.stop
        @change="handleToggleComplete"
      />
    </div>

    <!-- 任务内容 -->
    <div class="task-item-content">
      <!-- 标题和优先级 -->
      <div class="task-item-header">
        <span
          class="task-item-title"
          :class="{ 'task-item-title-completed': task.completed }"
        >
          {{ task.title }}
        </span>
        
        <!-- 优先级标识 -->
        <span
          v-if="task.priority !== 'none'"
          class="task-item-priority"
          :class="`task-item-priority-${task.priority}`"
          :title="`优先级: ${priorityText}`"
        >
          {{ priorityIcon }}
        </span>
      </div>

      <!-- 元数据行 -->
      <div class="task-item-meta">
        <!-- 项目 -->
        <span
          v-if="projectInfo"
          class="task-item-project"
          :style="{ color: projectInfo.color }"
          :title="`项目: ${projectInfo.name}`"
        >
          <span class="task-item-icon">📁</span>
          {{ projectInfo.name }}
        </span>

        <!-- 开始时间 -->
        <span
          v-if="task.startDate"
          class="task-item-start-date"
          :title="`开始时间: ${formattedStartDate}`"
        >
          <span class="task-item-icon">⏰</span>
          {{ relativeStartDate }}
        </span>

        <!-- 截止日期 -->
        <span
          v-if="task.dueDate"
          class="task-item-due-date"
          :class="{
            'task-item-due-date-overdue': isOverdue && !task.completed,
            'task-item-due-date-upcoming': isUpcoming && !task.completed,
          }"
          :title="`截止日期: ${formattedDueDate}`"
        >
          <span class="task-item-icon">📅</span>
          {{ relativeDueDate }}
          <span v-if="isOverdue && !task.completed" class="task-item-overdue-badge">
            已过期
          </span>
        </span>

        <!-- 标签 -->
        <div v-if="task.tags.length > 0" class="task-item-tags">
          <span
            v-for="tag in task.tags"
            :key="tag"
            class="task-item-tag"
            :title="`标签: ${tag}`"
          >
            #{{ tag }}
          </span>
        </div>

        <!-- 子任务进度 -->
        <span
          v-if="subtaskCount > 0"
          class="task-item-subtasks"
          :class="{ 'task-item-subtasks-done': subtaskCompleted === subtaskCount }"
          :title="`子任务: ${subtaskCompleted}/${subtaskCount}`"
        >
          <span class="task-item-icon">📋</span>
          {{ subtaskCompleted }}/{{ subtaskCount }}
        </span>

        <!-- 重复任务标识 -->
        <span
          v-if="task.recurrence"
          class="task-item-recurrence"
          :title="recurrenceText"
        >
          <span class="task-item-icon">🔁</span>
          {{ recurrenceText }}
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="task-item-actions">
      <button
        class="task-item-delete-btn"
        title="删除任务"
        :aria-label="`删除任务 ${task.title}`"
        @click.stop="handleDelete"
      >
        🗑️
      </button>
    </div>

    <!-- 拖拽手柄 -->
    <div
      v-if="!task.completed"
      class="task-item-drag-handle"
      :aria-label="'拖拽排序'"
      title="拖拽排序"
    >
      <span class="task-item-icon">⋮⋮</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task } from '@/types'
import { useProjectStore } from '@/stores/projectStore'
import { useTaskStore } from '@/stores/taskStore'
import { formatDate, formatRelativeDate, isOverdue as checkOverdue, isUpcoming as checkUpcoming } from '@/utils/date'

/**
 * TaskItem 组件
 * 
 * 显示单个任务的信息，包括标题、项目、标签、优先级、截止日期等
 * 
 * 验收标准：
 * - 需求 1.2: 点击完成复选框切换任务完成状态
 * - 需求 4.2: 使用不同颜色标识不同优先级的任务
 * - 需求 4.6: 任务截止日期临近时使用醒目颜色标识
 * - 需求 4.7: 任务已过期时显示"已过期"标识
 * - 需求 13.5: 为所有交互元素提供悬停状态的视觉反馈
 * - 需求 13.6: 使用动画过渡效果提升用户体验
 * - 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
 * - 需求 19.2: 支持完整的键盘导航
 * 
 * 注意：根据用户要求，跳过子任务进度和重复标识图标的显示
 */

interface Props {
  /** 任务数据 */
  task: Task
}

const props = defineProps<Props>()

interface Emits {
  /** 切换完成状态 */
  (e: 'toggle-complete', taskId: string): void
  /** 点击编辑 */
  (e: 'edit', taskId: string): void
  /** 删除任务 */
  (e: 'delete', taskId: string): void
  /** 拖拽开始 */
  (e: 'drag-start', task: Task): void
  /** 拖拽结束 */
  (e: 'drag-end'): void
}

const emit = defineEmits<Emits>()

// Store
const projectStore = useProjectStore()
const taskStore = useTaskStore()

// 状态
const isDragging = ref(false)

/**
 * 项目信息
 */
const projectInfo = computed(() => {
  return projectStore.getProjectById(props.task.projectId)
})

/**
 * 子任务列表
 */
const subtasks = computed(() => {
  return taskStore.tasks.filter(t => t.parentId === props.task.id)
})

/**
 * 子任务总数
 */
const subtaskCount = computed(() => subtasks.value.length)

/**
 * 已完成子任务数
 */
const subtaskCompleted = computed(() => subtasks.value.filter(t => t.completed).length)

/**
 * 重复任务描述文本
 */
const recurrenceText = computed(() => {
  const r = props.task.recurrence
  if (!r) return ''
  const unitMap: Record<string, string> = {
    daily: '天',
    weekly: '周',
    monthly: '月',
    yearly: '年',
  }
  const unit = unitMap[r.frequency] || r.frequency
  if (r.interval === 1) {
    return `每${unit}`
  }
  return `每${r.interval}${unit}`
})

/**
 * 优先级文本
 */
const priorityText = computed(() => {
  const map = {
    high: '高',
    medium: '中',
    low: '低',
    none: '无',
  }
  return map[props.task.priority]
})

/**
 * 优先级图标
 */
const priorityIcon = computed(() => {
  const map = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
    none: '',
  }
  return map[props.task.priority]
})

/**
 * 是否过期
 */
const isOverdue = computed(() => {
  if (!props.task.dueDate) return false
  return checkOverdue(new Date(props.task.dueDate))
})

/**
 * 是否即将到来
 */
const isUpcoming = computed(() => {
  if (!props.task.dueDate) return false
  return checkUpcoming(new Date(props.task.dueDate))
})

/**
 * 格式化的开始时间
 */
const formattedStartDate = computed(() => {
  if (!props.task.startDate) return ''
  return formatDate(new Date(props.task.startDate), 'full')
})

/**
 * 相对开始时间
 */
const relativeStartDate = computed(() => {
  if (!props.task.startDate) return ''
  return formatRelativeDate(new Date(props.task.startDate))
})

/**
 * 格式化的截止日期
 */
const formattedDueDate = computed(() => {
  if (!props.task.dueDate) return ''
  return formatDate(new Date(props.task.dueDate), 'full')
})

/**
 * 相对截止日期
 */
const relativeDueDate = computed(() => {
  if (!props.task.dueDate) return ''
  return formatRelativeDate(new Date(props.task.dueDate))
})

/**
 * 处理切换完成状态
 */
const handleToggleComplete = () => {
  emit('toggle-complete', props.task.id)
}

/**
 * 处理点击
 */
const handleClick = () => {
  emit('edit', props.task.id)
}

/**
 * 处理删除
 */
const handleDelete = () => {
  emit('delete', props.task.id)
}

/**
 * 处理拖拽开始
 */
const handleDragStart = (event: DragEvent) => {
  if (props.task.completed) {
    event.preventDefault()
    return
  }
  
  isDragging.value = true
  emit('drag-start', props.task)
  
  // 设置拖拽数据
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.task.id)
  }
}

/**
 * 处理拖拽结束
 */
const handleDragEnd = () => {
  isDragging.value = false
  emit('drag-end')
}
</script>

<style scoped>
/* 任务项容器 */
.task-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--task-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.task-item:hover {
  background-color: var(--task-hover-bg, #f9fafb);
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-item:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 已完成状态 */
.task-item-completed {
  opacity: 0.6;
}

.task-item-completed:hover {
  opacity: 0.8;
}

/* 过期状态 */
.task-item-overdue {
  border-left: 3px solid var(--error-color, #ef4444);
}

/* 即将到来状态 */
.task-item-upcoming {
  border-left: 3px solid var(--warning-color, #f59e0b);
}

/* 拖拽状态 */
.task-item-dragging {
  opacity: 0.5;
  cursor: grabbing;
}

/* 复选框包装器 */
.task-item-checkbox-wrapper {
  flex-shrink: 0;
  padding-top: 2px;
}

/* 复选框 */
.task-item-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--primary-color, #3b82f6);
}

/* 任务内容 */
.task-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 标题行 */
.task-item-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 任务标题 */
.task-item-title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #1f2937);
  line-height: 1.5;
  word-break: break-word;
}

.task-item-title-completed {
  text-decoration: line-through;
  color: var(--text-tertiary, #9ca3af);
}

/* 优先级标识 */
.task-item-priority {
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1;
}

/* 元数据行 */
.task-item-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

/* 图标 */
.task-item-icon {
  font-size: 12px;
  opacity: 0.8;
}

/* 项目 */
.task-item-project {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

/* 开始时间 */
.task-item-start-date {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-color, #3b82f6);
}

/* 截止日期 */
.task-item-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-item-due-date-overdue {
  color: var(--error-color, #ef4444);
  font-weight: 500;
}

.task-item-due-date-upcoming {
  color: var(--warning-color, #f59e0b);
  font-weight: 500;
}

/* 过期徽章 */
.task-item-overdue-badge {
  padding: 2px 6px;
  background-color: var(--error-color, #ef4444);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 标签容器 */
.task-item-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

/* 标签 */
.task-item-tag {
  padding: 2px 8px;
  background-color: var(--tag-bg, #e0e7ff);
  color: var(--tag-color, #4f46e5);
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
}

/* 子任务进度 */
.task-item-subtasks {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.task-item-subtasks-done {
  color: var(--success-color, #10b981);
}

/* 重复任务标识 */
.task-item-recurrence {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
}

/* 操作按钮 */
.task-item-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.task-item:hover .task-item-actions {
  opacity: 1;
}

.task-item-delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1;
  color: var(--text-tertiary, #9ca3af);
  transition: all 0.15s;
}

.task-item-delete-btn:hover {
  background-color: var(--error-bg, #fef2f2);
  color: var(--error-color, #ef4444);
}

.task-item-delete-btn:focus-visible {
  outline: 2px solid var(--error-color, #ef4444);
  outline-offset: 2px;
  opacity: 1;
}

/* 拖拽手柄 */
.task-item-drag-handle {
  flex-shrink: 0;
  padding: 4px;
  color: var(--text-tertiary, #9ca3af);
  cursor: grab;
  opacity: 0;
  transition: opacity 0.2s;
}

.task-item:hover .task-item-drag-handle {
  opacity: 1;
}

.task-item-drag-handle:active {
  cursor: grabbing;
}

/* 暗色主题 */
:global(.dark) .task-item {
  --task-bg: #1f2937;
  --task-hover-bg: #374151;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --tag-bg: #312e81;
  --tag-color: #a5b4fc;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .task-item {
    padding: 10px 12px;
    gap: 10px;
  }

  .task-item-title {
    font-size: 14px;
  }

  .task-item-meta {
    font-size: 12px;
    gap: 8px;
  }

  .task-item-drag-handle {
    display: none;
  }
}

/* 可访问性：确保焦点指示器清晰可见 */
.task-item:focus-visible {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .task-item {
    border-width: 2px;
  }

  .task-item:hover,
  .task-item:focus {
    border-width: 3px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .task-item,
  .task-item-drag-handle {
    transition: none;
  }
}
</style>
