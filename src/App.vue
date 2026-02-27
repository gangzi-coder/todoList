<template>
  <div id="app" class="app-container" :class="{ 'dark': isDark, 'no-animations': !animationsEnabled }">
    <!-- 跳转到主内容链接（屏幕阅读器和键盘导航） -->
    <a href="#main-content" class="skip-to-content" @click.prevent="skipToContent">
      跳转到主内容
    </a>

    <!-- 顶部栏 -->
    <header class="app-header">
      <div class="app-header-left">
        <button class="sidebar-toggle" @click="toggleSidebar" aria-label="切换侧边栏" :aria-expanded="sidebarVisible" title="切换侧边栏">☰</button>
        <h1 class="app-title">📝 待办事项</h1>
      </div>
      <div class="app-header-center">
        <SearchBar @select-task="handleEditTask" />
      </div>
      <div class="app-header-right">
        <button class="header-btn" @click="toggleTheme" :title="isDark ? '切换亮色 (Ctrl+D)' : '切换暗色 (Ctrl+D)'" :aria-label="isDark ? '切换亮色模式' : '切换暗色模式'">
          {{ isDark ? '☀️' : '🌙' }}
        </button>
        <button class="header-btn" @click="toggleRightSidebar" :title="rightSidebarVisible ? '隐藏统计' : '显示统计'" :aria-label="rightSidebarVisible ? '隐藏统计面板' : '显示统计面板'" :aria-expanded="rightSidebarVisible">
          📊
        </button>
        <button class="header-btn" @click="openSettings" title="设置" aria-label="打开设置">
          ⚙️
        </button>
      </div>
    </header>

    <!-- 主体 -->
    <div class="app-body">
      <!-- 左侧边栏遮罩（移动端） -->
      <div
        v-if="sidebarVisible"
        class="sidebar-overlay"
        @click="toggleSidebar"
      />

      <!-- 左侧边栏 -->
      <aside class="app-sidebar" :class="{ 'app-sidebar-visible': sidebarVisible }" aria-label="侧边栏导航">
        <!-- 视图选择器 -->
        <div class="sidebar-section">
          <div class="nav-section-title">视图</div>
          <ViewSelector
            :current-view="currentView"
            :view-counts="viewCounts"
            @change="setView"
          />
        </div>

        <!-- 项目列表 -->
        <div class="sidebar-section sidebar-section-projects">
          <ProjectList
            :task-counts="projectTaskCounts"
            @select="selectProject"
            @edit="handleEditProject"
            @delete="handleDeleteProject"
          />
        </div>
      </aside>

      <!-- 主内容区 -->
      <main id="main-content" class="app-main" aria-label="任务管理" tabindex="-1">
        <!-- 视图标题和工具栏 -->
        <div class="main-header">
          <h2 class="view-title">{{ currentViewLabel }}</h2>
          <div class="main-toolbar">
            <button
              class="toolbar-btn"
              :class="{ 'toolbar-btn-active': showFilterPanel }"
              @click="showFilterPanel = !showFilterPanel"
              title="过滤"
              aria-label="切换过滤面板"
            >
              🔽 过滤
              <span v-if="activeFilterCount > 0" class="toolbar-badge">{{ activeFilterCount }}</span>
            </button>
            <button
              class="toolbar-btn"
              :class="{ 'toolbar-btn-active': showSortPanel }"
              @click="showSortPanel = !showSortPanel"
              title="排序"
              aria-label="切换排序面板"
            >
              🔃 排序
            </button>
          </div>
        </div>

        <!-- 过滤面板（可折叠） -->
        <div v-if="showFilterPanel" class="filter-panel-wrapper">
          <FilterPanel
            :filter="uiStore.filter"
            :available-tags="allTags"
            @update:filter="handleFilterUpdate"
            @clear="handleFilterClear"
            @save-smart-list="handleSaveSmartList"
          />
        </div>

        <!-- 排序面板（可折叠） -->
        <div v-if="showSortPanel" class="sort-panel-wrapper">
          <SortSelector
            :current-sort="sortOption"
            :sort-ascending="uiStore.sortAscending"
            @change="handleSortChange"
          />
        </div>

        <!-- 任务输入 -->
        <TaskInput
          ref="taskInputRef"
          placeholder="添加新任务... (Enter 提交)"
          @submit="handleCreateTask"
        />

        <!-- 任务列表 -->
        <div class="task-list-container">
          <TaskList
            :tasks="displayTasks"
            :empty-title="emptyTitle"
            :empty-description="emptyDescription"
            @toggle-complete="handleToggleComplete"
            @edit="handleEditTask"
            @reorder="handleReorder"
          />
        </div>

        <!-- 底部统计栏 -->
        <div class="stats-bar" v-if="stats.total > 0" role="status" aria-label="任务统计">
          <span>共 {{ stats.total }} 个任务</span>
          <span>已完成 {{ stats.completed }}</span>
          <span>完成率 {{ stats.completionRate }}%</span>
          <span v-if="stats.overdue > 0" class="stat-overdue">过期 {{ stats.overdue }}</span>
        </div>
      </main>

      <!-- 右侧边栏遮罩（移动端） -->
      <div
        v-if="rightSidebarVisible"
        class="right-sidebar-overlay"
        @click="toggleRightSidebar"
      />

      <!-- 右侧边栏：统计面板 -->
      <aside class="app-right-sidebar" :class="{ 'app-right-sidebar-visible': rightSidebarVisible }" aria-label="统计面板">
        <div class="right-sidebar-header">
          <span class="right-sidebar-title">统计</span>
          <button class="right-sidebar-close" @click="toggleRightSidebar" aria-label="关闭统计面板">✕</button>
        </div>
        <div class="right-sidebar-content">
          <StatsPanel
            :tasks="taskStore.tasks"
            :project-id="currentProjectId || undefined"
          />
          <div class="right-sidebar-divider" />
          <div class="trend-chart-wrapper">
            <TrendChart :tasks="taskStore.tasks" />
          </div>
        </div>
      </aside>
    </div>

    <!-- 任务编辑器 -->
    <TaskEditor
      v-model="showTaskEditor"
      :task="editingTask"
      :projects="projectOptions"
      :available-tags="allTags"
      @submit="handleTaskEditorSubmit"
    />

    <!-- 项目编辑器 -->
    <Modal v-model="showProjectEditor" title="编辑项目">
      <ProjectEditor
        v-if="editingProject"
        :project="editingProject"
        :task-count="getProjectCount(editingProject.id)"
        @save="handleProjectEditorSave"
        @delete="handleDeleteProject"
        @cancel="showProjectEditor = false"
      />
    </Modal>

    <!-- 设置面板（模态框） -->
    <Modal v-model="showSettings" title="" :show-footer="false" :show-header="false">
      <SettingsPanel @close="showSettings = false" @toast="showToast" />
    </Modal>

    <!-- 删除确认对话框 -->
    <Modal
      v-model="showDeleteConfirm"
      title="确认删除"
      :content="deleteConfirmMessage"
      confirm-text="删除"
      :confirm-danger="true"
      @confirm="confirmDelete"
    />

    <!-- Toast 通知 -->
    <Toast ref="toastRef" />

    <!-- 操作加载指示器（异步操作时显示） -->
    <div v-if="operationLoading" class="operation-loading" role="status" aria-label="操作处理中">
      <div class="operation-loading-bar" aria-hidden="true"></div>
    </div>

    <!-- 加载状态 -->
    <div v-if="appLoading" class="app-loading" role="status" aria-label="应用加载中">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import TaskInput from './components/task/TaskInput.vue'
import TaskList from './components/task/TaskList.vue'
import TaskEditor from './components/task/TaskEditor.vue'
import ProjectList from './components/project/ProjectList.vue'
import ViewSelector from './components/filter/ViewSelector.vue'
import FilterPanel from './components/filter/FilterPanel.vue'
import SortSelector from './components/filter/SortSelector.vue'
import SearchBar from './components/filter/SearchBar.vue'
import Modal from './components/common/Modal.vue'
import Toast from './components/common/Toast.vue'
import { useTaskStore } from './stores/taskStore'
import { useProjectStore } from './stores/projectStore'
import { useUIStore } from './stores/uiStore'
import { useSettingsStore } from './stores/settingsStore'
import { filterEngine } from './services/FilterEngine'
import type { Task, CreateTaskDTO, ViewType, SortOption, TaskFilter, Project } from './types'
import { registerErrorNotify, unregisterErrorNotify } from './utils/errorHandler'

// 懒加载非关键组件（需求 16.8: 性能优化）
const StatsPanel = defineAsyncComponent(() => import('./components/stats/StatsPanel.vue'))
const TrendChart = defineAsyncComponent(() => import('./components/stats/TrendChart.vue'))
const SettingsPanel = defineAsyncComponent(() => import('./components/settings/SettingsPanel.vue'))
const ProjectEditor = defineAsyncComponent(() => import('./components/project/ProjectEditor.vue'))

// Stores
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()

// Refs
const taskInputRef = ref()
const toastRef = ref()

// 应用状态
const appLoading = ref(true)
/** 异步操作加载状态（用于非初始化的操作反馈） */
const operationLoading = ref(false)
const sidebarVisible = ref(true)
const rightSidebarVisible = ref(false)
const showFilterPanel = ref(false)
const showSortPanel = ref(false)
const showSettings = ref(false)
const showTaskEditor = ref(false)
const editingTask = ref<Task | null>(null)
const showProjectEditor = ref(false)
const editingProject = ref<Project | null>(null)
const showDeleteConfirm = ref(false)
const deleteConfirmMessage = ref('')
const pendingDeleteId = ref<string | null>(null)
const pendingDeleteType = ref<'task' | 'project'>('task')
const sortOption = ref<SortOption>('createdAt')

// 视图配置
const views = [
  { key: 'today' as ViewType, label: '今天', icon: '📅' },
  { key: 'upcoming' as ViewType, label: '即将到来', icon: '📆' },
  { key: 'inbox' as ViewType, label: '收件箱', icon: '📥' },
  { key: 'all' as ViewType, label: '所有任务', icon: '📋' },
]

// 计算属性
const isDark = computed(() => uiStore.isDarkTheme)
const animationsEnabled = computed(() => settingsStore.settings.enableAnimations)
const currentView = computed(() => uiStore.currentView)
const currentProjectId = computed(() => projectStore.currentProjectId)
const projects = computed(() => projectStore.projects)
const stats = computed(() => taskStore.stats)

const allTags = computed(() => {
  const tags = new Set<string>()
  taskStore.tasks.forEach(t => t.tags.forEach(tag => tags.add(tag)))
  return Array.from(tags)
})

const currentViewLabel = computed(() => {
  const view = views.find(v => v.key === currentView.value)
  return view ? `${view.icon} ${view.label}` : '所有任务'
})

const viewCounts = computed(() => ({
  today: filterEngine.getViewTasks('today', taskStore.tasks).length,
  upcoming: filterEngine.getViewTasks('upcoming', taskStore.tasks).length,
  inbox: filterEngine.getViewTasks('inbox', taskStore.tasks).length,
  all: taskStore.tasks.length,
}))

const projectTaskCounts = computed(() => {
  const counts: Record<string, number> = {}
  projects.value.forEach(p => {
    counts[p.id] = taskStore.tasks.filter(t => t.projectId === p.id && !t.completed).length
  })
  return counts
})

const projectOptions = computed(() =>
  projects.value.map(p => ({ id: p.id, name: p.name, color: p.color }))
)

const activeFilterCount = computed(() => {
  let count = 0
  if (uiStore.filter.priority?.length) count++
  if (uiStore.filter.tags?.length) count++
  if (uiStore.filter.completed !== undefined) count++
  return count
})

const displayTasks = computed(() => {
  let tasks = [...taskStore.tasks]

  // 搜索过滤（由 SearchBar 组件处理，这里保留兼容）
  if (uiStore.searchQuery.trim()) {
    const q = uiStore.searchQuery.toLowerCase()
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    )
    return filterEngine.applySort(tasks, sortOption.value)
  }

  // 视图过滤
  tasks = filterEngine.getViewTasks(currentView.value, tasks)

  // 项目过滤（仅在非收件箱视图时）
  if (currentView.value !== 'inbox' && currentProjectId.value && currentProjectId.value !== 'inbox') {
    tasks = tasks.filter(t => t.projectId === currentProjectId.value)
  }

  // 应用过滤面板的过滤条件
  if (uiStore.hasActiveFilters) {
    tasks = filterEngine.applyFilter(tasks, uiStore.filter)
  }

  return filterEngine.applySort(tasks, sortOption.value)
})

const emptyTitle = computed(() => {
  if (uiStore.searchQuery) return '未找到匹配任务'
  const map: Record<string, string> = {
    today: '今天没有任务',
    upcoming: '近期没有任务',
    inbox: '收件箱为空',
    all: '暂无任务',
  }
  return map[currentView.value] || '暂无任务'
})

const emptyDescription = computed(() => {
  if (uiStore.searchQuery) return '试试其他关键词'
  return '输入任务标题，按 Enter 创建'
})

// 方法
function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
}

function toggleRightSidebar() {
  rightSidebarVisible.value = !rightSidebarVisible.value
}

function toggleTheme() {
  uiStore.toggleTheme()
}

function setView(view: ViewType) {
  uiStore.setView(view)
}

function selectProject(projectId: string) {
  projectStore.selectProject(projectId)
}

function openSettings() {
  showSettings.value = true
}

function handleFilterUpdate(filter: TaskFilter) {
  uiStore.setFilter(filter)
}

function handleFilterClear() {
  uiStore.clearFilters()
}

function handleSaveSmartList(_filter: TaskFilter) {
  showToast('智能列表功能即将推出', 'info')
}

function handleSortChange(payload: { sortBy: SortOption; direction: 'asc' | 'desc' }) {
  sortOption.value = payload.sortBy
  uiStore.setSortBy(payload.sortBy)
}

function getProjectCount(projectId: string): number {
  return taskStore.tasks.filter(t => t.projectId === projectId && !t.completed).length
}

async function handleCreateTask(title: string) {
  operationLoading.value = true
  try {
    await taskStore.createTask({
      title,
      projectId: currentProjectId.value || 'inbox',
    })
    showToast('任务已创建', 'success')
  } catch (err: any) {
    showErrorWithRetry(err.message || '创建任务失败，请重试', () => handleCreateTask(title))
  } finally {
    operationLoading.value = false
  }
}

async function handleToggleComplete(taskId: string) {
  try {
    const task = await taskStore.toggleTaskComplete(taskId)
    showToast(task.completed ? '任务已完成 ✓' : '任务已恢复', 'success')
  } catch (err: any) {
    showErrorWithRetry(err.message || '操作失败，请重试', () => handleToggleComplete(taskId))
  }
}

function handleEditTask(taskId: string) {
  const task = taskStore.getTaskById(taskId)
  if (task) {
    editingTask.value = task
    showTaskEditor.value = true
  }
}

function handleEditProject(projectId: string) {
  const project = projectStore.getProjectById(projectId)
  if (project) {
    editingProject.value = project
    showProjectEditor.value = true
  }
}

async function handleProjectEditorSave(data: Partial<Project>) {
  if (!editingProject.value) return
  operationLoading.value = true
  const projectId = editingProject.value.id
  try {
    await projectStore.updateProject(projectId, data)
    showProjectEditor.value = false
    editingProject.value = null
    showToast('项目已更新', 'success')
  } catch (err: any) {
    showErrorWithRetry(err.message || '更新项目失败，请重试', () => handleProjectEditorSave(data))
  } finally {
    operationLoading.value = false
  }
}

async function handleTaskEditorSubmit(data: CreateTaskDTO | Partial<Task>) {
  operationLoading.value = true
  try {
    if (editingTask.value) {
      await taskStore.updateTask(editingTask.value.id, data as Partial<Task>)
      showToast('任务已更新', 'success')
    } else {
      await taskStore.createTask(data as CreateTaskDTO)
      showToast('任务已创建', 'success')
    }
    editingTask.value = null
  } catch (err: any) {
    showErrorWithRetry(err.message || '操作失败，请重试', () => handleTaskEditorSubmit(data))
  } finally {
    operationLoading.value = false
  }
}

function handleDeleteProject(projectId: string) {
  const project = projectStore.getProjectById(projectId)
  if (!project) return
  const count = getProjectCount(projectId)
  deleteConfirmMessage.value = `确定删除项目「${project.name}」吗？其中 ${count} 个任务将移至收件箱。`
  pendingDeleteId.value = projectId
  pendingDeleteType.value = 'project'
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!pendingDeleteId.value) return
  operationLoading.value = true
  const deleteId = pendingDeleteId.value
  const deleteType = pendingDeleteType.value
  try {
    if (deleteType === 'project') {
      await projectStore.deleteProject(deleteId)
      await taskStore.refreshTasks()
      showToast('项目已删除', 'success')
    } else {
      await taskStore.deleteTask(deleteId, true)
      showToast('任务已删除', 'success')
    }
  } catch (err: any) {
    showErrorWithRetry(err.message || '删除失败，请重试', () => {
      pendingDeleteId.value = deleteId
      pendingDeleteType.value = deleteType
      confirmDelete()
    })
  } finally {
    operationLoading.value = false
  }
  showDeleteConfirm.value = false
  pendingDeleteId.value = null
}

function handleReorder(fromIndex: number, toIndex: number) {
  const tasks = [...displayTasks.value]
  const [moved] = tasks.splice(fromIndex, 1)
  tasks.splice(toIndex, 0, moved)
  tasks.forEach((t, i) => {
    taskStore.updateTask(t.id, { order: i })
  })
}

function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
  if (toastRef.value) {
    if (type === 'success') toastRef.value.success(message)
    else if (type === 'error') toastRef.value.error(message)
    else if (type === 'warning') toastRef.value.warning(message)
    else toastRef.value.info(message)
  }
}

/**
 * 显示带重试按钮的错误提示
 * 需求 17.2: 数据保存失败时显示错误提示并提供重试选项
 */
function showErrorWithRetry(message: string, retryFn: () => void) {
  if (toastRef.value) {
    toastRef.value.showToast(message, {
      type: 'error',
      duration: 0, // 带重试的错误不自动隐藏，需要用户手动关闭
      actionLabel: '重试',
      actionCallback: retryFn,
    })
  }
}

// 键盘快捷键
function handleKeydown(e: KeyboardEvent) {
  const isMeta = e.metaKey || e.ctrlKey
  if (isMeta && e.key === 'n') {
    e.preventDefault()
    taskInputRef.value?.focus()
  } else if (isMeta && e.key === 'd') {
    e.preventDefault()
    toggleTheme()
  } else if (isMeta && e.key === ',') {
    // Ctrl+, 打开设置
    e.preventDefault()
    showSettings.value = !showSettings.value
  } else if (e.key === 'Escape') {
    if (showSettings.value) showSettings.value = false
    else if (showProjectEditor.value) showProjectEditor.value = false
  }
}

/**
 * 跳转到主内容区域（无障碍辅助）
 */
function skipToContent() {
  const mainContent = document.getElementById('main-content')
  if (mainContent) {
    mainContent.focus()
    mainContent.scrollIntoView()
  }
}

// 响应式布局：检测窗口宽度
function handleResize() {
  if (window.innerWidth <= 768) {
    sidebarVisible.value = false
    rightSidebarVisible.value = false
  }
}

// 初始化
onMounted(async () => {
  // 注册全局错误通知回调，将错误通过 Toast 显示给用户
  registerErrorNotify((message: string, type: 'error' | 'warning' | 'info') => {
    showToast(message, type)
  })

  try {
    await Promise.all([
      taskStore.initialize(),
      projectStore.initialize(),
      settingsStore.initialize(),
    ])
    uiStore.initializeTheme()
    sortOption.value = settingsStore.settings.defaultSort
    uiStore.setView(settingsStore.settings.defaultView)
  } catch (err) {
    console.error('应用初始化失败:', err)
    // 需求 11.7: 数据加载失败时显示错误信息并提供重试选项
    showErrorWithRetry('应用初始化失败，部分功能可能不可用', async () => {
      appLoading.value = true
      try {
        await Promise.all([
          taskStore.initialize(),
          projectStore.initialize(),
          settingsStore.initialize(),
        ])
        uiStore.initializeTheme()
        sortOption.value = settingsStore.settings.defaultSort
        uiStore.setView(settingsStore.settings.defaultView)
        showToast('初始化成功', 'success')
      } catch (retryErr) {
        console.error('重试初始化失败:', retryErr)
        showErrorWithRetry('重试失败，请刷新页面', () => window.location.reload())
      } finally {
        appLoading.value = false
      }
    })
  } finally {
    appLoading.value = false
  }
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
  // 初始化时检测移动端
  handleResize()
})

// 清理
onUnmounted(() => {
  unregisterErrorNotify()
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})
</script>

<style>
/* CSS 变量已移至 src/styles/theme.css */

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* 跳转到主内容链接（无障碍） */
.skip-to-content {
  position: absolute;
  top: -100%;
  left: 16px;
  z-index: 9999;
  padding: 8px 16px;
  background: var(--primary-color, #3b82f6);
  color: #fff;
  border-radius: 0 0 6px 6px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: top 0.2s;
}
.skip-to-content:focus {
  top: 0;
  outline: 2px solid #fff;
  outline-offset: 2px;
}

/* 顶部栏 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 52px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
  gap: 12px;
}
.app-header-left, .app-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.app-header-center { flex: 1; display: flex; justify-content: center; max-width: 400px; margin: 0 auto; }
.app-title { font-size: 18px; font-weight: 600; white-space: nowrap; }
.sidebar-toggle, .header-btn {
  background: none; border: none; font-size: 18px; cursor: pointer;
  padding: 6px 8px; border-radius: 6px; color: var(--text-secondary);
  transition: background 0.15s;
}
.sidebar-toggle:hover, .header-btn:hover { background: var(--bg-tertiary); }

/* 主体 */
.app-body { display: flex; flex: 1; overflow: hidden; position: relative; }

/* 左侧边栏 */
.app-sidebar {
  width: 260px; flex-shrink: 0; background: var(--bg-secondary);
  border-right: 1px solid var(--border-color); overflow-y: auto;
  display: flex; flex-direction: column;
  transition: transform 0.2s ease;
}
.sidebar-section { padding: 8px 0; }
.sidebar-section-projects { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.nav-section-title {
  font-size: 12px; font-weight: 600; text-transform: uppercase;
  color: var(--text-tertiary); padding: 8px 16px 4px; letter-spacing: 0.5px;
}

/* 右侧边栏 */
.app-right-sidebar {
  width: 280px; flex-shrink: 0; background: var(--bg-secondary);
  border-left: 1px solid var(--border-color); overflow-y: auto;
  display: flex; flex-direction: column;
  transition: transform 0.2s ease;
}
.right-sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.right-sidebar-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.right-sidebar-close {
  background: none; border: none; cursor: pointer; color: var(--text-tertiary);
  font-size: 14px; padding: 4px 6px; border-radius: 4px;
  transition: background 0.15s;
}
.right-sidebar-close:hover { background: var(--bg-tertiary); }
.right-sidebar-content { flex: 1; overflow-y: auto; }
.right-sidebar-divider { height: 1px; background: var(--border-color); margin: 8px 16px; }
.trend-chart-wrapper { padding: 12px 16px; }

/* 主内容区 */
.app-main {
  flex: 1; display: flex; flex-direction: column; padding: 16px 20px;
  overflow: hidden; min-width: 0;
}
.main-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
}
.view-title { font-size: 20px; font-weight: 600; }
.main-toolbar { display: flex; align-items: center; gap: 6px; }
.toolbar-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 10px; border: 1px solid var(--border-color); border-radius: 6px;
  background: var(--bg-secondary); color: var(--text-secondary); font-size: 13px;
  cursor: pointer; transition: all 0.15s; position: relative;
}
.toolbar-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
.toolbar-btn-active { border-color: var(--primary-color); color: var(--primary-color); background: #eff6ff; }
.dark .toolbar-btn-active { background: #1e3a5f; }
.toolbar-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 16px; height: 16px; padding: 0 4px;
  background: var(--primary-color); color: #fff; border-radius: 8px;
  font-size: 10px; font-weight: 600;
}

/* 过滤和排序面板包装 */
.filter-panel-wrapper, .sort-panel-wrapper {
  background: var(--bg-secondary); border: 1px solid var(--border-color);
  border-radius: 8px; margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.task-list-container { flex: 1; overflow: hidden; margin-top: 8px; }

/* 底部统计栏 */
.stats-bar {
  display: flex; gap: 16px; padding: 10px 0; margin-top: 8px;
  border-top: 1px solid var(--border-color); font-size: 13px;
  color: var(--text-secondary); flex-shrink: 0;
}
.stat-overdue { color: var(--error-color); font-weight: 500; }

/* 加载状态 */
.app-loading {
  position: fixed; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; background: var(--bg-primary);
  z-index: 9999; gap: 12px;
}
.loading-spinner {
  width: 32px; height: 32px; border: 3px solid var(--border-color);
  border-top-color: var(--primary-color); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 操作加载指示器（顶部进度条） */
.operation-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9998;
  height: 3px;
  pointer-events: none;
}
.operation-loading-bar {
  height: 100%;
  background: var(--primary-color, #3b82f6);
  animation: operation-progress 1.5s ease-in-out infinite;
}
@keyframes operation-progress {
  0% { width: 0; margin-left: 0; }
  50% { width: 60%; margin-left: 20%; }
  100% { width: 0; margin-left: 100%; }
}

/* 遮罩层 */
.sidebar-overlay, .right-sidebar-overlay {
  display: none;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .app-header-center { max-width: 200px; }

  /* 左侧边栏：移动端覆盖层 */
  .app-sidebar {
    position: fixed; left: 0; top: 52px; bottom: 0; z-index: 200;
    width: 280px; transform: translateX(-100%);
    box-shadow: var(--shadow-md);
  }
  .app-sidebar-visible { transform: translateX(0); }
  .sidebar-overlay {
    display: block; position: fixed; inset: 0; top: 52px;
    background: rgba(0,0,0,0.3); z-index: 199;
  }

  /* 右侧边栏：移动端覆盖层 */
  .app-right-sidebar {
    position: fixed; right: 0; top: 52px; bottom: 0; z-index: 200;
    width: 300px; transform: translateX(100%);
    box-shadow: var(--shadow-md);
  }
  .app-right-sidebar-visible { transform: translateX(0); }
  .right-sidebar-overlay {
    display: block; position: fixed; inset: 0; top: 52px;
    background: rgba(0,0,0,0.3); z-index: 199;
  }

  .app-main { padding: 12px; }
  .app-title { font-size: 16px; }
}

/* 桌面端布局 */
@media (min-width: 769px) {
  .app-sidebar {
    transform: translateX(0);
  }
  .app-sidebar:not(.app-sidebar-visible) {
    width: 0; overflow: hidden; border: none; padding: 0;
  }
  .app-right-sidebar {
    transform: translateX(0);
  }
  .app-right-sidebar:not(.app-right-sidebar-visible) {
    width: 0; overflow: hidden; border: none; padding: 0;
  }
  .right-sidebar-close { display: none; }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .app-sidebar, .app-right-sidebar, .sidebar-toggle, .header-btn, .toolbar-btn {
    transition: none;
  }
}
</style>
