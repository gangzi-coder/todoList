# Toast 组件

消息提示组件，用于显示操作反馈、错误提示、警告信息等。

## 功能特性

- ✅ 支持四种类型：成功、错误、警告、信息
- ✅ 自动隐藏（默认 5 秒）
- ✅ 支持手动关闭
- ✅ 支持多个 Toast 同时显示（堆叠）
- ✅ 支持自定义标题和持续时间
- ✅ 优雅的过渡动画
- ✅ 响应式设计，移动端友好
- ✅ 完整的可访问性支持（ARIA 标签）
- ✅ 支持亮色/暗色主题

## 基本用法

### 1. 在应用中添加 Toast 组件

在 `App.vue` 或主布局组件中添加 Toast 组件：

```vue
<template>
  <div id="app">
    <!-- 你的应用内容 -->
    
    <!-- Toast 组件 -->
    <Toast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Toast from './components/common/Toast.vue'
import { setToastInstance } from './composables/useToast'

const toastRef = ref()

onMounted(() => {
  if (toastRef.value) {
    setToastInstance(toastRef.value)
  }
})
</script>
```

### 2. 在组件中使用 Toast

```vue
<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const toast = useToast()

// 显示成功消息
const handleSave = () => {
  toast.success('保存成功！')
}

// 显示错误消息
const handleError = () => {
  toast.error('操作失败，请重试。')
}

// 显示警告消息
const handleWarning = () => {
  toast.warning('请注意，这是一个警告。')
}

// 显示信息消息
const handleInfo = () => {
  toast.info('这是一条信息提示。')
}
</script>
```

## API

### useToast()

返回一个包含以下方法的对象：

#### success(message, title?, duration?)

显示成功消息。

- `message` (string): 消息内容（必填）
- `title` (string): 消息标题（可选）
- `duration` (number): 持续时间（毫秒），默认 5000，设为 0 则不自动关闭（可选）
- 返回值: (string) Toast ID

```typescript
toast.success('任务已创建')
toast.success('任务已创建', '创建成功')
toast.success('任务已创建', '创建成功', 3000)
```

#### error(message, title?, duration?)

显示错误消息。

- `message` (string): 消息内容（必填）
- `title` (string): 消息标题（可选）
- `duration` (number): 持续时间（毫秒），默认 5000（可选）
- 返回值: (string) Toast ID

```typescript
toast.error('保存失败')
toast.error('保存失败，请重试', '错误')
toast.error('网络错误', '连接失败', 0) // 不自动关闭
```

#### warning(message, title?, duration?)

显示警告消息。

- `message` (string): 消息内容（必填）
- `title` (string): 消息标题（可选）
- `duration` (number): 持续时间（毫秒），默认 5000（可选）
- 返回值: (string) Toast ID

```typescript
toast.warning('任务标题不能为空')
toast.warning('任务标题不能为空', '验证警告')
```

#### info(message, title?, duration?)

显示信息消息。

- `message` (string): 消息内容（必填）
- `title` (string): 消息标题（可选）
- `duration` (number): 持续时间（毫秒），默认 5000（可选）
- 返回值: (string) Toast ID

```typescript
toast.info('正在加载数据...')
toast.info('正在加载数据...', '提示')
```

#### showToast(message, options?)

通用方法，显示任意类型的消息。

- `message` (string): 消息内容（必填）
- `options` (object): 配置选项（可选）
  - `type` ('success' | 'error' | 'warning' | 'info'): 消息类型，默认 'info'
  - `title` (string): 消息标题
  - `duration` (number): 持续时间（毫秒），默认 5000
- 返回值: (string) Toast ID

```typescript
toast.showToast('操作完成', {
  type: 'success',
  title: '成功',
  duration: 3000
})
```

#### dismissToast(id)

手动关闭指定的 Toast。

- `id` (string): Toast ID（必填）

```typescript
const toastId = toast.info('正在处理...')
// 稍后关闭
toast.dismissToast(toastId)
```

#### clearAll()

清除所有 Toast。

```typescript
toast.clearAll()
```

## 使用场景

### 1. 操作成功反馈

```typescript
const handleSaveTask = async () => {
  try {
    await saveTask(task)
    toast.success('任务已保存', '保存成功')
  } catch (error) {
    toast.error('保存失败，请重试', '错误')
  }
}
```

### 2. 表单验证错误

```typescript
const handleSubmit = () => {
  if (!taskTitle.value) {
    toast.warning('任务标题不能为空', '验证错误')
    return
  }
  // 继续提交...
}
```

### 3. 网络错误提示

```typescript
const handleLoadData = async () => {
  try {
    await loadData()
  } catch (error) {
    toast.error(
      '无法连接到服务器，请检查网络连接',
      '网络错误',
      0 // 不自动关闭，让用户手动关闭
    )
  }
}
```

### 4. 长时间操作提示

```typescript
const handleExport = async () => {
  const toastId = toast.info('正在导出数据...', '导出中', 0)
  
  try {
    await exportData()
    toast.dismissToast(toastId)
    toast.success('数据导出成功', '导出完成')
  } catch (error) {
    toast.dismissToast(toastId)
    toast.error('导出失败', '错误')
  }
}
```

### 5. 批量操作反馈

```typescript
const handleBatchDelete = async (ids: string[]) => {
  try {
    await batchDelete(ids)
    toast.success(`已删除 ${ids.length} 个任务`, '批量删除成功')
  } catch (error) {
    toast.error('部分任务删除失败', '批量删除失败')
  }
}
```

## 样式定制

Toast 组件使用 CSS 变量，可以通过覆盖这些变量来定制样式：

```css
:root {
  /* 成功消息 */
  --success-color: #10b981;
  --success-bg: #f0fdf4;
  --success-text: #065f46;
  
  /* 错误消息 */
  --error-color: #ef4444;
  --error-bg: #fef2f2;
  --error-text: #991b1b;
  
  /* 警告消息 */
  --warning-color: #f59e0b;
  --warning-bg: #fffbeb;
  --warning-text: #92400e;
  
  /* 信息消息 */
  --info-color: #3b82f6;
  --info-bg: #eff6ff;
  --info-text: #1e40af;
}
```

## 可访问性

Toast 组件遵循 WCAG 可访问性标准：

- 使用 `role="alert"` 和 `aria-live="polite"` 确保屏幕阅读器能够读取消息
- 为每个 Toast 提供描述性的 `aria-label`
- 关闭按钮有明确的 `aria-label`
- 支持键盘焦点和操作
- 颜色对比度符合 WCAG AA 标准

## 注意事项

1. **初始化**: 必须在应用启动时调用 `setToastInstance()` 来初始化 Toast 实例
2. **持续时间**: 默认 5 秒自动关闭，设为 0 则不自动关闭
3. **堆叠显示**: 多个 Toast 会自动堆叠显示，最新的在最上方
4. **响应式**: 在移动端会自动调整宽度和位置
5. **性能**: Toast 使用 Teleport 渲染到 body，不会影响组件层级

## 验收标准

本组件满足以下需求：

- ✅ 需求 17.1: 数据加载失败时显示友好的错误提示信息
- ✅ 需求 17.2: 数据保存失败时显示错误提示并提供重试选项
- ✅ 需求 17.3: 用户输入无效数据时显示具体的验证错误信息
- ✅ 需求 17.6: 为所有错误提示提供关闭按钮
- ✅ 需求 17.7: 在 5 秒后自动隐藏非关键错误提示
