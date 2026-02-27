/**
 * useFilters Composable
 * 
 * 封装 FilterEngine 和 uiStore，提供过滤和排序功能
 * 
 * 验收标准：
 * - 需求 8.1: 提供内置视图（今天、即将到来、收件箱、所有任务）
 * - 需求 8.9: 支持按创建时间、截止日期、优先级、标题字母顺序排序
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import { filterEngine } from '@/services/FilterEngine'
import type { ViewType, SortOption, TaskFilter, Priority, Task } from '@/types'

/**
 * 过滤和排序 Composable
 * 
 * 提供任务的过滤、排序和视图切换功能
 */
export function useFilters() {
  const uiStore = useUIStore()
  const taskStore = useTaskStore()

  // 使用 storeToRefs 保持响应性
  const { 
    currentView, 
    filter, 
    sortBy, 
    sortAscending,
    hasActiveFilters 
  } = storeToRefs(uiStore)

  const { tasks } = storeToRefs(taskStore)

  /**
   * 获取过滤后的任务列表
   */
  const filteredTasks = computed((): Task[] => {
    let result = [...tasks.value]

    // 1. 应用视图过滤
    if (currentView.value !== 'all') {
      result = filterEngine.getViewTasks(currentView.value, result)
    }

    // 2. 应用自定义过滤条件
    if (hasActiveFilters.value) {
      result = filterEngine.applyFilter(result, filter.value)
    }

    // 3. 应用排序
    result = filterEngine.applySort(result, sortBy.value)

    // 4. 如果是降序，反转结果
    if (!sortAscending.value) {
      result.reverse()
    }

    return result
  })

  /**
   * 获取过滤后的任务数量
   */
  const filteredTaskCount = computed(() => filteredTasks.value.length)

  /**
   * 切换视图
   */
  const setView = (view: ViewType): void => {
    uiStore.setView(view)
  }

  /**
   * 设置过滤条件
   */
  const setFilter = (newFilter: Partial<TaskFilter>): void => {
    uiStore.setFilter(newFilter)
  }

  /**
   * 清除过滤条件
   */
  const clearFilters = (): void => {
    uiStore.clearFilters()
  }

  /**
   * 设置排序方式
   */
  const setSortBy = (sort: SortOption): void => {
    uiStore.setSortBy(sort)
  }

  /**
   * 按项目过滤
   */
  const filterByProject = (projectId: string): void => {
    uiStore.filterByProject(projectId)
  }

  /**
   * 按标签过滤
   */
  const filterByTag = (tag: string): void => {
    uiStore.filterByTag(tag)
  }

  /**
   * 按优先级过滤
   */
  const filterByPriority = (priority: Priority): void => {
    uiStore.filterByPriority(priority)
  }

  /**
   * 按完成状态过滤
   */
  const filterByCompleted = (completed: boolean): void => {
    uiStore.filterByCompleted(completed)
  }

  /**
   * 获取指定视图的任务
   */
  const getViewTasks = (view: ViewType): Task[] => {
    return filterEngine.getViewTasks(view, tasks.value)
  }

  /**
   * 获取各视图的任务数量
   */
  const viewCounts = computed(() => {
    return {
      today: filterEngine.getViewTasks('today', tasks.value).length,
      upcoming: filterEngine.getViewTasks('upcoming', tasks.value).length,
      inbox: filterEngine.getViewTasks('inbox', tasks.value).length,
      all: tasks.value.length,
    }
  })

  return {
    // State
    currentView,
    filter,
    sortBy,
    sortAscending,
    hasActiveFilters,
    filteredTasks,
    filteredTaskCount,
    viewCounts,

    // Methods
    setView,
    setFilter,
    clearFilters,
    setSortBy,
    filterByProject,
    filterByTag,
    filterByPriority,
    filterByCompleted,
    getViewTasks,
  }
}
