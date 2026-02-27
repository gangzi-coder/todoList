<template>
  <div class="project-list" role="navigation" aria-label="项目列表">
    <!-- 标题区域 -->
    <div class="project-list-header">
      <h2 class="project-list-title">项目</h2>
    </div>

    <!-- 项目列表 -->
    <div class="project-list-items" role="list" aria-label="所有项目">
      <!-- 默认项目（收件箱）始终在顶部 -->
      <div v-if="defaultProject" role="listitem">
        <ProjectItem
          :project="defaultProject"
          :task-count="getTaskCount(defaultProject.id)"
          :is-active="currentProjectId === defaultProject.id"
          @click="handleSelectProject"
          @edit="handleEditProject"
          @delete="handleDeleteProject"
        />
      </div>

      <!-- 自定义项目列表 -->
      <div
        v-for="project in customProjects"
        :key="project.id"
        role="listitem"
      >
        <ProjectItem
          :project="project"
          :task-count="getTaskCount(project.id)"
          :is-active="currentProjectId === project.id"
          @click="handleSelectProject"
          @edit="handleEditProject"
          @delete="handleDeleteProject"
        />
      </div>
    </div>

    <!-- 添加新项目 -->
    <div class="project-list-add">
      <form
        v-if="isAdding"
        class="project-list-add-form"
        @submit.prevent="handleAddProject"
      >
        <input
          ref="addInputRef"
          v-model="newProjectName"
          type="text"
          class="project-list-add-input"
          placeholder="输入项目名称..."
          maxlength="50"
          aria-label="新项目名称"
          @keydown.escape="cancelAdd"
        />
        <div class="project-list-add-actions">
          <button
            type="submit"
            class="project-list-btn project-list-btn-confirm"
            :disabled="!newProjectName.trim()"
            aria-label="确认添加项目"
          >
            ✓
          </button>
          <button
            type="button"
            class="project-list-btn project-list-btn-cancel"
            aria-label="取消添加项目"
            @click="cancelAdd"
          >
            ✕
          </button>
        </div>
      </form>
      <button
        v-else
        class="project-list-add-btn"
        aria-label="添加新项目"
        @click="startAdd"
      >
        <span class="project-list-add-icon">+</span>
        <span>添加项目</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import ProjectItem from './ProjectItem.vue'
import { useProjects } from '@/composables/useProjects'

/**
 * ProjectList 组件
 *
 * 显示项目列表，集成 ProjectItem 组件，支持添加新项目和高亮当前选中项目
 *
 * 验收标准：
 * - 需求 2.1: 支持创建、编辑、删除项目
 * - 需求 2.9: 点击项目显示该项目的所有任务
 */

interface Props {
  /** 各项目的任务数量映射 { projectId: count } */
  taskCounts?: Record<string, number>
}

const props = withDefaults(defineProps<Props>(), {
  taskCounts: () => ({}),
})

interface Emits {
  /** 选择项目 */
  (e: 'select', projectId: string): void
  /** 编辑项目 */
  (e: 'edit', projectId: string): void
  /** 删除项目 */
  (e: 'delete', projectId: string): void
}

const emit = defineEmits<Emits>()

const {
  defaultProject,
  customProjects,
  currentProjectId,
  selectProject,
  createProject,
} = useProjects()

// 添加项目状态
const isAdding = ref(false)
const newProjectName = ref('')
const addInputRef = ref<HTMLInputElement | null>(null)

/**
 * 获取项目的任务数量
 */
const getTaskCount = (projectId: string): number => {
  return props.taskCounts[projectId] ?? 0
}

/**
 * 选择项目
 */
const handleSelectProject = (projectId: string) => {
  selectProject(projectId)
  emit('select', projectId)
}

/**
 * 编辑项目
 */
const handleEditProject = (projectId: string) => {
  emit('edit', projectId)
}

/**
 * 删除项目
 */
const handleDeleteProject = (projectId: string) => {
  emit('delete', projectId)
}

/**
 * 开始添加项目
 */
const startAdd = () => {
  isAdding.value = true
  newProjectName.value = ''
  nextTick(() => {
    addInputRef.value?.focus()
  })
}

/**
 * 取消添加
 */
const cancelAdd = () => {
  isAdding.value = false
  newProjectName.value = ''
}

/**
 * 确认添加项目
 */
const handleAddProject = async () => {
  const name = newProjectName.value.trim()
  if (!name) return

  try {
    const project = await createProject({ name })
    // 创建后自动选中新项目
    handleSelectProject(project.id)
    cancelAdd()
  } catch (err) {
    console.error('[ProjectList] 创建项目失败:', err)
  }
}
</script>

<style scoped>
/* 项目列表容器 */
.project-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 标题区域 */
.project-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
}

.project-list-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

/* 项目列表 */
.project-list-items {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-list-items::-webkit-scrollbar {
  width: 6px;
}

.project-list-items::-webkit-scrollbar-track {
  background: transparent;
}

.project-list-items::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #cbd5e1);
  border-radius: 3px;
}

.project-list-items::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #94a3b8);
}

/* 添加项目区域 */
.project-list-add {
  padding: 8px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

/* 添加按钮 */
.project-list-add-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: 1px dashed var(--border-color, #e5e7eb);
  border-radius: 8px;
  color: var(--text-secondary, #6b7280);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-list-add-btn:hover {
  background-color: var(--hover-bg, #f9fafb);
  border-color: var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
}

.project-list-add-btn:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.project-list-add-icon {
  font-size: 18px;
  font-weight: 300;
  line-height: 1;
}

/* 添加表单 */
.project-list-add-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-list-add-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--primary-color, #3b82f6);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  background-color: var(--input-bg, #ffffff);
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.project-list-add-input::placeholder {
  color: var(--text-placeholder, #9ca3af);
}

.project-list-add-actions {
  display: flex;
  gap: 4px;
}

.project-list-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-list-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.project-list-btn-confirm {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.project-list-btn-confirm:hover:not(:disabled) {
  background-color: var(--primary-hover, #2563eb);
}

.project-list-btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.project-list-btn-cancel {
  background-color: var(--cancel-bg, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

.project-list-btn-cancel:hover {
  background-color: var(--cancel-hover-bg, #e5e7eb);
}

/* 暗色主题 */
:global(.dark) .project-list {
  --text-secondary: #9ca3af;
  --text-primary: #f9fafb;
  --text-placeholder: #6b7280;
  --border-color: #374151;
  --hover-bg: #374151;
  --input-bg: #1f2937;
  --scrollbar-thumb: #4b5563;
  --scrollbar-thumb-hover: #6b7280;
  --cancel-bg: #374151;
  --cancel-hover-bg: #4b5563;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .project-list-header {
    padding: 8px 12px 6px;
  }

  .project-list-items {
    padding: 0 6px;
    gap: 3px;
  }

  .project-list-add {
    padding: 6px;
  }

  .project-list-add-btn {
    padding: 8px 10px;
    font-size: 13px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .project-list-add-btn,
  .project-list-btn {
    transition: none;
  }
}
</style>
