<template>
  <div class="task-list" role="list" :aria-label="ariaLabel">
    <!-- 空状态 -->
    <div v-if="isEmpty" class="task-list-empty" role="status">
      <div class="task-list-empty-icon">📝</div>
      <h3 class="task-list-empty-title">{{ emptyTitle }}</h3>
      <p class="task-list-empty-description">{{ emptyDescription }}</p>
    </div>

    <!-- 任务列表 -->
    <div
      v-else
      ref="scrollContainer"
      class="task-list-scroll-container"
      @scroll="handleScroll"
      @keydown="handleListKeydown"
    >
      <!-- 虚拟滚动占位符（上方） -->
      <div :style="{ height: `${offsetTop}px` }" />

      <!-- 可见任务列表 -->
      <div
        v-for="(task, index) in visibleTasks"
        :key="task.id"
        class="task-list-item-wrapper"
        :data-index="startIndex + index"
        @dragover.prevent="handleDragOver"
        @drop="handleDrop(startIndex + index)"
        role="listitem"
      >
        <TaskItem
          v-memo="[task.id, task.completed, task.updatedAt]"
          :task="task"
          @toggle-complete="handleToggleComplete"
          @edit="handleEdit"
          @delete="handleDelete"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
        />
        <!-- 子任务（缩进展示） -->
        <div
          v-if="getSubtasks(task.id).length > 0"
          class="task-list-subtasks"
        >
          <div
            v-for="subtask in getSubtasks(task.id)"
            :key="subtask.id"
            class="task-list-item-wrapper task-list-subtask-item"
            role="listitem"
          >
            <TaskItem
              :task="subtask"
              @toggle-complete="handleToggleComplete"
              @edit="handleEdit"
              @delete="handleDelete"
              @drag-start="handleDragStart"
              @drag-end="handleDragEnd"
            />
          </div>
        </div>
      </div>

      <!-- 虚拟滚动占位符（下方） -->
      <div :style="{ height: `${offsetBottom}px` }" />

      <!-- 拖拽插入指示器 -->
      <div
        v-if="dropIndicatorIndex !== null"
        class="task-list-drop-indicator"
        :style="{ top: `${dropIndicatorTop}px` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import type { Task } from '@/types'
import TaskItem from './TaskItem.vue'
import { useTaskStore } from '@/stores/taskStore'

/**
 * TaskList 组件
 * 
 * 显示任务列表，支持虚拟滚动和拖拽排序
 * 
 * 验收标准：
 * - 需求 16.5: 支持流畅渲染包含 1000 个任务的列表
 * - 需求 16.6: 使用虚拟滚动技术优化长列表性能
 */

interface Props {
  /** 任务列表 */
  tasks: Task[]
  /** 空状态标题 */
  emptyTitle?: string
  /** 空状态描述 */
  emptyDescription?: string
  /** 列表标签（用于可访问性） */
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  emptyTitle: '暂无任务',
  emptyDescription: '创建一个新任务开始吧',
  ariaLabel: '任务列表',
})

interface Emits {
  /** 切换完成状态 */
  (e: 'toggle-complete', taskId: string): void
  /** 编辑任务 */
  (e: 'edit', taskId: string): void
  /** 删除任务 */
  (e: 'delete', taskId: string): void
  /** 任务重新排序 */
  (e: 'reorder', fromIndex: number, toIndex: number): void
}

const emit = defineEmits<Emits>()

// 虚拟滚动配置
const ITEM_HEIGHT = 80 // 每个任务项的估计高度（像素）
const BUFFER_SIZE = 3 // 上下缓冲区的项目数量
const SCROLL_THROTTLE = 16 // 滚动节流时间（毫秒）

// 状态
const scrollContainer = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const containerHeight = ref(0)
const draggedTask = ref<Task | null>(null)
const dropIndicatorIndex = ref<number | null>(null)

// 是否为空
const isEmpty = computed(() => props.tasks.length === 0)

// 获取子任务
const taskStore = useTaskStore()
const getSubtasks = (parentId: string): Task[] => {
  return taskStore.tasks
    .filter(t => t.parentId === parentId)
    .sort((a, b) => a.order - b.order)
}

// 虚拟滚动计算
const startIndex = computed(() => {
  const index = Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER_SIZE
  return Math.max(0, index)
})

const endIndex = computed(() => {
  const visibleCount = Math.ceil(containerHeight.value / ITEM_HEIGHT)
  const index = startIndex.value + visibleCount + BUFFER_SIZE * 2
  return Math.min(props.tasks.length, index)
})

const visibleTasks = computed(() => {
  return props.tasks.slice(startIndex.value, endIndex.value)
})

const offsetTop = computed(() => {
  return startIndex.value * ITEM_HEIGHT
})

const offsetBottom = computed(() => {
  return (props.tasks.length - endIndex.value) * ITEM_HEIGHT
})

const dropIndicatorTop = computed(() => {
  if (dropIndicatorIndex.value === null) return 0
  return dropIndicatorIndex.value * ITEM_HEIGHT + offsetTop.value
})

// 滚动处理（带节流）
let scrollTimeout: number | null = null
const handleScroll = () => {
  if (scrollTimeout) return

  scrollTimeout = window.setTimeout(() => {
    if (scrollContainer.value) {
      scrollTop.value = scrollContainer.value.scrollTop
    }
    scrollTimeout = null
  }, SCROLL_THROTTLE)
}

// 切换完成状态
const handleToggleComplete = (taskId: string) => {
  emit('toggle-complete', taskId)
}

/**
 * 键盘导航：上下箭头键在任务项之间移动焦点
 */
const handleListKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return

  const target = event.target as HTMLElement
  // 查找当前聚焦的任务项
  const taskItem = target.closest('.task-list-item-wrapper')
  if (!taskItem) return

  event.preventDefault()
  const wrapper = taskItem.parentElement
  if (!wrapper) return

  const items = Array.from(wrapper.querySelectorAll('.task-list-item-wrapper'))
  const currentIndex = items.indexOf(taskItem)
  if (currentIndex === -1) return

  let nextIndex: number
  if (event.key === 'ArrowDown') {
    nextIndex = Math.min(currentIndex + 1, items.length - 1)
  } else {
    nextIndex = Math.max(currentIndex - 1, 0)
  }

  // 聚焦下一个任务项中的可聚焦元素（TaskItem 的根 div）
  const nextItem = items[nextIndex]
  const focusTarget = nextItem.querySelector<HTMLElement>('[tabindex="0"], [role="button"]')
  if (focusTarget) {
    focusTarget.focus()
    // 确保滚动到可见区域
    focusTarget.scrollIntoView({ block: 'nearest' })
  }
}

// 编辑任务
const handleEdit = (taskId: string) => {
  emit('edit', taskId)
}

// 删除任务
const handleDelete = (taskId: string) => {
  emit('delete', taskId)
}

// 拖拽开始
const handleDragStart = (task: Task) => {
  draggedTask.value = task
}

// 拖拽结束
const handleDragEnd = () => {
  draggedTask.value = null
  dropIndicatorIndex.value = null
}

// 拖拽悬停
const handleDragOver = (event: DragEvent) => {
  if (!draggedTask.value) return

  const target = (event.currentTarget as HTMLElement)
  const index = parseInt(target.dataset.index || '0', 10)
  
  // 计算鼠标在元素中的位置
  const rect = target.getBoundingClientRect()
  const mouseY = event.clientY - rect.top
  const isTopHalf = mouseY < rect.height / 2

  // 设置插入指示器位置
  dropIndicatorIndex.value = isTopHalf ? index : index + 1
}

// 拖拽放下
const handleDrop = (targetIndex: number) => {
  if (!draggedTask.value) return

  const fromIndex = props.tasks.findIndex(t => t.id === draggedTask.value!.id)
  if (fromIndex === -1 || fromIndex === targetIndex) {
    handleDragEnd()
    return
  }

  // 调整目标索引（如果从上往下拖，需要减 1）
  let toIndex = targetIndex
  if (fromIndex < targetIndex) {
    toIndex = targetIndex - 1
  }

  emit('reorder', fromIndex, toIndex)
  handleDragEnd()
}

// 更新容器高度
const updateContainerHeight = () => {
  if (scrollContainer.value) {
    containerHeight.value = scrollContainer.value.clientHeight
  }
}

// 监听任务列表变化，重置滚动位置
watch(() => props.tasks.length, () => {
  nextTick(() => {
    updateContainerHeight()
  })
})

// 生命周期
onMounted(() => {
  updateContainerHeight()
  window.addEventListener('resize', updateContainerHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerHeight)
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})
</script>

<style scoped>
/* 任务列表容器 */
.task-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 滚动容器 */
.task-list-scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding: 8px;
}

/* 自定义滚动条 */
.task-list-scroll-container::-webkit-scrollbar {
  width: 8px;
}

.task-list-scroll-container::-webkit-scrollbar-track {
  background: var(--scrollbar-track, #f1f5f9);
  border-radius: 4px;
}

.task-list-scroll-container::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #cbd5e1);
  border-radius: 4px;
}

.task-list-scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #94a3b8);
}

/* 任务项包装器 */
.task-list-item-wrapper {
  margin-bottom: 8px;
  position: relative;
}

.task-list-item-wrapper:last-child {
  margin-bottom: 0;
}

/* 子任务容器 */
.task-list-subtasks {
  padding-left: 28px;
  margin-top: 4px;
  border-left: 2px solid var(--border-color, #e5e7eb);
  margin-left: 16px;
}

.task-list-subtask-item {
  margin-bottom: 4px;
}

/* 拖拽插入指示器 */
.task-list-drop-indicator {
  position: absolute;
  left: 8px;
  right: 8px;
  height: 2px;
  background-color: var(--primary-color, #3b82f6);
  border-radius: 1px;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0 0 4px rgba(59, 130, 246, 0.5);
}

.task-list-drop-indicator::before,
.task-list-drop-indicator::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 8px;
  height: 8px;
  background-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
}

.task-list-drop-indicator::before {
  left: -4px;
}

.task-list-drop-indicator::after {
  right: -4px;
}

/* 空状态 */
.task-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 48px 24px;
  text-align: center;
}

.task-list-empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.task-list-empty-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0 0 8px 0;
}

.task-list-empty-description {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin: 0;
  max-width: 300px;
}

/* 暗色主题 */
:global(.dark) .task-list {
  --scrollbar-track: #1f2937;
  --scrollbar-thumb: #4b5563;
  --scrollbar-thumb-hover: #6b7280;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .task-list-scroll-container {
    padding: 4px;
  }

  .task-list-item-wrapper {
    margin-bottom: 6px;
  }

  .task-list-empty {
    padding: 32px 16px;
  }

  .task-list-empty-icon {
    font-size: 48px;
  }

  .task-list-empty-title {
    font-size: 18px;
  }

  .task-list-empty-description {
    font-size: 13px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .task-list-drop-indicator {
    transition: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .task-list-drop-indicator {
    height: 3px;
    box-shadow: 0 0 6px rgba(59, 130, 246, 0.8);
  }
}
</style>
