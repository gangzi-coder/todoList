/**
 * 任务状态管理 Store
 * 
 * 使用 Pinia 管理任务的全局状态
 * 
 * 验收标准：
 * - 需求 20.3: 使用 Pinia 管理全局状态
 * - 需求 20.4: 将业务逻辑与界面组件分离
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, CreateTaskDTO } from '@/types'
import { taskManager } from '@/services/TaskManager'
import { dataStore } from '@/services/DataStore'

/**
 * 防抖保存延迟（毫秒）
 * 需求 16.7: 对频繁的用户输入进行防抖处理
 * 需求 11.3: 在 500 毫秒内完成数据保存
 */
const SAVE_DEBOUNCE_MS = 500

export const useTaskStore = defineStore('task', () => {
  // ============================================================================
  // State
  // ============================================================================

  /** 任务列表 */
  const tasks = ref<Task[]>([])

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
   * 按 ID 获取任务
   */
  const getTaskById = computed(() => {
    return (id: string): Task | undefined => {
      return tasks.value.find(t => t.id === id)
    }
  })

  /**
   * 获取子任务列表
   */
  const getSubtasks = computed(() => {
    return (parentId: string): Task[] => {
      return tasks.value
        .filter(t => t.parentId === parentId)
        .sort((a, b) => a.order - b.order)
    }
  })

  /**
   * 获取顶层任务（没有父任务的任务）
   */
  const topLevelTasks = computed(() => {
    return tasks.value
      .filter(t => !t.parentId)
      .sort((a, b) => a.order - b.order)
  })

  /**
   * 统计数据
   */
  const stats = computed(() => {
    const total = tasks.value.length
    const completed = tasks.value.filter(t => t.completed).length
    const incomplete = total - completed
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 按优先级统计
    const byPriority = {
      high: tasks.value.filter(t => t.priority === 'high' && !t.completed).length,
      medium: tasks.value.filter(t => t.priority === 'medium' && !t.completed).length,
      low: tasks.value.filter(t => t.priority === 'low' && !t.completed).length,
      none: tasks.value.filter(t => t.priority === 'none' && !t.completed).length,
    }

    // 今天完成的任务数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const completedToday = tasks.value.filter(t => {
      if (!t.completedAt) return false
      const completedDate = new Date(t.completedAt)
      completedDate.setHours(0, 0, 0, 0)
      return completedDate.getTime() === today.getTime()
    }).length

    // 本周完成的任务数
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const completedThisWeek = tasks.value.filter(t => {
      if (!t.completedAt) return false
      return new Date(t.completedAt) >= weekStart
    }).length

    // 过期任务数
    const now = new Date()
    const overdue = tasks.value.filter(t => {
      if (t.completed || !t.dueDate) return false
      return new Date(t.dueDate) < now
    }).length

    return {
      total,
      completed,
      incomplete,
      completionRate,
      byPriority,
      completedToday,
      completedThisWeek,
      overdue,
    }
  })

  // ============================================================================
  // 防抖保存（500ms）
  // 需求 16.7: 对频繁操作进行防抖处理
  // 需求 16.8: 在后台异步执行数据保存，不阻塞 UI
  // ============================================================================

  let saveTimer: ReturnType<typeof setTimeout> | null = null

  /**
   * 防抖保存任务数据
   * 异步执行，不阻塞 UI
   */
  function debouncedSave(): void {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => {
      dataStore.saveTasks(tasks.value).catch((err) => {
        console.error('[TaskStore] 防抖保存失败:', err)
      })
      saveTimer = null
    }, SAVE_DEBOUNCE_MS)
  }

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 初始化任务 store
   * 从数据存储加载任务数据
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
      
      // 初始化任务管理器
      await taskManager.initialize()
      
      // 加载任务
      tasks.value = await taskManager.getAllTasks()
      
      initialized.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败'
      console.error('[TaskStore] Initialize failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建任务
   */
  async function createTask(taskDTO: CreateTaskDTO): Promise<Task> {
    loading.value = true
    error.value = null

    try {
      const task = await taskManager.createTask(taskDTO)
      tasks.value.push(task)
      debouncedSave()
      return task
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建任务失败'
      console.error('[TaskStore] Create task failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新任务
   */
  async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    loading.value = true
    error.value = null

    try {
      const updatedTask = await taskManager.updateTask(id, updates)
      
      // 更新本地状态
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
      debouncedSave()
      
      return updatedTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新任务失败'
      console.error('[TaskStore] Update task failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除任务
   */
  async function deleteTask(id: string, confirmed: boolean = false): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // 先收集要删除的所有 ID（主任务 + 所有子任务）
      const idsToDelete = new Set<string>([id])
      const collectChildren = (parentId: string) => {
        tasks.value.filter(t => t.parentId === parentId).forEach(child => {
          idsToDelete.add(child.id)
          collectChildren(child.id)
        })
      }
      collectChildren(id)

      await taskManager.deleteTask(id, confirmed)
      
      // 从本地状态中删除主任务及所有子任务
      tasks.value = tasks.value.filter(t => !idsToDelete.has(t.id))
      debouncedSave()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除任务失败'
      console.error('[TaskStore] Delete task failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换任务完成状态
   */
  async function toggleTaskComplete(id: string): Promise<Task> {
    loading.value = true
    error.value = null

    try {
      const updatedTask = await taskManager.toggleTaskComplete(id)
      
      // 更新本地状态
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }

      // 同步 TaskManager 中可能新增的重复任务到本地状态
      const allTasks = await taskManager.getAllTasks()
      const existingIds = new Set(tasks.value.map(t => t.id))
      for (const t of allTasks) {
        if (!existingIds.has(t.id)) {
          tasks.value.push(t)
        }
      }

      debouncedSave()
      
      return updatedTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : '切换任务状态失败'
      console.error('[TaskStore] Toggle task complete failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新任务列表
   * 从数据存储重新加载所有任务
   */
  async function refreshTasks(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      tasks.value = await taskManager.getAllTasks()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '刷新任务列表失败'
      console.error('[TaskStore] Refresh tasks failed:', err)
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
    tasks,
    loading,
    error,
    initialized,

    // Getters
    getTaskById,
    getSubtasks,
    topLevelTasks,
    stats,

    // Actions
    initialize,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    refreshTasks,
    clearError,
  }
})
