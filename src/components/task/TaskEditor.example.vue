<template>
  <div class="task-editor-example">
    <h1>TaskEditor 组件示例</h1>

    <div class="example-section">
      <h2>基本用法</h2>
      <p>点击按钮打开任务编辑器</p>
      
      <div class="button-group">
        <button @click="openCreateMode" class="example-button">
          创建新任务
        </button>
        <button @click="openEditMode" class="example-button">
          编辑现有任务
        </button>
      </div>
    </div>

    <div class="example-section">
      <h2>最近提交的数据</h2>
      <pre v-if="lastSubmittedData" class="data-display">{{ JSON.stringify(lastSubmittedData, null, 2) }}</pre>
      <p v-else class="no-data">暂无数据</p>
    </div>

    <!-- TaskEditor 组件 -->
    <TaskEditor
      v-model="showEditor"
      :task="currentTask"
      :projects="projects"
      :available-tags="availableTags"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskEditor from './TaskEditor.vue'
import type { Task, Priority, CreateTaskDTO } from '../../types'

/**
 * TaskEditor 组件使用示例
 * 
 * 展示如何使用 TaskEditor 组件创建和编辑任务
 */

// 状态
const showEditor = ref(false)
const currentTask = ref<Task | null>(null)
const lastSubmittedData = ref<any>(null)

// 模拟项目数据
const projects = ref([
  { id: '1', name: '收件箱', color: '#6b7280' },
  { id: '2', name: '工作', color: '#3b82f6' },
  { id: '3', name: '个人', color: '#10b981' },
  { id: '4', name: '学习', color: '#f59e0b' },
])

// 模拟可用标签
const availableTags = ref([
  '工作',
  '个人',
  '学习',
  '紧急',
  '重要',
  '待办',
  '进行中',
])

/**
 * 打开创建模式
 */
const openCreateMode = () => {
  currentTask.value = null
  showEditor.value = true
}

/**
 * 打开编辑模式
 */
const openEditMode = () => {
  // 模拟一个现有任务
  currentTask.value = {
    id: 'task-1',
    title: '完成项目文档',
    notes: '需要包含架构设计、API 文档和使用说明',
    projectId: '2',
    priority: 'high' as Priority,
    tags: ['工作', '紧急'],
    dueDate: new Date('2024-12-31T18:00:00'),
    reminders: [],
    completed: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    order: 0,
  }
  showEditor.value = true
}

/**
 * 处理提交
 */
const handleSubmit = (data: CreateTaskDTO | Partial<Task>) => {
  console.log('提交数据:', data)
  lastSubmittedData.value = data
  
  if (currentTask.value) {
    // 编辑模式：更新任务
    console.log('更新任务:', currentTask.value.id, data)
    alert('任务已更新！')
  } else {
    // 创建模式：创建新任务
    console.log('创建新任务:', data)
    alert('任务已创建！')
  }
}

/**
 * 处理取消
 */
const handleCancel = () => {
  console.log('取消编辑')
  alert('已取消编辑')
}
</script>

<style scoped>
.task-editor-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin-bottom: 32px;
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
  color: var(--text-primary, #1f2937);
  margin-bottom: 12px;
}

p {
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  margin-bottom: 16px;
}

.button-group {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.example-button {
  padding: 10px 20px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.example-button:hover {
  background-color: var(--primary-hover, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.example-button:active {
  transform: translateY(0);
}

.data-display {
  background-color: var(--code-bg, #1f2937);
  color: var(--code-text, #f9fafb);
  padding: 16px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  margin: 0;
}

.no-data {
  color: var(--text-tertiary, #9ca3af);
  font-style: italic;
  margin: 0;
}

/* 暗色主题 */
:global(.dark) .example-section {
  --section-bg: #1f2937;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-tertiary: #6b7280;
  --code-bg: #111827;
  --code-text: #f9fafb;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .task-editor-example {
    padding: 20px 16px;
  }

  h1 {
    font-size: 24px;
  }

  .example-section {
    padding: 16px;
  }

  .button-group {
    flex-direction: column;
  }

  .example-button {
    width: 100%;
  }
}
</style>
