# TaskInput 组件

任务输入组件，用于快速添加新任务。

## 功能特性

- ✅ 任务标题输入
- ✅ Enter 键快速提交
- ✅ Esc 键清空输入
- ✅ 实时字符计数（最多 200 字符）
- ✅ 输入验证（非空、长度限制）
- ✅ 错误提示
- ✅ 键盘导航支持
- ✅ 可访问性（ARIA 标签）
- ✅ 暗色主题支持
- ✅ 响应式设计

## 验收标准

- **需求 1.1**: 用户输入任务文本并提交，创建新任务
- **需求 18.2**: 限制任务标题最多 200 个字符
- **需求 18.6**: 显示剩余字符数提示
- **需求 14.1**: 支持使用 Enter 键快速添加任务
- **需求 19.1**: 为所有交互元素提供适当的 ARIA 标签
- **需求 19.2**: 支持完整的键盘导航

## 基础用法

```vue
<template>
  <TaskInput
    placeholder="添加新任务..."
    @submit="handleSubmit"
  />
</template>

<script setup lang="ts">
import TaskInput from '@/components/task/TaskInput.vue'

const handleSubmit = (title: string) => {
  console.log('新任务:', title)
  // 创建任务逻辑
}
</script>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `placeholder` | `string` | `'添加新任务...'` | 输入框占位符 |
| `ariaLabel` | `string` | `'任务输入'` | ARIA 标签 |
| `autofocus` | `boolean` | `false` | 是否自动聚焦 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `submit` | `(title: string)` | 提交任务时触发，参数为任务标题 |
| `input` | `(value: string)` | 输入变化时触发，参数为当前输入值 |

## 暴露的方法

通过 `ref` 可以访问以下方法：

| 方法 | 参数 | 说明 |
|------|------|------|
| `focus()` | - | 聚焦输入框 |
| `setValue(value: string)` | `value`: 要设置的值 | 设置输入值 |
| `clearInput()` | - | 清空输入 |

### 使用示例

```vue
<template>
  <TaskInput ref="taskInputRef" @submit="handleSubmit" />
  <button @click="focusInput">聚焦</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskInput from '@/components/task/TaskInput.vue'

const taskInputRef = ref<InstanceType<typeof TaskInput>>()

const focusInput = () => {
  taskInputRef.value?.focus()
}

const handleSubmit = (title: string) => {
  console.log('新任务:', title)
}
</script>
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 提交任务 |
| `Esc` | 清空输入 |

## 输入验证

组件会自动验证输入：

1. **非空验证**：任务标题不能为空或只包含空白字符
2. **长度限制**：任务标题最多 200 个字符
3. **实时反馈**：
   - 剩余字符数 > 20：显示 `当前字符数/200`
   - 剩余字符数 ≤ 20：显示 `还可输入 X 个字符`（黄色警告）
   - 超出限制：显示 `超出 X 个字符`（红色错误）

## 错误处理

当验证失败时：
- 输入框边框变为红色
- 显示错误提示消息
- 不会触发 `submit` 事件

## 样式定制

组件使用 CSS 变量，可以通过覆盖变量来定制样式：

```css
.task-input-wrapper {
  --input-bg: #ffffff;           /* 输入框背景色 */
  --border-color: #e5e7eb;       /* 边框颜色 */
  --primary-color: #3b82f6;      /* 主题色 */
  --error-color: #ef4444;        /* 错误色 */
  --warning-color: #f59e0b;      /* 警告色 */
  --text-primary: #1f2937;       /* 主要文本颜色 */
  --text-tertiary: #9ca3af;      /* 次要文本颜色 */
}
```

## 可访问性

- 使用 `aria-label` 属性提供屏幕阅读器支持
- 错误提示使用 `role="alert"` 确保被屏幕阅读器读取
- 支持完整的键盘导航
- 焦点指示器清晰可见
- 支持高对比度模式

## 响应式设计

- 在移动设备上自动调整字体大小和内边距
- 确保触摸操作友好

## 暗色主题

组件自动支持暗色主题，当父元素有 `.dark` 类时自动切换：

```html
<div class="dark">
  <TaskInput @submit="handleSubmit" />
</div>
```

## 完整示例

```vue
<template>
  <div class="task-manager">
    <h2>我的任务</h2>
    
    <!-- 任务输入 -->
    <TaskInput
      ref="taskInputRef"
      placeholder="今天要做什么？"
      autofocus
      @submit="addTask"
      @input="handleInput"
    />
    
    <!-- 任务列表 -->
    <ul v-if="tasks.length > 0" class="task-list">
      <li v-for="task in tasks" :key="task.id">
        {{ task.title }}
      </li>
    </ul>
    
    <!-- 空状态 -->
    <div v-else class="empty-state">
      还没有任务，快来添加一个吧！
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskInput from '@/components/task/TaskInput.vue'
import { useTasks } from '@/composables/useTasks'

const taskInputRef = ref<InstanceType<typeof TaskInput>>()
const { tasks, createTask } = useTasks()

const addTask = async (title: string) => {
  try {
    await createTask({ title })
    // 任务创建成功，输入框会自动清空
  } catch (error) {
    console.error('创建任务失败:', error)
    // 可以显示错误提示
  }
}

const handleInput = (value: string) => {
  // 可以在这里实现实时搜索或其他功能
  console.log('当前输入:', value)
}
</script>
```

## 注意事项

1. **自然语言解析**：根据用户要求，自然语言解析器功能暂时跳过，组件只实现基础的任务输入功能
2. **验证逻辑**：组件使用 `@/utils/validation` 中的验证函数，确保验证逻辑统一
3. **字符计数**：使用 `String.length` 计算字符数，中文字符和英文字符都算 1 个字符
4. **提交行为**：只有验证通过才会触发 `submit` 事件，验证失败会显示错误提示

## 相关组件

- `TaskItem` - 任务项组件
- `TaskList` - 任务列表组件
- `TaskEditor` - 任务编辑器组件

## 相关工具

- `@/utils/validation` - 输入验证工具
- `@/composables/useTasks` - 任务管理 Composable
