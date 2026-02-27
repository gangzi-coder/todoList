<template>
  <div class="example-container">
    <h2>TaskInput 组件示例</h2>

    <!-- 基础用法 -->
    <section class="example-section">
      <h3>基础用法</h3>
      <TaskInput
        placeholder="输入任务标题..."
        @submit="handleSubmit"
      />
      <div v-if="lastSubmitted" class="result">
        最后提交的任务：{{ lastSubmitted }}
      </div>
    </section>

    <!-- 自定义占位符 -->
    <section class="example-section">
      <h3>自定义占位符</h3>
      <TaskInput
        placeholder="今天要做什么？"
        @submit="handleSubmit"
      />
    </section>

    <!-- 监听输入变化 -->
    <section class="example-section">
      <h3>监听输入变化</h3>
      <TaskInput
        placeholder="输入任务..."
        @input="handleInput"
        @submit="handleSubmit"
      />
      <div v-if="currentInput" class="result">
        当前输入：{{ currentInput }}
      </div>
    </section>

    <!-- 自动聚焦 -->
    <section class="example-section">
      <h3>自动聚焦</h3>
      <TaskInput
        placeholder="自动聚焦的输入框"
        autofocus
        @submit="handleSubmit"
      />
    </section>

    <!-- 使用 ref 控制 -->
    <section class="example-section">
      <h3>使用 ref 控制</h3>
      <TaskInput
        ref="taskInputRef"
        placeholder="可以通过 ref 控制"
        @submit="handleSubmit"
      />
      <div class="button-group">
        <button @click="focusInput">聚焦输入框</button>
        <button @click="setInputValue">设置值</button>
        <button @click="clearInput">清空输入</button>
      </div>
    </section>

    <!-- 任务列表 -->
    <section class="example-section">
      <h3>完整示例：任务列表</h3>
      <TaskInput
        placeholder="添加新任务..."
        @submit="addTask"
      />
      <ul v-if="tasks.length > 0" class="task-list">
        <li v-for="(task, index) in tasks" :key="index" class="task-item">
          <span>{{ task }}</span>
          <button @click="removeTask(index)">删除</button>
        </li>
      </ul>
      <div v-else class="empty-state">
        还没有任务，快来添加一个吧！
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskInput from './TaskInput.vue'

// 状态
const lastSubmitted = ref('')
const currentInput = ref('')
const tasks = ref<string[]>([])
const taskInputRef = ref<InstanceType<typeof TaskInput>>()

/**
 * 处理提交
 */
const handleSubmit = (title: string) => {
  lastSubmitted.value = title
  console.log('提交任务:', title)
}

/**
 * 处理输入
 */
const handleInput = (value: string) => {
  currentInput.value = value
}

/**
 * 添加任务
 */
const addTask = (title: string) => {
  tasks.value.push(title)
}

/**
 * 删除任务
 */
const removeTask = (index: number) => {
  tasks.value.splice(index, 1)
}

/**
 * 聚焦输入框
 */
const focusInput = () => {
  taskInputRef.value?.focus()
}

/**
 * 设置输入值
 */
const setInputValue = () => {
  taskInputRef.value?.setValue('这是一个预设的任务标题')
}

/**
 * 清空输入
 */
const clearInput = () => {
  taskInputRef.value?.clearInput()
}
</script>

<style scoped>
.example-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary, #1f2937);
}

.example-section {
  margin-bottom: 32px;
  padding: 20px;
  background-color: var(--section-bg, #f9fafb);
  border-radius: 8px;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-secondary, #4b5563);
}

.result {
  margin-top: 12px;
  padding: 12px;
  background-color: var(--result-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

button {
  padding: 8px 16px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: var(--primary-hover, #2563eb);
}

button:active {
  transform: scale(0.98);
}

.task-list {
  list-style: none;
  padding: 0;
  margin-top: 16px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--item-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.task-item:hover {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.task-item span {
  flex: 1;
  color: var(--text-primary, #1f2937);
}

.task-item button {
  padding: 6px 12px;
  background-color: var(--error-color, #ef4444);
  font-size: 13px;
}

.task-item button:hover {
  background-color: var(--error-hover, #dc2626);
}

.empty-state {
  margin-top: 16px;
  padding: 24px;
  text-align: center;
  color: var(--text-tertiary, #9ca3af);
  font-size: 14px;
  background-color: var(--empty-bg, #ffffff);
  border: 2px dashed var(--border-color, #e5e7eb);
  border-radius: 8px;
}

/* 暗色主题 */
:global(.dark) .example-section {
  --section-bg: #111827;
}

:global(.dark) .result,
:global(.dark) .task-item,
:global(.dark) .empty-state {
  --result-bg: #1f2937;
  --item-bg: #1f2937;
  --empty-bg: #1f2937;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #6b7280;
}
</style>
