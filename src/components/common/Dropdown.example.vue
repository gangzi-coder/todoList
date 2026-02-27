<template>
  <div class="dropdown-examples">
    <h1>Dropdown 组件示例</h1>

    <!-- 基础单选 -->
    <section class="example-section">
      <h2>基础单选</h2>
      <Dropdown
        v-model="selectedPriority"
        :options="priorityOptions"
        placeholder="选择优先级"
        aria-label="选择任务优先级"
      />
      <p class="result">选中值: {{ selectedPriority }}</p>
    </section>

    <!-- 多选模式 -->
    <section class="example-section">
      <h2>多选模式</h2>
      <Dropdown
        v-model="selectedTags"
        :options="tagOptions"
        :multiple="true"
        placeholder="选择标签"
        aria-label="选择任务标签"
      />
      <p class="result">选中值: {{ selectedTags.join(', ') }}</p>
    </section>

    <!-- 可搜索 -->
    <section class="example-section">
      <h2>可搜索下拉</h2>
      <Dropdown
        v-model="selectedProject"
        :options="projectOptions"
        :searchable="true"
        placeholder="选择项目"
        search-placeholder="搜索项目..."
        aria-label="选择项目"
      />
      <p class="result">选中值: {{ selectedProject }}</p>
    </section>

    <!-- 自定义选项渲染 -->
    <section class="example-section">
      <h2>自定义选项渲染</h2>
      <Dropdown
        v-model="selectedCustom"
        :options="customOptions"
        placeholder="选择选项"
        aria-label="选择自定义选项"
      >
        <template #option="{ option, selected }">
          <div class="custom-option">
            <span class="custom-option-icon" :style="{ color: option.color }">●</span>
            <span class="custom-option-label">{{ option.label }}</span>
            <span v-if="selected" class="custom-option-badge">已选</span>
          </div>
        </template>
      </Dropdown>
      <p class="result">选中值: {{ selectedCustom }}</p>
    </section>

    <!-- 禁用状态 -->
    <section class="example-section">
      <h2>禁用状态</h2>
      <Dropdown
        v-model="selectedDisabled"
        :options="priorityOptions"
        :disabled="true"
        placeholder="禁用的下拉框"
        aria-label="禁用的下拉框"
      />
    </section>

    <!-- 带禁用选项 -->
    <section class="example-section">
      <h2>带禁用选项</h2>
      <Dropdown
        v-model="selectedWithDisabled"
        :options="optionsWithDisabled"
        placeholder="选择选项"
        aria-label="选择选项（部分禁用）"
      />
      <p class="result">选中值: {{ selectedWithDisabled }}</p>
    </section>

    <!-- 简单数组 -->
    <section class="example-section">
      <h2>简单数组（字符串）</h2>
      <Dropdown
        v-model="selectedSimple"
        :options="simpleOptions"
        placeholder="选择水果"
        aria-label="选择水果"
      />
      <p class="result">选中值: {{ selectedSimple }}</p>
    </section>

    <!-- 键盘导航说明 -->
    <section class="example-section keyboard-help">
      <h2>键盘导航</h2>
      <ul>
        <li><kbd>Enter</kbd> / <kbd>Space</kbd> / <kbd>↓</kbd> - 打开下拉菜单</li>
        <li><kbd>↑</kbd> / <kbd>↓</kbd> - 在选项间移动</li>
        <li><kbd>Enter</kbd> - 选择当前聚焦的选项</li>
        <li><kbd>Esc</kbd> - 关闭下拉菜单</li>
        <li><kbd>Home</kbd> - 跳到第一个选项</li>
        <li><kbd>End</kbd> - 跳到最后一个选项</li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dropdown from './Dropdown.vue'

// 基础单选
const selectedPriority = ref('medium')
const priorityOptions = [
  { label: '高优先级', value: 'high' },
  { label: '中优先级', value: 'medium' },
  { label: '低优先级', value: 'low' },
  { label: '无优先级', value: 'none' },
]

// 多选
const selectedTags = ref(['工作', '重要'])
const tagOptions = [
  { label: '工作', value: '工作' },
  { label: '个人', value: '个人' },
  { label: '重要', value: '重要' },
  { label: '紧急', value: '紧急' },
  { label: '学习', value: '学习' },
]

// 可搜索
const selectedProject = ref('project-1')
const projectOptions = [
  { label: '收件箱', value: 'inbox' },
  { label: '工作项目', value: 'project-1' },
  { label: '个人项目', value: 'project-2' },
  { label: '学习计划', value: 'project-3' },
  { label: '健康管理', value: 'project-4' },
  { label: '财务规划', value: 'project-5' },
]

// 自定义选项
const selectedCustom = ref('option-1')
const customOptions = [
  { label: '选项一', value: 'option-1', color: '#3b82f6' },
  { label: '选项二', value: 'option-2', color: '#10b981' },
  { label: '选项三', value: 'option-3', color: '#f59e0b' },
  { label: '选项四', value: 'option-4', color: '#ef4444' },
]

// 禁用状态
const selectedDisabled = ref('medium')

// 带禁用选项
const selectedWithDisabled = ref('')
const optionsWithDisabled = [
  { label: '可选项 1', value: 'option-1', disabled: false },
  { label: '禁用项 2', value: 'option-2', disabled: true },
  { label: '可选项 3', value: 'option-3', disabled: false },
  { label: '禁用项 4', value: 'option-4', disabled: true },
  { label: '可选项 5', value: 'option-5', disabled: false },
]

// 简单数组
const selectedSimple = ref('')
const simpleOptions = ['苹果', '香蕉', '橙子', '葡萄', '西瓜']
</script>

<style scoped>
.dropdown-examples {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 40px;
  color: var(--text-primary, #1f2937);
}

.example-section {
  margin-bottom: 40px;
  padding: 24px;
  background-color: var(--section-bg, #f9fafb);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
}

h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary, #1f2937);
}

.result {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: var(--result-bg, #ffffff);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  border: 1px solid var(--border-color, #e5e7eb);
}

/* 自定义选项样式 */
.custom-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.custom-option-icon {
  font-size: 16px;
}

.custom-option-label {
  flex: 1;
}

.custom-option-badge {
  padding: 2px 8px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  font-size: 12px;
  border-radius: 12px;
}

/* 键盘帮助 */
.keyboard-help ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.keyboard-help li {
  padding: 8px 0;
  color: var(--text-primary, #1f2937);
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  background-color: var(--kbd-bg, #e5e7eb);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

/* 暗色主题 */
:global(.dark) .example-section {
  --section-bg: #1f2937;
  --result-bg: #111827;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --kbd-bg: #374151;
}
</style>
