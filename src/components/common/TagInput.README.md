# TagInput 组件

标签输入组件，支持输入、删除、自动完成和颜色显示。

## 功能特性

- ✅ 支持输入和删除标签
- ✅ 支持 Enter 键或逗号分隔符快速添加标签
- ✅ 支持 Backspace 键删除最后一个标签
- ✅ 支持自动完成建议
- ✅ 支持键盘导航（上下箭头键、Enter、Esc）
- ✅ 为每个标签显示不同颜色
- ✅ 防止添加重复标签
- ✅ 限制标签长度（最多 20 个字符）
- ✅ 完整的可访问性支持（ARIA 标签）
- ✅ 响应式设计
- ✅ 支持亮色/暗色主题

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string[]` | `[]` | 当前选中的标签列表（v-model） |
| `suggestions` | `string[]` | `[]` | 可用的标签建议列表 |
| `placeholder` | `string` | `'添加标签...'` | 占位符文本 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `ariaLabel` | `string` | `'标签输入'` | ARIA 标签 |
| `separators` | `string[]` | `[',', 'Enter']` | 分隔符列表 |

## Events

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `value: string[]` | 标签列表更新时触发 |
| `change` | `value: string[]` | 标签列表变化时触发 |

## 基础用法

```vue
<template>
  <TagInput
    v-model="tags"
    :suggestions="availableTags"
    placeholder="输入标签..."
    @change="handleTagsChange"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TagInput from '@/components/common/TagInput.vue'

const tags = ref<string[]>(['工作', '重要'])
const availableTags = ref<string[]>(['工作', '个人', '学习', '紧急', '重要', '待办'])

const handleTagsChange = (newTags: string[]) => {
  console.log('标签已更新:', newTags)
}
</script>
```

## 自定义分隔符

```vue
<template>
  <TagInput
    v-model="tags"
    :separators="[',', ';', 'Enter']"
  />
</template>
```

## 禁用状态

```vue
<template>
  <TagInput
    v-model="tags"
    disabled
  />
</template>
```

## 键盘快捷键

- **Enter**: 添加当前输入的标签，或选择聚焦的建议
- **逗号 (,)**: 添加当前输入的标签（可自定义）
- **Backspace**: 当输入为空时，删除最后一个标签
- **↑/↓**: 在建议列表中导航
- **Esc**: 关闭建议列表并清空输入

## 标签颜色

组件为以下预定义标签使用固定颜色：

- 工作: 蓝色 (#3b82f6)
- 个人: 绿色 (#10b981)
- 学习: 橙色 (#f59e0b)
- 紧急: 红色 (#ef4444)
- 重要: 紫色 (#8b5cf6)
- 待办: 灰色 (#6b7280)

其他标签会根据标签名称自动生成唯一的颜色。

## 验证规则

- 标签不能为空
- 标签长度不能超过 20 个字符
- 不能添加重复的标签
- 标签前后的空格会被自动去除

## 可访问性

- 所有交互元素都有适当的 ARIA 标签
- 支持完整的键盘导航
- 删除按钮有描述性的 ARIA 标签（如"删除标签 工作"）
- 焦点指示器清晰可见

## 样式定制

组件使用 CSS 变量，可以通过覆盖这些变量来自定义样式：

```css
.tag-input {
  --input-bg: #ffffff;
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --text-tertiary: #9ca3af;
  --hover-bg: #f3f4f6;
  --primary-color: #3b82f6;
}
```

## 相关需求

- 需求 4.3: 允许为任务添加多个标签
- 需求 4.4: 支持创建、编辑、删除自定义标签
- 需求 18.5: 限制标签名称最多 20 个字符
- 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
- 需求 19.2: 支持完整的键盘导航
