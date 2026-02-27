# ProjectItem 组件

## 概述

ProjectItem 组件用于显示单个项目的信息，包括项目名称、颜色标识和未完成任务数量。

## 功能特性

### 核心功能
- ✅ 显示项目名称和颜色标识
- ✅ 显示未完成任务数量（任务数为 0 时不显示）
- ✅ 支持点击选择项目
- ✅ 支持编辑和删除操作（默认项目除外）
- ✅ 激活状态高亮显示

### 交互体验
- ✅ 悬停效果和过渡动画
- ✅ 键盘导航支持（Enter、Space 键）
- ✅ 操作按钮悬停时显示
- ✅ 点击操作按钮时阻止事件冒泡

### 可访问性
- ✅ 完整的 ARIA 标签支持
- ✅ 键盘导航支持
- ✅ 焦点指示器清晰可见
- ✅ 高对比度模式支持
- ✅ 减少动画模式支持

### 响应式设计
- ✅ 移动端适配
- ✅ 暗色主题支持

## Props

| 属性 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| project | Project | 是 | - | 项目数据 |
| taskCount | number | 是 | - | 未完成任务数量 |
| isActive | boolean | 否 | false | 是否为当前选中的项目 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| click | projectId: string | 点击项目时触发 |
| edit | projectId: string | 点击编辑按钮时触发 |
| delete | projectId: string | 点击删除按钮时触发 |

## 使用示例

```vue
<template>
  <ProjectItem
    :project="project"
    :task-count="5"
    :is-active="selectedProjectId === project.id"
    @click="handleProjectClick"
    @edit="handleProjectEdit"
    @delete="handleProjectDelete"
  />
</template>

<script setup lang="ts">
import ProjectItem from '@/components/project/ProjectItem.vue'
import type { Project } from '@/types'

const project: Project = {
  id: 'work',
  name: '工作项目',
  color: '#3b82f6',
  isDefault: false,
  createdAt: new Date(),
  order: 0,
}

const selectedProjectId = ref('work')

const handleProjectClick = (projectId: string) => {
  selectedProjectId.value = projectId
  // 切换到该项目的任务视图
}

const handleProjectEdit = (projectId: string) => {
  // 打开项目编辑对话框
}

const handleProjectDelete = (projectId: string) => {
  // 显示删除确认对话框
}
</script>
```

## 样式定制

组件使用 CSS 变量支持主题定制：

```css
.project-item {
  --project-bg: #ffffff;
  --project-hover-bg: #f9fafb;
  --project-active-bg: #eff6ff;
  --project-active-hover-bg: #dbeafe;
  --border-color: #e5e7eb;
  --primary-color: #3b82f6;
  --text-primary: #1f2937;
  --count-bg: #e5e7eb;
  --count-color: #6b7280;
  --action-hover-bg: #f3f4f6;
  --error-light-bg: #fee2e2;
}
```

## 测试覆盖

- ✅ 基本渲染测试
- ✅ 交互事件测试
- ✅ 键盘导航测试
- ✅ 可访问性测试
- ✅ 边界情况测试

测试文件：`src/components/project/__tests__/ProjectItem.test.ts`

## 需求映射

- **需求 2.3**: 允许为项目设置颜色标识 ✅
- **需求 2.8**: 在项目列表中显示每个项目的未完成任务数量 ✅
- **需求 2.9**: 点击项目显示该项目的所有任务 ✅
- **需求 13.5**: 为所有交互元素提供悬停状态的视觉反馈 ✅
- **需求 13.6**: 使用动画过渡效果提升用户体验 ✅
- **需求 19.1**: 为所有交互元素提供适当的 ARIA 标签 ✅
- **需求 19.2**: 支持完整的键盘导航 ✅

## 注意事项

1. **默认项目**: 默认项目（收件箱）不显示编辑和删除按钮
2. **事件冒泡**: 操作按钮的点击事件会阻止冒泡，不会触发项目的 click 事件
3. **任务数量**: 当任务数量为 0 时，不显示任务数量徽章
4. **键盘操作**: 支持 Enter 和 Space 键触发点击事件
5. **移动端**: 移动端始终显示操作按钮，桌面端仅在悬停时显示
