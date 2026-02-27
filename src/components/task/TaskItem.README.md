# TaskItem 组件

## 概述

TaskItem 组件用于显示单个任务的信息，包括标题、项目、标签、优先级、截止日期等。支持完成状态切换、点击编辑和拖拽排序功能。

## 功能特性

- ✅ 显示任务标题和完成复选框
- ✅ 显示优先级标识（高/中/低）
- ✅ 显示所属项目（带颜色标识）
- ✅ 显示截止日期（相对时间格式）
- ✅ 显示标签列表
- ✅ 过期任务醒目标识（红色边框 + "已过期"徽章）
- ✅ 即将到来任务标识（橙色边框）
- ✅ 点击编辑功能
- ✅ 拖拽排序支持（未完成任务）
- ✅ 悬停效果和过渡动画
- ✅ 完整的键盘导航支持
- ✅ ARIA 标签和可访问性支持

## Props

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| task | Task | 是 | 任务数据对象 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| toggle-complete | taskId: string | 切换任务完成状态 |
| edit | taskId: string | 点击编辑任务 |
| drag-start | task: Task | 拖拽开始 |
| drag-end | - | 拖拽结束 |

## 使用示例

```vue
<template>
  <div class="task-list">
    <TaskItem
      v-for="task in tasks"
      :key="task.id"
      :task="task"
      @toggle-complete="handleToggleComplete"
      @edit="handleEdit"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskItem from '@/components/task/TaskItem.vue'
import type { Task } from '@/types'

const tasks = ref<Task[]>([
  {
    id: '1',
    title: '完成项目文档',
    projectId: 'project-1',
    priority: 'high',
    tags: ['文档', '重要'],
    dueDate: new Date('2024-01-20'),
    completed: false,
    // ... 其他字段
  },
])

const handleToggleComplete = (taskId: string) => {
  console.log('Toggle complete:', taskId)
}

const handleEdit = (taskId: string) => {
  console.log('Edit task:', taskId)
}

const handleDragStart = (task: Task) => {
  console.log('Drag start:', task)
}

const handleDragEnd = () => {
  console.log('Drag end')
}
</script>
```

## 视觉状态

### 优先级标识

- 🔴 高优先级
- 🟡 中优先级
- 🟢 低优先级
- 无标识：无优先级

### 截止日期状态

- **过期任务**：红色文字 + 红色左边框 + "已过期"徽章
- **即将到来**（7天内）：橙色文字 + 橙色左边框
- **正常任务**：灰色文字

### 完成状态

- 已完成任务：标题删除线 + 降低透明度
- 未完成任务：正常显示

## 交互行为

### 鼠标交互

- **悬停**：背景色变化 + 边框高亮 + 显示拖拽手柄
- **点击任务区域**：触发编辑事件
- **点击复选框**：切换完成状态
- **拖拽手柄**：支持拖拽排序（仅未完成任务）

### 键盘交互

- **Tab**：聚焦到任务项
- **Enter**：触发编辑事件
- **Space**：切换完成状态

## 可访问性

- ✅ 所有交互元素都有 ARIA 标签
- ✅ 支持完整的键盘导航
- ✅ 焦点指示器清晰可见
- ✅ 高对比度模式支持
- ✅ 减少动画模式支持

## 样式定制

组件使用 CSS 变量，支持主题定制：

```css
.task-item {
  --task-bg: #ffffff;
  --task-hover-bg: #f9fafb;
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --primary-color: #3b82f6;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --tag-bg: #e0e7ff;
  --tag-color: #4f46e5;
}
```

## 响应式设计

- **桌面端**：完整功能，包括拖拽手柄
- **移动端**：隐藏拖拽手柄，优化触摸交互

## 注意事项

1. **子任务功能**：根据用户要求，暂时跳过子任务进度显示
2. **重复任务**：根据用户要求，暂时跳过重复标识图标显示
3. **拖拽排序**：仅对未完成任务启用拖拽功能
4. **项目信息**：需要确保 projectStore 已初始化，否则项目信息可能不显示

## 相关组件

- TaskList - 任务列表容器
- TaskEditor - 任务编辑器
- TaskInput - 任务输入框

## 验收标准

- ✅ 需求 1.2: 点击完成复选框切换任务完成状态
- ✅ 需求 4.2: 使用不同颜色标识不同优先级的任务
- ✅ 需求 4.6: 任务截止日期临近时使用醒目颜色标识
- ✅ 需求 4.7: 任务已过期时显示"已过期"标识
- ✅ 需求 13.5: 为所有交互元素提供悬停状态的视觉反馈
- ✅ 需求 13.6: 使用动画过渡效果提升用户体验
- ✅ 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
- ✅ 需求 19.2: 支持完整的键盘导航
