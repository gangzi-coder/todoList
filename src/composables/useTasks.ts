/**
 * useTasks Composable
 * 
 * 封装 taskStore 的常用操作，提供响应式的任务管理功能
 * 
 * 验收标准：
 * - 需求 20.1: 使用 Vue 3 Composition API 构建
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskStore } from '@/stores/taskStore'
import type { Task, CreateTaskDTO } from '@/types'

/**
 * 任务管理 Composable
 * 
 * 提供任务的 CRUD 操作和响应式状态
 */
export function useTasks() {
  const taskStore = useTaskStore()

  // 使用 storeToRefs 保持响应性
  const { tasks, loading, error, initialized, stats } = storeToRefs(taskStore)

  // Getters
  const topLevelTasks = computed(() => taskStore.topLevelTasks)

  /**
   * 获取任务
   */
  const getTask = (id: string): Task | undefined => {
    return taskStore.getTaskById(id)
  }

  /**
   * 获取子任务
   */
  const getSubtasks = (parentId: string): Task[] => {
    return taskStore.getSubtasks(parentId)
  }

  /**
   * 创建任务
   */
  const createTask = async (taskDTO: CreateTaskDTO): Promise<Task> => {
    return await taskStore.createTask(taskDTO)
  }

  /**
   * 更新任务
   */
  const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
    return await taskStore.updateTask(id, updates)
  }

  /**
   * 删除任务
   */
  const deleteTask = async (id: string, confirmed: boolean = false): Promise<void> => {
    return await taskStore.deleteTask(id, confirmed)
  }

  /**
   * 切换任务完成状态
   */
  const toggleComplete = async (id: string): Promise<Task> => {
    return await taskStore.toggleTaskComplete(id)
  }

  /**
   * 刷新任务列表
   */
  const refreshTasks = async (): Promise<void> => {
    return await taskStore.refreshTasks()
  }

  /**
   * 初始化任务 store
   */
  const initialize = async (): Promise<void> => {
    return await taskStore.initialize()
  }

  /**
   * 清除错误
   */
  const clearError = (): void => {
    taskStore.clearError()
  }

  return {
    // State
    tasks,
    loading,
    error,
    initialized,
    stats,
    topLevelTasks,

    // Methods
    getTask,
    getSubtasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    refreshTasks,
    initialize,
    clearError,
  }
}
