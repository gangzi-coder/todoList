<template>
  <div class="task-list-example">
    <h1>TaskList 组件示例</h1>

    <!-- 示例 1: 基础用法 -->
    <section class="example-section">
      <h2>基础用法</h2>
      <div class="example-container">
        <TaskList
          :tasks="basicTasks"
          @toggle-complete="handleToggleComplete"
          @edit="handleEdit"
          @reorder="handleReorder"
        />
      </div>
    </section>

    <!-- 示例 2: 空状态 -->
    <section class="example-section">
      <h2>空状态</h2>
      <div class="example-container">
        <TaskList
          :tasks="[]"
          empty-title="没有任务"
          empty-description="点击上方按钮创建第一个任务"
        />
      </div>
    </section>

    <!-- 示例 3: 大量任务（虚拟滚动） -->
    <section class="example-section">
      <h2>大量任务（虚拟滚动）</h2>
      <div class="example-controls">
        <button @click="generateTasks(100)">生成 100 个任务</button>
        <button @click="generateTasks(500)">生成 500 个任务</button>
        <button @click="generateTasks(1000)">生成 1000 个任务</button>
        <button @click="largeTasks = []">清空</button>
        <span class="task-count">当前任务数: {{ largeTasks.length }}</span>
      </div>
      <div class="example-container large">
        <TaskList
          :tasks="largeTasks"
          @toggle-complete="handleToggleComplete"
          @edit="handleEdit"
          @reorder="handleReorderLarge"
        />
      </div>
    </section>

    <!-- 示例 4: 已过滤任务 -->
    <section class="example-section">
      <h2>已过滤任务</h2>
      <div class="example-controls">
        <label>
          <input type="checkbox" v-model="showCompleted" />
          显示已完成
        </label>
        <label>
          <input type="checkbox" v-model="showHighPriority" />
          仅显示高优先级
        </label>
      </div>
      <div class="example-container">
        <TaskList
          :tasks="filteredTasks"
          empty-title="没有匹配的任务"
          empty-description="尝试调整筛选条件"
          aria-label="已过滤的任务列表"
          @toggle-complete="handleToggleComplete"
          @edit="handleEdit"
          @reorder="handleReorder"
        />
      </div>
    </section>

    <!-- 操作日志 -->
    <section class="example-section">
      <h2>操作日志</h2>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TaskList from './TaskList.vue'
import type { Task, Priority } from '@/types'

// 基础任务列表
const basicTasks = ref<Task[]>([
  {
    id: '1',
    title: '完成项目文档',
    projectId: 'work',
    priority: 'high',
    tags: ['工作', '文档'],
    dueDate: new Date(Date.now() + 86400000), // 明天
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 0,
    reminders: [],
  },
  {
    id: '2',
    title: '修复登录页面 Bug',
    projectId: 'work',
    priority: 'high',
    tags: ['工作', 'Bug'],
    dueDate: new Date(Date.now() - 86400000), // 昨天（已过期）
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 1,
    reminders: [],
  },
  {
    id: '3',
    title: '购买生日礼物',
    projectId: 'personal',
    priority: 'medium',
    tags: ['个人'],
    dueDate: new Date(Date.now() + 86400000 * 3), // 3 天后
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 2,
    reminders: [],
  },
  {
    id: '4',
    title: '阅读技术文章',
    projectId: 'personal',
    priority: 'low',
    tags: ['学习'],
    completed: true,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 3,
    reminders: [],
  },
  {
    id: '5',
    title: '准备周会分享',
    projectId: 'work',
    priority: 'medium',
    tags: ['工作', '会议'],
    dueDate: new Date(Date.now() + 86400000 * 7), // 7 天后
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 4,
    reminders: [],
  },
])

// 大量任务列表
const largeTasks = ref<Task[]>([])

// 过滤条件
const showCompleted = ref(false)
const showHighPriority = ref(false)

// 已过滤任务
const filteredTasks = computed(() => {
  let tasks = basicTasks.value

  if (!showCompleted.value) {
    tasks = tasks.filter(t => !t.completed)
  }

  if (showHighPriority.value) {
    tasks = tasks.filter(t => t.priority === 'high')
  }

  return tasks
})

// 操作日志
const logs = ref<string[]>([])

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.unshift(`[${timestamp}] ${message}`)
  if (logs.value.length > 10) {
    logs.value.pop()
  }
}

// 生成大量任务
const generateTasks = (count: number) => {
  const priorities: Priority[] = ['high', 'medium', 'low', 'none']
  const projects = ['work', 'personal', 'study', 'health']
  const tagsList = [
    ['工作', '紧急'],
    ['个人', '生活'],
    ['学习', '技术'],
    ['健康', '运动'],
  ]

  largeTasks.value = Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `任务 ${i + 1}: ${generateRandomTitle()}`,
    projectId: projects[i % projects.length],
    priority: priorities[i % priorities.length],
    tags: tagsList[i % tagsList.length],
    dueDate: i % 3 === 0 ? new Date(Date.now() + Math.random() * 86400000 * 30) : undefined,
    completed: i % 10 === 0,
    completedAt: i % 10 === 0 ? new Date() : undefined,
    createdAt: new Date(Date.now() - Math.random() * 86400000 * 30),
    updatedAt: new Date(),
    order: i,
    reminders: [],
  }))

  addLog(`生成了 ${count} 个任务`)
}

const generateRandomTitle = () => {
  const titles = [
    '完成代码审查',
    '更新项目文档',
    '修复已知问题',
    '优化性能',
    '编写单元测试',
    '设计新功能',
    '参加团队会议',
    '学习新技术',
    '整理笔记',
    '回复邮件',
  ]
  return titles[Math.floor(Math.random() * titles.length)]
}

// 切换完成状态
const handleToggleComplete = (taskId: string) => {
  // 在基础任务中查找
  let task = basicTasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
    task.completedAt = task.completed ? new Date() : undefined
    addLog(`切换任务 "${task.title}" 完成状态: ${task.completed ? '已完成' : '未完成'}`)
    return
  }

  // 在大量任务中查找
  task = largeTasks.value.find(t => t.id === taskId)
  if (task) {
    task.completed = !task.completed
    task.completedAt = task.completed ? new Date() : undefined
    addLog(`切换任务 "${task.title}" 完成状态: ${task.completed ? '已完成' : '未完成'}`)
  }
}

// 编辑任务
const handleEdit = (taskId: string) => {
  const task = basicTasks.value.find(t => t.id === taskId) || 
                largeTasks.value.find(t => t.id === taskId)
  if (task) {
    addLog(`编辑任务: "${task.title}"`)
  }
}

// 重新排序（基础任务）
const handleReorder = (fromIndex: number, toIndex: number) => {
  const [task] = basicTasks.value.splice(fromIndex, 1)
  basicTasks.value.splice(toIndex, 0, task)
  
  // 更新 order
  basicTasks.value.forEach((task, index) => {
    task.order = index
  })
  
  addLog(`任务重新排序: 从位置 ${fromIndex} 移动到 ${toIndex}`)
}

// 重新排序（大量任务）
const handleReorderLarge = (fromIndex: number, toIndex: number) => {
  const [task] = largeTasks.value.splice(fromIndex, 1)
  largeTasks.value.splice(toIndex, 0, task)
  
  // 更新 order
  largeTasks.value.forEach((task, index) => {
    task.order = index
  })
  
  addLog(`任务重新排序: 从位置 ${fromIndex} 移动到 ${toIndex}`)
}
</script>

<style scoped>
.task-list-example {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 32px;
  color: var(--text-primary, #1f2937);
}

.example-section {
  margin-bottom: 48px;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary, #1f2937);
}

.example-container {
  height: 400px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--bg-secondary, #f9fafb);
}

.example-container.large {
  height: 600px;
}

.example-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.example-controls button {
  padding: 8px 16px;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.example-controls button:hover {
  background-color: var(--primary-hover, #2563eb);
}

.example-controls label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
}

.example-controls input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--primary-color, #3b82f6);
}

.task-count {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
  padding: 8px 12px;
  background-color: var(--bg-tertiary, #f3f4f6);
  border-radius: 6px;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  background-color: var(--bg-secondary, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 13px;
}

.log-item {
  padding: 4px 0;
  color: var(--text-secondary, #6b7280);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.log-item:last-child {
  border-bottom: none;
}

/* 暗色主题 */
:global(.dark) .task-list-example {
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  --border-color: #374151;
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
}
</style>
