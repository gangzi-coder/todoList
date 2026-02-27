/**
 * 项目状态管理 Store
 * 
 * 使用 Pinia 管理项目的全局状态
 * 
 * 验收标准：
 * - 需求 20.3: 使用 Pinia 管理全局状态
 * - 需求 20.4: 将业务逻辑与界面组件分离
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Project, CreateProjectDTO } from '@/types'
import { projectManager, DEFAULT_PROJECT_ID } from '@/services/ProjectManager'
import { dataStore } from '@/services/DataStore'

/**
 * 防抖保存延迟（毫秒）
 * 需求 16.7: 对频繁的用户输入进行防抖处理
 * 需求 11.3: 在 500 毫秒内完成数据保存
 */
const SAVE_DEBOUNCE_MS = 500

export const useProjectStore = defineStore('project', () => {
  // ============================================================================
  // State
  // ============================================================================

  /** 项目列表 */
  const projects = ref<Project[]>([])

  /** 当前选中的项目 ID */
  const currentProjectId = ref<string | null>(null)

  /** 加载状态 */
  const loading = ref(false)

  /** 错误信息 */
  const error = ref<string | null>(null)

  /** 是否已初始化 */
  const initialized = ref(false)

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * 按 ID 获取项目
   */
  const getProjectById = computed(() => {
    return (id: string): Project | undefined => {
      return projects.value.find(p => p.id === id)
    }
  })

  /**
   * 获取默认项目（收件箱）
   */
  const defaultProject = computed(() => {
    return projects.value.find(p => p.id === DEFAULT_PROJECT_ID)
  })

  /**
   * 获取当前选中的项目
   */
  const currentProject = computed(() => {
    if (!currentProjectId.value) {
      return defaultProject.value
    }
    return getProjectById.value(currentProjectId.value)
  })

  /**
   * 获取所有非默认项目
   */
  const customProjects = computed(() => {
    return projects.value.filter(p => !p.isDefault)
  })

  // ============================================================================
  // 防抖保存（500ms）
  // 需求 16.7: 对频繁操作进行防抖处理
  // 需求 16.8: 在后台异步执行数据保存，不阻塞 UI
  // ============================================================================

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 防抖保存项目数据
   * 异步执行，不阻塞 UI
   */
  function debouncedSave(): void {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => {
      dataStore.saveProjects(projects.value).catch((err) => {
        console.error('[ProjectStore] 防抖保存失败:', err)
      })
      saveTimer = null
    }, SAVE_DEBOUNCE_MS)
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 初始化项目 store
   * 从数据存储加载项目数据
   */
  async function initialize(): Promise<void> {
    if (initialized.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      // 初始化数据存储
      await dataStore.initialize()
      
      // 初始化默认项目
      await projectManager.initializeDefaultProject()
      
      // 加载项目
      projects.value = await projectManager.getAllProjects()
      
      // 设置默认选中项目为收件箱
      if (!currentProjectId.value) {
        currentProjectId.value = DEFAULT_PROJECT_ID
      }
      
      initialized.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败'
      console.error('[ProjectStore] Initialize failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建项目
   */
  async function createProject(projectDTO: CreateProjectDTO): Promise<Project> {
    loading.value = true
    error.value = null

    try {
      const project = await projectManager.createProject(projectDTO)
      projects.value.push(project)
      debouncedSave()
      return project
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建项目失败'
      console.error('[ProjectStore] Create project failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新项目
   */
  async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    loading.value = true
    error.value = null

    try {
      const updatedProject = await projectManager.updateProject(id, updates)
      
      // 更新本地状态
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
      debouncedSave()
      
      return updatedProject
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新项目失败'
      console.error('[ProjectStore] Update project failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除项目
   */
  async function deleteProject(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await projectManager.deleteProject(id)
      
      // 从本地状态中删除
      projects.value = projects.value.filter(p => p.id !== id)
      debouncedSave()
      
      // 如果删除的是当前选中的项目，切换到默认项目
      if (currentProjectId.value === id) {
        currentProjectId.value = DEFAULT_PROJECT_ID
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除项目失败'
      console.error('[ProjectStore] Delete project failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取项目的任务数量
   */
  async function getProjectTaskCount(id: string): Promise<number> {
    try {
      return await projectManager.getProjectTaskCount(id)
    } catch (err) {
      console.error('[ProjectStore] Get project task count failed:', err)
      return 0
    }
  }

  /**
   * 移动任务到项目
   */
  async function moveTaskToProject(taskId: string, projectId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      await projectManager.moveTaskToProject(taskId, projectId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '移动任务失败'
      console.error('[ProjectStore] Move task to project failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 选择项目
   */
  function selectProject(id: string): void {
    currentProjectId.value = id
  }

  /**
   * 刷新项目列表
   * 从数据存储重新加载所有项目
   */
  async function refreshProjects(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      projects.value = await projectManager.getAllProjects()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新项目列表失败'
      console.error('[ProjectStore] Refresh projects failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  function clearError(): void {
    error.value = null
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    projects,
    currentProjectId,
    loading,
    error,
    initialized,

    // Getters
    getProjectById,
    defaultProject,
    currentProject,
    customProjects,

    // Actions
    initialize,
    createProject,
    updateProject,
    deleteProject,
    getProjectTaskCount,
    moveTaskToProject,
    selectProject,
    refreshProjects,
    clearError,
  }
})
