# Modal 组件

通用模态框组件，支持标题、内容、确认/取消按钮、键盘交互和过渡动画。

## 功能特性

- ✅ 支持标题、内容、确认/取消按钮
- ✅ 支持 Esc 键关闭
- ✅ 支持点击遮罩关闭
- ✅ 平滑的过渡动画效果
- ✅ 完整的 ARIA 标签支持
- ✅ 响应式设计（移动端适配）
- ✅ 暗色主题支持
- ✅ 自动管理 body 滚动

## 基础用法

```vue
<template>
  <button @click="showModal = true">打开模态框</button>
  
  <Modal
    v-model="showModal"
    title="标题"
    content="这是模态框的内容"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Modal from '@/components/common/Modal.vue'

const showModal = ref(false)

const handleConfirm = () => {
  console.log('已确认')
  showModal.value = false
}

const handleCancel = () => {
  console.log('已取消')
}
</script>
```

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `boolean` | - | 是否显示模态框（v-model） |
| `title` | `string` | `''` | 标题 |
| `content` | `string` | `''` | 内容文本（不使用默认插槽时） |
| `confirmText` | `string` | `'确认'` | 确认按钮文本 |
| `cancelText` | `string` | `'取消'` | 取消按钮文本 |
| `showConfirm` | `boolean` | `true` | 是否显示确认按钮 |
| `showCancel` | `boolean` | `true` | 是否显示取消按钮 |
| `showClose` | `boolean` | `true` | 是否显示关闭按钮 |
| `showFooter` | `boolean` | `true` | 是否显示底部 |
| `closeOnClickOverlay` | `boolean` | `true` | 点击遮罩是否关闭 |
| `closeOnEscape` | `boolean` | `true` | 按 Esc 键是否关闭 |
| `confirmDanger` | `boolean` | `false` | 确认按钮是否为危险样式 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 尺寸 |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `update:modelValue` | `(value: boolean)` | 模态框显示状态变化 |
| `confirm` | - | 点击确认按钮 |
| `cancel` | - | 点击取消按钮 |
| `close` | - | 模态框关闭 |

## Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 自定义内容区域 |
| `header` | 自定义头部 |
| `footer` | 自定义底部 |

## 使用示例

### 自定义内容

```vue
<Modal v-model="showModal" title="自定义内容">
  <div>
    <p>这是自定义的内容区域</p>
    <input type="text" placeholder="输入内容" />
  </div>
</Modal>
```

### 危险操作确认

```vue
<Modal
  v-model="showDeleteModal"
  title="确认删除"
  content="确定要删除这个项目吗？此操作不可撤销。"
  confirm-text="删除"
  :confirm-danger="true"
  @confirm="handleDelete"
/>
```

### 仅显示确认按钮

```vue
<Modal
  v-model="showInfoModal"
  title="提示信息"
  content="操作已成功完成！"
  :show-cancel="false"
  confirm-text="知道了"
  @confirm="showInfoModal = false"
/>
```

### 自定义底部按钮

```vue
<Modal v-model="showModal" title="自定义底部">
  <template #footer>
    <button @click="handleSave">保存草稿</button>
    <button @click="handlePublish">发布</button>
  </template>
</Modal>
```

### 禁用遮罩关闭

```vue
<Modal
  v-model="showModal"
  title="重要提示"
  content="请仔细阅读以下内容"
  :close-on-click-overlay="false"
/>
```

### 不同尺寸

```vue
<!-- 小尺寸 -->
<Modal v-model="showModal" title="小尺寸" size="small" />

<!-- 中等尺寸（默认） -->
<Modal v-model="showModal" title="中等尺寸" size="medium" />

<!-- 大尺寸 -->
<Modal v-model="showModal" title="大尺寸" size="large" />
```

## 键盘交互

- **Esc 键**：关闭模态框（可通过 `closeOnEscape` 禁用）
- **Tab 键**：在可聚焦元素间导航
- **Enter 键**：触发聚焦按钮的点击事件

## 可访问性

- 使用 `role="dialog"` 和 `aria-modal="true"` 标识模态框
- 使用 `aria-labelledby` 关联标题
- 为关闭按钮提供 `aria-label`
- 确保焦点指示器清晰可见
- 支持完整的键盘导航

## 主题支持

组件支持亮色和暗色主题，会自动根据全局主题切换样式。

## 响应式设计

在移动端（屏幕宽度 < 640px）时：
- 模态框占满整个屏幕
- 移除圆角
- 调整内边距以适应小屏幕

## 验收标准

- ✅ 需求 13.6: 使用动画过渡效果提升用户体验
- ✅ 需求 14.3: 支持使用 Esc 键关闭弹窗
- ✅ 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
