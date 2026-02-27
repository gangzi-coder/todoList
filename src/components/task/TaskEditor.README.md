# TaskEditor 组件

任务编辑器组件，用于创建和编辑任务的所有属性。

## 功能特性

- ✅ 支持创建和编辑两种模式
- ✅ 完整的表单验证
- ✅ 实时字符计数
- ✅ 集成通用组件（Modal、Dropdown、DatePicker、TagInput）
- ✅ 完整的可访问性支持
- ✅ 响应式设计
- ✅ 主题支持（亮色/暗色）

## 基本用法

```vue
<template>
  <TaskEditor
    v-model="showEditor"
    :task="currentTask"
    :projects="projects"
    :available-tags="tags"
    @submit="handleSubmit"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskEditor from '@/components/task/TaskEditor.vue'

const showEditor = ref(false)
const currentTask = ref(null)

const projects = ref([
  { id: '1', name: '收件箱', color: '#6b7280' },
  { id: '2', name: '工作', color: '#3b82f6' },
])

const tags = ref(['工作', '紧急', '重要'])

const handleSubmit = (data) => {
  console.log('提交数据:', data)
}

const handleCancel = () => {
  console.log('取消编辑')
}
</script>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `boolean` | - | 是否显示编辑器（必填） |
| `task` | `Task \| null` | `null` | 要编辑的任务（编辑模式时传入） |
| `projects` | `Array<{ id: string; name: string; color: string }>` | `[]` | 可用的项目列表 |
| `availableTags` | `string[]` | `[]` | 可用的标签列表（用于自动完成） |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `(value: boolean)` | 编辑器显示状态变化时触发 |
| `submit` | `(data: CreateTaskDTO \| Partial<Task>)` | 提交表单时触发 |
| `cancel` | `()` | 取消编辑时触发 |

## 表单字段

### 任务标题（必填）
- 类型：文本输入
- 验证：非空，最多 200 字符
- 显示：实时字符计数

### 项目
- 类型：下拉选择（Dropdown）
- 默认：收件箱项目

### 优先级
- 类型：下拉选择（Dropdown）
- 选项：高、中、低、无
- 默认：无

### 标签
- 类型：标签输入（TagInput）
- 功能：支持自动完成、多标签输入

### 截止日期
- 类型：日期时间选择器（DatePicker）
- 功能：支持日期和时间选择、快捷选项
- 警告：早于今天的日期会显示警告

### 备注
- 类型：多行文本输入
- 验证：最多 500 字符
- 显示：实时字符计数

## 验证规则

组件使用 `src/utils/validation.ts` 中的验证函数：

1. **标题验证**
   - 不能为空
   - 不能只包含空白字符
   - 长度不能超过 200 字符

2. **备注验证**
   - 可以为空
   - 长度不能超过 500 字符

3. **截止日期验证**
   - 可以为空
   - 早于今天会显示警告（但仍然有效）

## 模式说明

### 创建模式
- 当 `task` prop 为 `null` 时
- 显示"创建任务"标题
- 表单初始化为空
- 默认选择收件箱项目
- 提交时触发 `submit` 事件，参数为 `CreateTaskDTO`

### 编辑模式
- 当 `task` prop 有值时
- 显示"编辑任务"标题
- 表单填充现有任务数据
- 提交时触发 `submit` 事件，参数为 `Partial<Task>`

## 可访问性

组件完全支持可访问性标准：

- ✅ 所有表单控件都有适当的标签
- ✅ 必填字段标记 `aria-required`
- ✅ 错误状态标记 `aria-invalid`
- ✅ 错误消息使用 `aria-describedby` 关联
- ✅ 支持完整的键盘导航
- ✅ 焦点指示器清晰可见

## 样式定制

组件使用 CSS 变量，可以通过覆盖变量来定制样式：

```css
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --danger-color: #ef4444;
  --warning-color: #f59e0b;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --input-bg: #ffffff;
  --button-secondary-bg: #f3f4f6;
  --button-secondary-hover: #e5e7eb;
}
```

## 主题支持

组件自动支持亮色和暗色主题，通过全局 `.dark` 类切换：

```html
<html class="dark">
  <!-- 暗色主题 -->
</html>
```

## 响应式设计

组件在不同屏幕尺寸下都能正常显示：

- **桌面端**：标准布局
- **移动端**：
  - 按钮垂直排列
  - 优化触摸操作
  - 全屏模态框

## 示例

查看 `TaskEditor.example.vue` 文件获取完整的使用示例。

## 类型定义

```typescript
import type { Task, Priority, CreateTaskDTO } from '@/types'

interface Props {
  modelValue: boolean
  task?: Task | null
  projects?: Array<{ id: string; name: string; color: string }>
  availableTags?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: CreateTaskDTO | Partial<Task>): void
  (e: 'cancel'): void
}
```

## 注意事项

1. **重复任务和提醒功能**：根据项目需求，这两个功能已被跳过，但组件预留了相关接口
2. **表单验证**：验证在提交时执行，无效表单会阻止提交
3. **数据处理**：组件只负责收集和验证数据，实际的创建/更新逻辑由父组件处理
4. **关闭行为**：提交成功后自动关闭编辑器

## 相关组件

- [Modal](../common/Modal.README.md) - 模态框容器
- [Dropdown](../common/Dropdown.README.md) - 下拉选择
- [DatePicker](../common/DatePicker.README.md) - 日期时间选择器
- [TagInput](../common/TagInput.README.md) - 标签输入

## 测试

运行测试：

```bash
npm run test -- src/components/task/__tests__/TaskEditor.test.ts
```

测试覆盖：
- ✅ 创建模式
- ✅ 编辑模式
- ✅ 表单验证
- ✅ 表单提交
- ✅ 取消操作
- ✅ 可访问性
- ✅ 组件集成

## 更新日志

### v1.0.0
- 初始版本
- 支持创建和编辑任务
- 完整的表单验证
- 集成通用组件
- 可访问性支持
