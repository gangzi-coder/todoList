# DatePicker 组件

日期时间选择器组件，支持日期和时间选择、快捷选项、键盘导航。

## 功能特性

- ✅ 日期选择（日历视图）
- ✅ 时间选择（小时和分钟）
- ✅ 快捷选项（今天、明天、下周等）
- ✅ 键盘导航支持
- ✅ 日期范围限制
- ✅ 响应式设计
- ✅ 可访问性支持（ARIA 标签）
- ✅ 暗色主题支持

## 基础用法

```vue
<template>
  <DatePicker
    v-model="selectedDate"
    placeholder="选择日期"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DatePicker from '@/components/common/DatePicker.vue'

const selectedDate = ref<Date | null>(null)
</script>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `Date \| null` | `null` | 当前选中的日期（v-model） |
| `placeholder` | `string` | `'选择日期'` | 输入框占位符 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `enableTime` | `boolean` | `false` | 是否启用时间选择 |
| `showShortcuts` | `boolean` | `true` | 是否显示快捷选项 |
| `ariaLabel` | `string` | `'日期选择器'` | ARIA 标签 |
| `minDate` | `Date` | `undefined` | 最小可选日期 |
| `maxDate` | `Date` | `undefined` | 最大可选日期 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:modelValue` | `(value: Date \| null)` | 日期变化时触发 |
| `change` | `(value: Date \| null)` | 日期变化时触发 |

## 使用示例

### 日期时间选择

```vue
<DatePicker
  v-model="dateTime"
  placeholder="选择日期和时间"
  :enable-time="true"
/>
```

### 日期范围限制

```vue
<DatePicker
  v-model="limitedDate"
  placeholder="选择日期"
  :min-date="new Date()"
  :max-date="maxDate"
/>
```

### 不显示快捷选项

```vue
<DatePicker
  v-model="date"
  placeholder="选择日期"
  :show-shortcuts="false"
/>
```

### 禁用状态

```vue
<DatePicker
  v-model="date"
  placeholder="禁用的日期选择器"
  :disabled="true"
/>
```

## 键盘导航

- `Enter`: 打开/关闭日期选择器
- `Escape`: 关闭日期选择器
- `←/→`: 在日历中导航（月份切换）
- `↑/↓`: 在日历中导航（周切换）

## 快捷选项

默认提供以下快捷选项：

- 今天
- 明天
- 后天
- 下周
- 下月

## 可访问性

- 所有交互元素都有适当的 ARIA 标签
- 支持完整的键盘导航
- 焦点指示器清晰可见
- 符合 WCAG AA 标准

## 样式定制

组件使用 CSS 变量，可以通过覆盖这些变量来定制样式：

```css
.date-picker {
  --input-bg: #ffffff;
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --primary-color: #3b82f6;
  --hover-bg: #f3f4f6;
}
```

## 验收标准

- ✅ 需求 4.5: 允许用户为任务设置截止日期和时间
- ✅ 需求 19.2: 支持完整的键盘导航
- ✅ 需求 19.1: 为所有交互元素提供适当的 ARIA 标签

## 注意事项

1. 日期值始终为 `Date` 对象或 `null`
2. 时间选择使用 24 小时制
3. 日期范围限制会禁用超出范围的日期
4. 组件会自动处理月份边界和闰年
5. 面板位置会根据可用空间自动调整（上方或下方）
