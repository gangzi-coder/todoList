# Dropdown 组件

通用下拉选择组件，支持单选/多选、搜索过滤、键盘导航和完整的可访问性支持。

## 功能特性

- ✅ 单选和多选模式
- ✅ 搜索过滤功能
- ✅ 完整的键盘导航支持
- ✅ 可访问性（ARIA 标签）
- ✅ 自定义选项渲染
- ✅ 禁用状态和禁用选项
- ✅ 响应式定位（自动调整上下位置）
- ✅ 暗色主题支持

## 基础用法

### 单选模式

```vue
<template>
  <Dropdown
    v-model="selectedValue"
    :options="options"
    placeholder="请选择"
    aria-label="选择选项"
  />
</template>

<script setup>
import { ref } from 'vue'
import Dropdown from '@/components/common/Dropdown.vue'

const selectedValue = ref('')
const options = [
  { label: '选项一', value: 'option-1' },
  { label: '选项二', value: 'option-2' },
  { label: '选项三', value: 'option-3' },
]
</script>
```

### 多选模式

```vue
<template>
  <Dropdown
    v-model="selectedValues"
    :options="options"
    :multiple="true"
    placeholder="请选择多个"
    aria-label="多选选项"
  />
</template>

<script setup>
import { ref } from 'vue'

const selectedValues = ref([])
const options = [
  { label: '选项一', value: 'option-1' },
  { label: '选项二', value: 'option-2' },
  { label: '选项三', value: 'option-3' },
]
</script>
```

### 可搜索下拉

```vue
<template>
  <Dropdown
    v-model="selectedValue"
    :options="options"
    :searchable="true"
    search-placeholder="搜索..."
    placeholder="请选择"
    aria-label="搜索并选择"
  />
</template>
```

### 简单数组

```vue
<template>
  <Dropdown
    v-model="selectedFruit"
    :options="['苹果', '香蕉', '橙子', '葡萄']"
    placeholder="选择水果"
  />
</template>

<script setup>
import { ref } from 'vue'

const selectedFruit = ref('')
</script>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `any \| any[]` | `undefined` | 当前选中的值（单选）或值数组（多选） |
| `options` | `DropdownOption[] \| string[] \| number[]` | `[]` | 选项列表 |
| `multiple` | `boolean` | `false` | 是否多选 |
| `searchable` | `boolean` | `false` | 是否可搜索 |
| `searchPlaceholder` | `string` | `'搜索...'` | 搜索框占位符 |
| `emptyText` | `string` | `'无匹配选项'` | 空状态文本 |
| `placeholder` | `string` | `'请选择'` | 占位符文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `ariaLabel` | `string` | `'下拉选择'` | ARIA 标签 |
| `labelKey` | `string` | `'label'` | 选项标签字段名 |
| `valueKey` | `string` | `'value'` | 选项值字段名 |
| `disabledKey` | `string` | `'disabled'` | 禁用字段名 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `value: any \| any[]` | 选中值变化时触发 |
| `change` | `value: any \| any[]` | 选中值变化时触发 |

## Slots

### trigger

自定义触发按钮内容。

```vue
<Dropdown v-model="selected" :options="options">
  <template #trigger="{ selected }">
    <span>自定义: {{ selected?.label }}</span>
  </template>
</Dropdown>
```

### option

自定义选项渲染。

```vue
<Dropdown v-model="selected" :options="options">
  <template #option="{ option, selected }">
    <div class="custom-option">
      <span>{{ option.label }}</span>
      <span v-if="selected">✓</span>
    </div>
  </template>
</Dropdown>
```

### empty

自定义空状态。

```vue
<Dropdown v-model="selected" :options="options" :searchable="true">
  <template #empty>
    <div>没有找到匹配的选项</div>
  </template>
</Dropdown>
```

## 键盘导航

| 按键 | 功能 |
|------|------|
| `Enter` / `Space` / `↓` | 打开下拉菜单 |
| `↑` / `↓` | 在选项间移动焦点 |
| `Enter` | 选择当前聚焦的选项 |
| `Esc` | 关闭下拉菜单 |
| `Home` | 跳到第一个选项 |
| `End` | 跳到最后一个选项 |

## 高级用法

### 带禁用选项

```vue
<template>
  <Dropdown
    v-model="selected"
    :options="options"
  />
</template>

<script setup>
import { ref } from 'vue'

const selected = ref('')
const options = [
  { label: '可选项 1', value: 'option-1', disabled: false },
  { label: '禁用项 2', value: 'option-2', disabled: true },
  { label: '可选项 3', value: 'option-3', disabled: false },
]
</script>
```

### 自定义字段名

```vue
<template>
  <Dropdown
    v-model="selected"
    :options="options"
    label-key="name"
    value-key="id"
    disabled-key="isDisabled"
  />
</template>

<script setup>
import { ref } from 'vue'

const selected = ref('')
const options = [
  { name: '选项一', id: 1, isDisabled: false },
  { name: '选项二', id: 2, isDisabled: true },
]
</script>
```

### 完整示例

```vue
<template>
  <Dropdown
    v-model="selectedProject"
    :options="projectOptions"
    :searchable="true"
    placeholder="选择项目"
    search-placeholder="搜索项目..."
    empty-text="未找到项目"
    aria-label="选择任务所属项目"
    @change="handleProjectChange"
  >
    <template #option="{ option, selected }">
      <div class="project-option">
        <span class="project-color" :style="{ backgroundColor: option.color }"></span>
        <span class="project-name">{{ option.name }}</span>
        <span v-if="selected" class="project-selected">✓</span>
      </div>
    </template>
  </Dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dropdown from '@/components/common/Dropdown.vue'

interface Project {
  id: string
  name: string
  color: string
}

const selectedProject = ref('inbox')

const projectOptions: Project[] = [
  { id: 'inbox', name: '收件箱', color: '#3b82f6' },
  { id: 'work', name: '工作', color: '#10b981' },
  { id: 'personal', name: '个人', color: '#f59e0b' },
]

const handleProjectChange = (value: string) => {
  console.log('项目已更改:', value)
}
</script>

<style scoped>
.project-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.project-name {
  flex: 1;
}

.project-selected {
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
}
</style>
```

## 可访问性

组件完全支持可访问性标准：

- 使用 `role="listbox"` 和 `role="option"` 语义化标记
- 提供 `aria-label`、`aria-expanded`、`aria-selected` 等 ARIA 属性
- 支持完整的键盘导航
- 焦点指示器清晰可见
- 支持屏幕阅读器

## 验收标准

本组件满足以下需求：

- **需求 19.2**: 支持完整的键盘导航（上下箭头、Enter、Esc）
- **需求 19.1**: 为所有交互元素提供适当的 ARIA 标签
- **需求 19.3**: 确保焦点指示器清晰可见
- **需求 19.8**: 确保所有功能都可以通过键盘访问

## 注意事项

1. 组件使用 `Teleport` 将下拉菜单渲染到 `body`，避免被父容器裁剪
2. 菜单位置会自动计算，优先在下方显示，空间不足时在上方显示
3. 多选模式下，点击选项不会关闭菜单，方便连续选择
4. 搜索功能使用简单的字符串包含匹配，可根据需要扩展为更复杂的匹配逻辑
5. 组件会自动处理窗口大小变化和滚动事件，保持菜单位置正确

## 样式定制

组件使用 CSS 变量，可以通过覆盖变量来定制样式：

```css
.dropdown {
  --input-bg: #ffffff;
  --menu-bg: #ffffff;
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --hover-bg: #f3f4f6;
  --selected-bg: #eff6ff;
  --primary-color: #3b82f6;
}
```
