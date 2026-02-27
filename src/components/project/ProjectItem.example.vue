<template>
  <div class="example-container">
    <h2>ProjectItem 组件示例</h2>

    <section class="example-section">
      <h3>基本用法</h3>
      <div class="example-grid">
        <ProjectItem
          :project="workProject"
          :task-count="5"
          @click="handleProjectClick"
          @edit="handleProjectEdit"
          @delete="handleProjectDelete"
        />
      </div>
    </section>

    <section class="example-section">
      <h3>激活状态</h3>
      <div class="example-grid">
        <ProjectItem
          :project="workProject"
          :task-count="5"
          :is-active="true"
          @click="handleProjectClick"
          @edit="handleProjectEdit"
          @delete="handleProjectDelete"
        />
      </div>
    </section>

    <section class="example-section">
      <h3>无任务</h3>
      <div class="example-grid">
        <ProjectItem
          :project="personalProject"
          :task-count="0"
          @click="handleProjectClick"
          @edit="handleProjectEdit"
          @delete="handleProjectDelete"
        />
      </div>
    </section>

    <section class="example-section">
      <h3>默认项目（收件箱）</h3>
      <div class="example-grid">
        <ProjectItem
          :project="inboxProject"
          :task-count="12"
          @click="handleProjectClick"
        />
      </div>
      <p class="example-note">注意：默认项目不显示编辑和删除按钮</p>
    </section>

    <section class="example-section">
      <h3>不同颜色</h3>
      <div class="example-grid">
        <ProjectItem
          v-for="project in colorProjects"
          :key="project.id"
          :project="project"
          :task-count="3"
          @click="handleProjectClick"
          @edit="handleProjectEdit"
          @delete="handleProjectDelete"
        />
      </div>
    </section>

    <section class="example-section">
      <h3>项目列表</h3>
      <div class="example-list">
        <ProjectItem
          v-for="project in allProjects"
          :key="project.id"
          :project="project"
          :task-count="getTaskCount(project.id)"
          :is-active="selectedProjectId === project.id"
          @click="handleProjectClick"
          @edit="handleProjectEdit"
          @delete="handleProjectDelete"
        />
      </div>
    </section>

    <!-- 事件日志 -->
    <section class="example-section">
      <h3>事件日志</h3>
      <div class="event-log">
        <div v-if="events.length === 0" class="event-log-empty">
          暂无事件
        </div>
        <div
          v-for="(event, index) in events"
          :key="index"
          class="event-log-item"
        >
          <span class="event-log-type">{{ event.type }}</span>
          <span class="event-log-data">{{ event.data }}</span>
          <span class="event-log-time">{{ event.time }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProjectItem from './ProjectItem.vue'
import type { Project } from '@/types'

// 示例项目数据
const workProject: Project = {
  id: 'work',
  name: '工作项目',
  color: '#3b82f6',
  isDefault: false,
  createdAt: new Date('2024-01-01'),
  order: 0,
}

const personalProject: Project = {
  id: 'personal',
  name: '个人事务',
  color: '#10b981',
  isDefault: false,
  createdAt: new Date('2024-01-02'),
  order: 1,
}

const inboxProject: Project = {
  id: 'inbox',
  name: '收件箱',
  color: '#6b7280',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  order: -1,
}

const colorProjects: Project[] = [
  {
    id: 'red',
    name: '红色项目',
    color: '#ef4444',
    isDefault: false,
    createdAt: new Date(),
    order: 0,
  },
  {
    id: 'yellow',
    name: '黄色项目',
    color: '#f59e0b',
    isDefault: false,
    createdAt: new Date(),
    order: 1,
  },
  {
    id: 'green',
    name: '绿色项目',
    color: '#10b981',
    isDefault: false,
    createdAt: new Date(),
    order: 2,
  },
  {
    id: 'blue',
    name: '蓝色项目',
    color: '#3b82f6',
    isDefault: false,
    createdAt: new Date(),
    order: 3,
  },
  {
    id: 'purple',
    name: '紫色项目',
    color: '#8b5cf6',
    isDefault: false,
    createdAt: new Date(),
    order: 4,
  },
]

const allProjects: Project[] = [
  inboxProject,
  workProject,
  personalProject,
  {
    id: 'study',
    name: '学习计划',
    color: '#f59e0b',
    isDefault: false,
    createdAt: new Date('2024-01-03'),
    order: 2,
  },
  {
    id: 'health',
    name: '健康管理',
    color: '#ef4444',
    isDefault: false,
    createdAt: new Date('2024-01-04'),
    order: 3,
  },
]

// 状态
const selectedProjectId = ref<string>('work')
const events = ref<Array<{ type: string; data: string; time: string }>>([])

// 获取任务数量（模拟）
const getTaskCount = (projectId: string): number => {
  const counts: Record<string, number> = {
    inbox: 12,
    work: 5,
    personal: 0,
    study: 8,
    health: 3,
  }
  return counts[projectId] || 0
}

// 事件处理
const addEvent = (type: string, data: string) => {
  events.value.unshift({
    type,
    data,
    time: new Date().toLocaleTimeString(),
  })
  
  // 只保留最近 10 条事件
  if (events.value.length > 10) {
    events.value = events.value.slice(0, 10)
  }
}

const handleProjectClick = (projectId: string) => {
  selectedProjectId.value = projectId
  const project = allProjects.find(p => p.id === projectId)
  addEvent('click', `选择项目: ${project?.name}`)
}

const handleProjectEdit = (projectId: string) => {
  const project = allProjects.find(p => p.id === projectId)
  addEvent('edit', `编辑项目: ${project?.name}`)
}

const handleProjectDelete = (projectId: string) => {
  const project = allProjects.find(p => p.id === projectId)
  addEvent('delete', `删除项目: ${project?.name}`)
}
</script>

<style scoped>
.example-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1f2937;
}

.example-section {
  margin-bottom: 32px;
}

h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #374151;
}

.example-grid {
  display: grid;
  gap: 12px;
  max-width: 400px;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
}

.example-note {
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
  font-style: italic;
}

/* 事件日志 */
.event-log {
  max-width: 600px;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background-color: #f9fafb;
}

.event-log-empty {
  text-align: center;
  color: #9ca3af;
  padding: 24px;
}

.event-log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.event-log-item:last-child {
  border-bottom: none;
}

.event-log-type {
  flex-shrink: 0;
  padding: 2px 8px;
  background-color: #3b82f6;
  color: white;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
}

.event-log-data {
  flex: 1;
  color: #374151;
}

.event-log-time {
  flex-shrink: 0;
  color: #9ca3af;
  font-size: 12px;
}

/* 暗色主题 */
:global(.dark) .example-container {
  color: #f9fafb;
}

:global(.dark) h2 {
  color: #f9fafb;
}

:global(.dark) h3 {
  color: #e5e7eb;
}

:global(.dark) .example-note {
  color: #9ca3af;
}

:global(.dark) .event-log {
  background-color: #1f2937;
  border-color: #374151;
}

:global(.dark) .event-log-item {
  border-color: #374151;
}

:global(.dark) .event-log-data {
  color: #e5e7eb;
}
</style>
