# TaskList 组件

任务列表组件，用于显示任务列表，支持虚拟滚动和拖拽排序。

## 功能特性

- ✅ 显示任务列表
- ✅ 集成 TaskItem 组件
- ✅ 虚拟滚动（优化长列表性能）
- ✅ 空状态提示
- ✅ 拖拽排序
- ✅ 响应式设计
- ✅ 可访问性支持

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tasks` | `Task[]` | - | 任务列表（必填） |
| `emptyTitle` | `string` | `'暂无任务'` | 空状态标题 |
| `emptyDescription` | `string` | `'创建一个新任务开始吧'` | 空状态描述 |
| `ariaLabel` | `string` | `'任务列表'` | 列表的 ARIA 标签 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `toggle-complete` | `taskId: string` | 切换任务完成状态 |
| `edit` | `taskId: string` | 编辑任务 |
| `reorder` | `fromIndex: number, toIndex: number` | 任务重新排序 |

## 使用示例

### 基础用法

```vue
<template>
  <TaskList
    :tasks="tasks"
    @toggle-complete="handleToggleComplete"
    @edit="handleEdit"
    @reorder="handleReorder"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskList from '@/components/task/TaskList.vue'
import type { Task } from '@/types'

const tasks = ref<Task[]>([
  {
    id: '1',
    title: '完成项目文档',
    projectId: 'inbox',
    priority: 'high',
    tags: ['工作'],
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 0,
  },
  // ... 更多任务
])

const handleToggleComplete = (taskId: string) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
  }
}

const handleEdit = (taskId: string) => {
  console.log('编辑任务:', taskId)
}

const handleReorder = (fromIndex: number, toIndex: number) => {
  const [task] = tasks.value.splice(fromIndex, 1)
  tasks.value.splice(toIndex, 0, task)
  
  // 更新 order 字段
  tasks.value.forEach((task, index) => {
    task.order = index
  })
}
</script>
```

### 自定义空状态

```vue
<template>
  <TaskList
    :tasks="filteredTasks"
    empty-title="没有找到匹配的任务"
    empty-description="尝试调整筛选条件"
    aria-label="已过滤的任务列表"
  />
</template>
```

### 与 Store 集成

```vue
<template>
  <TaskList
    :tasks="displayTasks"
    @toggle-complete="toggleComplete"
    @edit="openEditor"
    @reorder="reorderTasks"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TaskList from '@/components/task/TaskList.vue'
import { useTasks } from '@/composables/useTasks'
import { useFilters } from '@/composables/useFilters'

const { tasks, toggleComplete, updateTask } = useTasks()
const { filteredTasks } = useFilters()

const displayTasks = computed(() => filteredTasks.value)

const openEditor = (taskId: string) => {
  // 打开编辑器逻辑
}

const reorderTasks = async (fromIndex: number, toIndex: number) => {
  const taskList = displayTasks.value
  const [task] = taskList.splice(fromIndex, 1)
  taskList.splice(toIndex, 0, task)
  
  // 批量更新 order
  for (let i = 0; i < taskList.length; i++) {
    await updateTask(taskList[i].id, { order: i })
  }
}
</script>
```

## 虚拟滚动

组件内置了虚拟滚动功能，可以高效渲染大量任务：

- **性能优化**：只渲染可见区域的任务项
- **缓冲区**：上下各保留 3 个任务项的缓冲区，确保滚动流畅
- **自动计算**：根据容器高度和滚动位置自动计算可见任务
- **节流处理**：滚动事件使用 16ms 节流，减少计算频率

### 虚拟滚动配置

可以在组件内部调整以下常量来优化性能：

```typescript
const ITEM_HEIGHT = 80 // 每个任务项的估计高度（像素）
const BUFFER_SIZE = 3 // 上下缓冲区的项目数量
const SCROLL_THROTTLE = 16 // 滚动节流时间（毫秒）
```

## 拖拽排序

组件支持拖拽排序功能：

1. **拖拽手柄**：鼠标悬停在任务项上时显示拖拽手柄
2. **视觉反馈**：拖拽时显示半透明效果和插入指示器
3. **智能插入**：根据鼠标位置自动计算插入位置
4. **已完成任务**：已完成的任务不可拖拽

### 拖拽排序实现

```typescript
// 监听 reorder 事件
const handleReorder = (fromIndex: number, toIndex: number) => {
  // 1. 移动任务
  const [task] = tasks.value.splice(fromIndex, 1)
  tasks.value.splice(toIndex, 0, task)
  
  // 2. 更新 order 字段
  tasks.value.forEach((task, index) => {
    task.order = index
  })
  
  // 3. 保存到后端/Store
  saveTasks(tasks.value)
}
```

## 空状态

当任务列表为空时，显示友好的空状态提示：

- 大图标（📝）
- 自定义标题
- 自定义描述文本
- 居中对齐，视觉清晰

## 可访问性

组件遵循 WCAG 2.1 AA 标准：

- **语义化标签**：使用 `role="list"` 和 `role="listitem"`
- **ARIA 标签**：提供 `aria-label` 描述列表内容
- **键盘导航**：所有功能可通过键盘访问
- **焦点管理**：清晰的焦点指示器
- **屏幕阅读器**：支持屏幕阅读器正确读取

## 性能优化

- **虚拟滚动**：只渲染可见任务，支持 1000+ 任务流畅滚动
- **滚动节流**：16ms 节流，减少重复计算
- **响应式优化**：使用 `computed` 缓存计算结果
- **事件委托**：减少事件监听器数量

## 样式定制

组件使用 CSS 变量，支持主题定制：

```css
.task-list {
  --primary-color: #3b82f6;
  --scrollbar-track: #f1f5f9;
  --scrollbar-thumb: #cbd5e1;
  --scrollbar-thumb-hover: #94a3b8;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
}
```

## 响应式设计

- **桌面端**：完整功能，包括拖拽排序
- **移动端**：优化触摸操作，隐藏拖拽手柄
- **自适应布局**：根据屏幕尺寸调整间距和字体

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- 移动端浏览器

## 相关组件

- [TaskItem](./TaskItem.README.md) - 任务项组件
- [TaskInput](./TaskInput.README.md) - 任务输入组件
- [TaskEditor](./TaskEditor.README.md) - 任务编辑器组件

## 验收标准

- ✅ 需求 16.5: 支持流畅渲染包含 1000 个任务的列表
- ✅ 需求 16.6: 使用虚拟滚动技术优化长列表性能
