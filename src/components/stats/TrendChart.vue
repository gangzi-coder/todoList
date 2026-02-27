<template>
  <div class="trend-chart" role="img" :aria-label="`最近 7 天完成趋势：${ariaDescription}`">
    <h4 class="trend-chart-title">📈 完成趋势（近 7 天）</h4>
    <svg
      :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
      class="trend-chart-svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <!-- 网格线 -->
      <line
        v-for="i in 3"
        :key="'grid-' + i"
        :x1="padding.left"
        :y1="padding.top + ((i - 1) * chartHeight) / 2"
        :x2="svgWidth - padding.right"
        :y2="padding.top + ((i - 1) * chartHeight) / 2"
        class="grid-line"
      />

      <!-- 折线 -->
      <polyline
        v-if="points.length > 1"
        :points="polylinePoints"
        class="trend-line"
        fill="none"
      />

      <!-- 数据点 -->
      <circle
        v-for="(pt, idx) in points"
        :key="'dot-' + idx"
        :cx="pt.x"
        :cy="pt.y"
        r="4"
        class="trend-dot"
      />

      <!-- 数据点数值标签 -->
      <text
        v-for="(pt, idx) in points"
        :key="'val-' + idx"
        :x="pt.x"
        :y="pt.y - 10"
        class="value-label"
        text-anchor="middle"
      >
        {{ dailyCounts[idx] }}
      </text>

      <!-- X 轴日期标签 -->
      <text
        v-for="(pt, idx) in points"
        :key="'label-' + idx"
        :x="pt.x"
        :y="svgHeight - 4"
        class="date-label"
        text-anchor="middle"
      >
        {{ dateLabels[idx] }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
/**
 * TrendChart 完成趋势图表组件
 *
 * 使用 SVG 绘制最近 7 天的任务完成趋势折线图
 *
 * 验收标准：
 * - 需求 10.8: 提供完成趋势图表，显示最近 7 天的任务完成情况
 */

import { computed } from 'vue'
import type { Task } from '@/types'
import { startOfDay, addDays } from '@/utils/date'

interface Props {
  /** 任务列表 */
  tasks: Task[]
}

const props = defineProps<Props>()

// SVG 尺寸
const svgWidth = 320
const svgHeight = 160
const padding = { top: 24, right: 16, bottom: 24, left: 16 }
const chartWidth = svgWidth - padding.left - padding.right
const chartHeight = svgHeight - padding.top - padding.bottom

/**
 * 计算最近 7 天每天的完成任务数
 */
const dailyCounts = computed<number[]>(() => {
  const today = startOfDay(new Date())
  const counts: number[] = []

  for (let i = 6; i >= 0; i--) {
    const dayStart = addDays(today, -i)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const count = props.tasks.filter((t) => {
      if (!t.completed || !t.completedAt) return false
      const completedTime = new Date(t.completedAt).getTime()
      return completedTime >= dayStart.getTime() && completedTime <= dayEnd.getTime()
    }).length

    counts.push(count)
  }

  return counts
})

/**
 * 日期标签（MM/DD 格式）
 */
const dateLabels = computed<string[]>(() => {
  const today = startOfDay(new Date())
  const labels: string[] = []

  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }

  return labels
})

/**
 * 计算 SVG 坐标点
 */
const points = computed<{ x: number; y: number }[]>(() => {
  const max = Math.max(...dailyCounts.value, 1)
  const stepX = chartWidth / 6

  return dailyCounts.value.map((count, idx) => ({
    x: padding.left + idx * stepX,
    y: padding.top + chartHeight - (count / max) * chartHeight,
  }))
})

/**
 * 折线 points 属性字符串
 */
const polylinePoints = computed(() =>
  points.value.map((pt) => `${pt.x},${pt.y}`).join(' '),
)

/**
 * 无障碍描述
 */
const ariaDescription = computed(() =>
  dailyCounts.value.map((c, i) => `${dateLabels.value[i]} 完成 ${c} 个`).join('，'),
)
</script>

<style scoped>
.trend-chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trend-chart-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.trend-chart-svg {
  width: 100%;
  height: auto;
}

.grid-line {
  stroke: var(--border-color, #e5e7eb);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

.trend-line {
  stroke: var(--primary-color, #3b82f6);
  stroke-width: 2;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.trend-dot {
  fill: var(--primary-color, #3b82f6);
}

.value-label {
  font-size: 11px;
  fill: var(--text-primary, #1f2937);
  font-weight: 600;
}

.date-label {
  font-size: 10px;
  fill: var(--text-secondary, #6b7280);
}

/* 暗色主题 */
:global(.dark) .trend-chart-title {
  color: #9ca3af;
}

:global(.dark) .grid-line {
  stroke: #374151;
}

:global(.dark) .trend-line {
  stroke: #60a5fa;
}

:global(.dark) .trend-dot {
  fill: #60a5fa;
}

:global(.dark) .value-label {
  fill: #f9fafb;
}

:global(.dark) .date-label {
  fill: #9ca3af;
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .trend-line,
  .trend-dot {
    transition: none;
  }
}
</style>
