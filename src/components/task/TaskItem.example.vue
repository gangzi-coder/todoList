<template>
  <div class="task-item-example">
    <h2>TaskItem 组件示例</h2>

    <div class="example-section">
      <h3>基本任务</h3>
      <TaskItem
        :task="basicTask"
        @toggle-complete="handleToggleComplete"
        @edit="handleEdit"
      />
    </div>

    <div class="example-section">
      <h3>高优先级任务（带标签）</h3>
      <TaskItem
        :task="highPriorityTask"
        @toggle-complete="handleToggleComplete"
        @edit="handleEdit"
      />
    </div>

    <div class="example-section">
      <h3>过期任务</h3>
      <TaskItem
        :task="overdueTask"
        @toggle-complete="handleToggleComplete"
        @edit="handleEdit"
      />
    </div>

    <div class="example-section">
      <h3>即将到来的任务</h3>
      <TaskItem
        :task="upcomingTask"
        @toggle-complete="handleToggleComplete"
        @edit="handleEdit"
      />
    </div>

    <div class="example-section">
      <h3>已完成任务</h3>
      <TaskItem
        :task="completedTask"
        @toggle-complete="handleToggleComplete"
        @edit="handleEdit"
      />
    </div>

    <div class="example-section">
      <h3>完整信息任务</h3>
      <TaskItem
        :task="fullTask"
        @toggle-complete="handleToggleComplete"
        @edit="handleEdit"
      />
    </div>

    <!-- 事件日志 -->
    <div class="event-log">
      <h3>事件日志</h3>
      <div class="log-content">
        <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskItem from './TaskItem.vue'
import type { Task } from '@/types'

// 事件日志
const eventLogs = ref<string[]>([])

const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  eventLogs.value.unshift(`[${timestamp}] ${message}`)
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop()
  }
}

// 示例任务数据
const basicTask = ref<Task>({
  id: '1',
  title: '完成项目文档',
  projectId: 'inbox',
  priority: 'none',
  tags: [],
  reminders: [],
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: 0,
})

const highPriorityTask = ref<Task>({
  id: '2',
  title: '修复生产环境 Bug',
  projectId: 'work',
  priority: 'high',
  tags: ['紧急', 'Bug'],
  dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2天后
  reminders: [],
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: 1,
})

const overdueTask = ref<Task>({
  id: '3',
  title: '提交月度报告',
  projectId: 'work',
  priority: 'medium',
  tags: ['报告'],
  dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2天前
  reminders: [],
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: 2,
})

const upcomingTask = ref<Task>({
  id: '4',
  title: '准备周会演示',
  projectId: 'work',
  priority: 'medium',
  tags: ['会议'],
  dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 明天
  reminders: [],
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: 3,
})

const completedTask = ref<Task>({
  id: '5',
  title: '完成代码审查',
  projectId: 'work',
  priority: 'low',
  tags: ['代码审查'],
  dueDate: new Date(),
  reminders: [],
  completed: true,
  completedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  order: 4,
})

const fullTask = ref<Task>({
  id: '6',
  title: '设计新功能原型并与团队讨论实现方案',
  projectId: 'design',
  priority: 'high',
  tags: ['设计', '原型', '讨论'],
  dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天后
  notes: '需要准备设计稿和技术方案',
  reminders: [],
  completed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  order: 5,
})

// 事件处理
const handleToggleComplete = (taskId: string) => {
  addLog(`切换任务完成状态: ${taskId}`)
  
  // 模拟切换状态
  const tasks = [basicTask, highPriorityTask, overdueTask, upcomingTask, completedTask, fullTask]
  const task = tasks.find(t => t.value.id === taskId)
  if (task) {
    task.value.completed = !task.value.completed
    if (task.value.completed) {
      task.value.completedAt = new Date()
    } else {
      task.value.completedAt = undefined
    }
  }
}

const handleEdit = (taskId: string) => {
  addLog(`编辑任务: ${taskId}`)
}
</script>

<style scoped>
.task-item-example {
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

h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-secondary, #6b7280);
}

.example-section {
  margin-bottom: 24px;
}

.event-log {
  margin-top: 32px;
  padding: 16px;
  background-color: var(--bg-secondary, #f9fafb);
  border-radius: 8px;
}

.log-content {
  max-height: 200px;
  overflow-y: auto;
  font-family: monospace;
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
:global(.dark) .task-item-example {
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --bg-secondary: #1f2937;
  --border-color: #374151;
}
</style>
