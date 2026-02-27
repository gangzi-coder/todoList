<template>
  <div
    class="project-item"
    :class="{
      'project-item-active': isActive,
    }"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
    tabindex="0"
    role="button"
    :aria-label="`项目: ${project.name}, ${taskCount} 个任务`"
    :aria-pressed="isActive"
    :aria-current="isActive ? 'true' : undefined"
  >
    <!-- 项目颜色标识 -->
    <div
      class="project-item-color"
      :style="{ backgroundColor: project.color }"
      :aria-hidden="true"
    />

    <!-- 项目内容 -->
    <div class="project-item-content">
      <!-- 项目名称 -->
      <span class="project-item-name">
        {{ project.name }}
      </span>

      <!-- 任务数量 -->
      <span
        v-if="taskCount > 0"
        class="project-item-count"
        :aria-label="`${taskCount} 个未完成任务`"
      >
        {{ taskCount }}
      </span>
    </div>

    <!-- 操作按钮 -->
    <div class="project-item-actions">
      <!-- 编辑按钮 -->
      <button
        v-if="!project.isDefault"
        class="project-item-action-btn"
        :aria-label="`编辑项目 ${project.name}`"
        title="编辑项目"
        @click.stop="handleEdit"
      >
        <span class="project-item-icon">✏️</span>
      </button>

      <!-- 删除按钮 -->
      <button
        v-if="!project.isDefault"
        class="project-item-action-btn project-item-action-btn-delete"
        :aria-label="`删除项目 ${project.name}`"
        title="删除项目"
        @click.stop="handleDelete"
      >
        <span class="project-item-icon">🗑️</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '@/types'

/**
 * ProjectItem 组件
 * 
 * 显示单个项目的信息，包括项目名称、颜色标识、任务数量
 * 
 * 验收标准：
 * - 需求 2.3: 允许为项目设置颜色标识
 * - 需求 2.8: 在项目列表中显示每个项目的未完成任务数量
 * - 需求 2.9: 点击项目显示该项目的所有任务
 * - 需求 13.5: 为所有交互元素提供悬停状态的视觉反馈
 * - 需求 13.6: 使用动画过渡效果提升用户体验
 * - 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
 * - 需求 19.2: 支持完整的键盘导航
 */

interface Props {
  /** 项目数据 */
  project: Project
  /** 未完成任务数量 */
  taskCount: number
  /** 是否为当前选中的项目 */
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
})

interface Emits {
  /** 点击项目 */
  (e: 'click', projectId: string): void
  /** 编辑项目 */
  (e: 'edit', projectId: string): void
  /** 删除项目 */
  (e: 'delete', projectId: string): void
}

const emit = defineEmits<Emits>()

/**
 * 处理点击项目
 */
const handleClick = () => {
  emit('click', props.project.id)
}

/**
 * 处理编辑
 */
const handleEdit = () => {
  emit('edit', props.project.id)
}

/**
 * 处理删除
 */
const handleDelete = () => {
  emit('delete', props.project.id)
}
</script>

<style scoped>
/* 项目项容器 */
.project-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background-color: var(--project-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.project-item:hover {
  background-color: var(--project-hover-bg, #f9fafb);
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.project-item:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 激活状态 */
.project-item-active {
  background-color: var(--project-active-bg, #eff6ff);
  border-color: var(--primary-color, #3b82f6);
  font-weight: 600;
}

.project-item-active:hover {
  background-color: var(--project-active-hover-bg, #dbeafe);
}

/* 项目颜色标识 */
.project-item-color {
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

/* 项目内容 */
.project-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

/* 项目名称 */
.project-item-name {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 任务数量 */
.project-item-count {
  flex-shrink: 0;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--count-bg, #e5e7eb);
  color: var(--count-color, #6b7280);
  font-size: 12px;
  font-weight: 600;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.project-item-active .project-item-count {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

/* 操作按钮容器 */
.project-item-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.project-item:hover .project-item-actions {
  opacity: 1;
}

/* 操作按钮 */
.project-item-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background-color: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-item-action-btn:hover {
  background-color: var(--action-hover-bg, #f3f4f6);
}

.project-item-action-btn:active {
  transform: scale(0.95);
}

.project-item-action-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 删除按钮特殊样式 */
.project-item-action-btn-delete:hover {
  background-color: var(--error-light-bg, #fee2e2);
}

/* 图标 */
.project-item-icon {
  font-size: 14px;
  line-height: 1;
}

/* 暗色主题 */
:global(.dark) .project-item {
  --project-bg: #1f2937;
  --project-hover-bg: #374151;
  --project-active-bg: #1e3a5f;
  --project-active-hover-bg: #1e40af;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --count-bg: #4b5563;
  --count-color: #d1d5db;
  --action-hover-bg: #4b5563;
  --error-light-bg: #7f1d1d;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .project-item {
    padding: 8px 10px;
    gap: 10px;
  }

  .project-item-name {
    font-size: 13px;
  }

  .project-item-count {
    font-size: 11px;
    min-width: 20px;
    height: 18px;
    padding: 0 5px;
  }

  .project-item-action-btn {
    width: 24px;
    height: 24px;
  }

  .project-item-icon {
    font-size: 12px;
  }

  /* 移动端始终显示操作按钮 */
  .project-item-actions {
    opacity: 1;
  }
}

/* 可访问性：确保焦点指示器清晰可见 */
.project-item:focus-visible {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .project-item {
    border-width: 2px;
  }

  .project-item:hover,
  .project-item:focus,
  .project-item-active {
    border-width: 3px;
  }

  .project-item-color {
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.8);
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .project-item,
  .project-item-count,
  .project-item-actions,
  .project-item-action-btn {
    transition: none;
  }

  .project-item-action-btn:active {
    transform: none;
  }
}
</style>
