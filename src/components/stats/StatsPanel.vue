<template>
  <div class="stats-panel" role="region" aria-label="任务统计">
    <h3 class="stats-panel-title">📊 统计概览</h3>

    <!-- 基础统计 -->
    <section class="stats-section" aria-label="基础统计">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">{{ totalCount }}</span>
          <span class="stat-label">总任务</span>
        </div>
        <div class="stat-card stat-card-completed">
          <span class="stat-value">{{ completedCount }}</span>
          <span class="stat-label">已完成</span>
        </div>
        <div class="stat-card stat-card-incomplete">
          <span class="stat-value">{{ incompleteCount }}</span>
          <span class="stat-label">未完成</span>
        </div>
      </div>
    </section>

    <!-- 完成率 -->
    <section class="stats-section" aria-label="完成率">
      <div class="completion-rate">
        <div class="completion-rate-header">
          <span class="completion-rate-label">完成率</span>
          <span class="completion-rate-value">{{ completionRate }}%</span>
        </div>
        <div
          class="progress-bar"
          role="progressbar"
          :aria-valuenow="completionRate"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="`任务完成率 ${completionRate}%`"
        >
          <div
            class="progress-bar-fill"
            :style="{ width: `${completionRate}%` }"
          />
        </div>
      </div>
    </section>

    <!-- 优先级分布 -->
    <section class="stats-section" aria-label="优先级分布">
      <h4 class="stats-section-title">优先级分布</h4>
      <div class="priority-list">
        <div
          v-for="item in priorityDistribution"
          :key="item.priority"
          class="priority-item"
        >
          <span
            class="priority-badge"
            :class="`priority-badge-${item.priority}`"
            :aria-label="`${item.label}优先级`"
          >
            {{ item.label }}
          </span>
          <div class="priority-bar-wrapper">
            <div
              class="priority-bar"
              :class="`priority-bar-${item.priority}`"
              :style="{ width: `${item.percentage}%` }"
            />
          </div>
          <span class="priority-count">{{ item.count }}</span>
        </div>
      </div>
    </section>

    <!-- 时间统计 -->
    <section class="stats-section" aria-label="时间统计">
      <h4 class="stats-section-title">完成情况</h4>
      <div class="time-stats">
        <div class="time-stat-item">
          <span class="time-stat-icon" aria-hidden="true">📅</span>
          <span class="time-stat-label">今天完成</span>
          <span class="time-stat-value">{{ todayCompletedCount }}</span>
        </div>
        <div class="time-stat-item">
          <span class="time-stat-icon" aria-hidden="true">📆</span>
          <span class="time-stat-label">本周完成</span>
          <span class="time-stat-value">{{ weekCompletedCount }}</span>
        </div>
        <div class="time-stat-item time-stat-item-overdue">
          <span class="time-stat-icon" aria-hidden="true">⚠️</span>
          <span class="time-stat-label">已过期</span>
          <span class="time-stat-value">{{ overdueCount }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * StatsPanel 统计面板组件
 *
 * 显示任务统计信息，包括基础统计、完成率、优先级分布、时间统计和过期任务
 *
 * 验收标准：
 * - 需求 10.1: 显示总任务数、已完成任务数、未完成任务数
 * - 需求 10.2: 显示任务完成率百分比
 * - 需求 10.3: 显示各优先级任务的数量分布
 * - 需求 10.4: 显示今天完成的任务数量
 * - 需求 10.5: 显示本周完成的任务数量
 * - 需求 10.6: 显示过期任务数量
 * - 需求 10.7: 用户选择特定项目时显示该项目的统计信息
 */

import { computed } from 'vue'
import type { Task, Priority } from '@/types'
import { isToday, isOverdue, startOfDay, addDays } from '@/utils/date'

interface Props {
  /** 任务列表 */
  tasks: Task[]
  /** 可选的项目 ID 过滤 */
  projectId?: string
}

const props = withDefaults(defineProps<Props>(), {
  projectId: undefined,
})

/**
 * 按项目过滤后的任务列表（需求 10.7）
 */
const filteredTasks = computed<Task[]>(() => {
  if (!props.projectId) return props.tasks
  return props.tasks.filter((t) => t.projectId === props.projectId)
})

/**
 * 总任务数（需求 10.1）
 */
const totalCount = computed(() => filteredTasks.value.length)

/**
 * 已完成任务数（需求 10.1）
 */
const completedCount = computed(
  () => filteredTasks.value.filter((t) => t.completed).length,
)

/**
 * 未完成任务数（需求 10.1）
 */
const incompleteCount = computed(() => totalCount.value - completedCount.value)

/**
 * 完成率百分比（需求 10.2）
 */
const completionRate = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

/**
 * 优先级分布数据（需求 10.3）
 */
interface PriorityItem {
  priority: Priority
  label: string
  count: number
  percentage: number
}

const priorityDistribution = computed<PriorityItem[]>(() => {
  const priorities: { priority: Priority; label: string }[] = [
    { priority: 'high', label: '高' },
    { priority: 'medium', label: '中' },
    { priority: 'low', label: '低' },
    { priority: 'none', label: '无' },
  ]

  const total = filteredTasks.value.length
  return priorities.map(({ priority, label }) => {
    const count = filteredTasks.value.filter(
      (t) => t.priority === priority,
    ).length
    return {
      priority,
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })
})

/**
 * 今天完成的任务数量（需求 10.4）
 */
const todayCompletedCount = computed(
  () =>
    filteredTasks.value.filter(
      (t) => t.completed && t.completedAt && isToday(new Date(t.completedAt)),
    ).length,
)

/**
 * 本周完成的任务数量（需求 10.5）
 */
const weekCompletedCount = computed(() => {
  const today = startOfDay(new Date())
  const dayOfWeek = today.getDay()
  // 本周一（周日为 0，需要特殊处理）
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = addDays(today, mondayOffset)

  return filteredTasks.value.filter((t) => {
    if (!t.completed || !t.completedAt) return false
    const completedDate = startOfDay(new Date(t.completedAt))
    return completedDate.getTime() >= weekStart.getTime()
  }).length
})

/**
 * 过期任务数量（需求 10.6）
 */
const overdueCount = computed(
  () =>
    filteredTasks.value.filter(
      (t) => !t.completed && t.dueDate && isOverdue(new Date(t.dueDate)),
    ).length,
)
</script>

<style scoped>
.stats-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

/* 统计区块 */
.stats-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 基础统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: var(--card-bg, #f9fafb);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.stat-card:hover {
  background: var(--card-hover-bg, #f3f4f6);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.stat-card-completed .stat-value {
  color: var(--success-color, #10b981);
}

.stat-card-incomplete .stat-value {
  color: var(--warning-color, #f59e0b);
}

/* 完成率进度条 */
.completion-rate {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.completion-rate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.completion-rate-label {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

.completion-rate-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color, #3b82f6);
}

.progress-bar {
  height: 8px;
  background: var(--progress-bg, #e5e7eb);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-color, #3b82f6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* 优先级分布 */
.priority-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.priority-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-badge {
  font-size: 12px;
  font-weight: 600;
  width: 24px;
  text-align: center;
  padding: 2px 0;
  border-radius: 4px;
  flex-shrink: 0;
}

.priority-badge-high {
  background: #fef2f2;
  color: #ef4444;
}

.priority-badge-medium {
  background: #fff7ed;
  color: #f97316;
}

.priority-badge-low {
  background: #eff6ff;
  color: #3b82f6;
}

.priority-badge-none {
  background: #f3f4f6;
  color: #9ca3af;
}

.priority-bar-wrapper {
  flex: 1;
  height: 6px;
  background: var(--progress-bg, #e5e7eb);
  border-radius: 3px;
  overflow: hidden;
}

.priority-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.priority-bar-high {
  background: #ef4444;
}

.priority-bar-medium {
  background: #f97316;
}

.priority-bar-low {
  background: #3b82f6;
}

.priority-bar-none {
  background: #9ca3af;
}

.priority-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  min-width: 20px;
  text-align: right;
}

/* 时间统计 */
.time-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--card-bg, #f9fafb);
  border-radius: 8px;
}

.time-stat-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.time-stat-label {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary, #1f2937);
}

.time-stat-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #1f2937);
}

.time-stat-item-overdue .time-stat-value {
  color: #ef4444;
}

/* 暗色主题 */
:global(.dark) .stats-panel-title {
  color: #f9fafb;
}

:global(.dark) .stats-section-title {
  color: #9ca3af;
}

:global(.dark) .stat-card {
  background: #1f2937;
}

:global(.dark) .stat-card:hover {
  background: #374151;
}

:global(.dark) .stat-value {
  color: #f9fafb;
}

:global(.dark) .stat-label {
  color: #9ca3af;
}

:global(.dark) .completion-rate-label {
  color: #9ca3af;
}

:global(.dark) .completion-rate-value {
  color: #93c5fd;
}

:global(.dark) .progress-bar {
  background: #374151;
}

:global(.dark) .progress-bar-fill {
  background: #3b82f6;
}

:global(.dark) .priority-badge-high {
  background: #451a1a;
  color: #fca5a5;
}

:global(.dark) .priority-badge-medium {
  background: #431a04;
  color: #fdba74;
}

:global(.dark) .priority-badge-low {
  background: #1e3a5f;
  color: #93c5fd;
}

:global(.dark) .priority-badge-none {
  background: #374151;
  color: #9ca3af;
}

:global(.dark) .priority-bar-wrapper {
  background: #374151;
}

:global(.dark) .priority-count {
  color: #9ca3af;
}

:global(.dark) .time-stat-item {
  background: #1f2937;
}

:global(.dark) .time-stat-label {
  color: #f9fafb;
}

:global(.dark) .time-stat-value {
  color: #f9fafb;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .stats-panel {
    padding: 12px;
    gap: 12px;
  }

  .stats-grid {
    gap: 6px;
  }

  .stat-card {
    padding: 10px 6px;
  }

  .stat-value {
    font-size: 18px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .progress-bar-fill,
  .priority-bar,
  .stat-card {
    transition: none;
  }
}
</style>
