/**
 * useProjects Composable
 * 
 * 封装 projectStore 的常用操作，提供响应式的项目管理功能
 * 
 * 验收标准：
 * - 需求 20.1: 使用 Vue 3 Composition API 构建
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectStore } from '@/stores/projectStore'
import type { Project, CreateProjectDTO } from '@/types'

/**
 * 项目管理 Composable
 * 
 * 提供项目的 CRUD 操作和响应式状态
 */
export function useProjects() {
  const projectStore = useProjectStore()

  // 使用 storeToRefs 保持响应性
  const { 
    projects, 
    currentProjectId, 
    loading, 
    error, 
    initialized 
  } = storeToRefs(projectStore)

  // Getters
  const defaultProject = computed(() => projectStore.defaultProject)
  const currentProject = computed(() => projectStore.currentProject)
  const customProjects = computed(() => projectStore.customProjects)

  /**
   * 获取项目
   */
  const getProject = (id: string): Project | undefined => {
    return projectStore.getProjectById(id)
  }

  /**
   * 创建项目
   */
  const createProject = async (projectDTO: CreateProjectDTO): Promise<Project> => {
    return await projectStore.createProject(projectDTO)
  }

  /**
   * 更新项目
   */
  const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
    return await projectStore.updateProject(id, updates)
  }

  /**
   * 删除项目
   */
  const deleteProject = async (id: string): Promise<void> => {
    return await projectStore.deleteProject(id)
  }

  /**
   * 获取项目的任务数量
   */
  const getProjectTaskCount = async (id: string): Promise<number> => {
    return await projectStore.getProjectTaskCount(id)
  }

  /**
   * 移动任务到项目
   */
  const moveTaskToProject = async (taskId: string, projectId: string): Promise<void> => {
    return await projectStore.moveTaskToProject(taskId, projectId)
  }

  /**
   * 选择项目
   */
  const selectProject = (id: string): void => {
    projectStore.selectProject(id)
  }

  /**
   * 刷新项目列表
   */
  const refreshProjects = async (): Promise<void> => {
    return await projectStore.refreshProjects()
  }

  /**
   * 初始化项目 store
   */
  const initialize = async (): Promise<void> => {
    return await projectStore.initialize()
  }

  /**
   * 清除错误
   */
  const clearError = (): void => {
    projectStore.clearError()
  }

  return {
    // State
    projects,
    currentProjectId,
    loading,
    error,
    initialized,
    defaultProject,
    currentProject,
    customProjects,

    // Methods
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectTaskCount,
    moveTaskToProject,
    selectProject,
    refreshProjects,
    initialize,
    clearError,
  }
}
