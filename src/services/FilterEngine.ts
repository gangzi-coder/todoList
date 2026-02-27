/**
 * 过滤引擎服务
 * 
 * 根据条件过滤和排序任务，提供预定义视图
 * 
 * 验收标准：
 * - 需求 8.1: 提供今天、即将到来、收件箱、所有任务视图
 * - 需求 8.2: "今天"视图显示截止日期为今天的所有未完成任务
 * - 需求 8.3: "即将到来"视图显示未来 7 天内截止的所有未完成任务
 * - 需求 8.4: "收件箱"视图显示默认项目中的所有任务
 * - 需求 8.5: 允许按优先级过滤任务
 * - 需求 8.6: 允许按标签过滤任务
 * - 需求 8.7: 允许按完成状态过滤任务
 * - 需求 8.8: 支持多条件组合过滤
 * - 需求 8.9: 支持按创建时间、截止日期、优先级、标题字母顺序排序
 */

import type { Task, TaskFilter, SortOption, ViewType, Priority } from '@/types'
import { isToday, isUpcoming, isInRange } from '@/utils/date'
import { DEFAULT_PROJECT_ID } from './ProjectManager'

/**
 * 过滤引擎接口
 */
export interface IFilterEngine {
  /** 应用过滤器 */
  applyFilter(tasks: Task[], filter: TaskFilter): Task[]
  
  /** 应用排序 */
  applySort(tasks: Task[], sortBy: SortOption): Task[]
  
  /** 获取预定义视图的任务 */
  getViewTasks(view: ViewType, tasks: Task[]): Task[]
}

/**
 * 优先级权重映射（用于排序）
 */
const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
}

/**
 * 过滤引擎实现
 */
export class FilterEngine implements IFilterEngine {
  /**
   * 应用过滤器
   * 
   * 验收标准：
   * - 需求 8.5: 允许按优先级过滤任务
   * - 需求 8.6: 允许按标签过滤任务
   * - 需求 8.7: 允许按完成状态过滤任务
   * - 需求 8.8: 支持多条件组合过滤
   * 
   * @param tasks 任务列表
   * @param filter 过滤条件
   * @returns 过滤后的任务列表
   */
  applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
    let filtered = [...tasks]

    // 按项目过滤
    if (filter.projectId !== undefined) {
      filtered = filtered.filter(task => task.projectId === filter.projectId)
    }

    // 按标签过滤（任务必须包含所有指定的标签）
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(task => {
        return filter.tags!.every(tag => task.tags.includes(tag))
      })
    }

    // 按优先级过滤
    if (filter.priority && filter.priority.length > 0) {
      filtered = filtered.filter(task => filter.priority!.includes(task.priority))
    }

    // 按完成状态过滤
    if (filter.completed !== undefined) {
      filtered = filtered.filter(task => task.completed === filter.completed)
    }

    // 按截止日期范围过滤
    if (filter.dueDateRange) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) {
          return false
        }
        return isInRange(
          task.dueDate,
          filter.dueDateRange!.start,
          filter.dueDateRange!.end
        )
      })
    }

    return filtered
  }

  /**
   * 应用排序
   * 
   * 验收标准：
   * - 需求 8.9: 支持按创建时间、截止日期、优先级、标题字母顺序排序
   * 
   * @param tasks 任务列表
   * @param sortBy 排序选项
   * @returns 排序后的任务列表
   */
  applySort(tasks: Task[], sortBy: SortOption): Task[] {
    const sorted = [...tasks]

    switch (sortBy) {
      case 'createdAt':
        // 按创建时间排序（最新的在前）
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        break

      case 'dueDate':
        // 按截止日期排序（最早的在前，没有截止日期的在最后）
        sorted.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate.getTime() - b.dueDate.getTime()
        })
        break

      case 'priority':
        // 按优先级排序（高优先级在前）
        sorted.sort((a, b) => {
          const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
          if (weightDiff !== 0) return weightDiff
          // 优先级相同时，按创建时间排序
          return b.createdAt.getTime() - a.createdAt.getTime()
        })
        break

      case 'title':
        // 按标题字母顺序排序
        sorted.sort((a, b) => {
          return a.title.localeCompare(b.title, 'zh-CN')
        })
        break

      default:
        // 默认按创建时间排序
        sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    }

    return sorted
  }

  /**
   * 获取预定义视图的任务
   * 
   * 验收标准：
   * - 需求 8.1: 提供今天、即将到来、收件箱、所有任务视图
   * - 需求 8.2: "今天"视图显示截止日期为今天的所有未完成任务
   * - 需求 8.3: "即将到来"视图显示未来 7 天内截止的所有未完成任务
   * - 需求 8.4: "收件箱"视图显示默认项目中的所有任务
   * 
   * @param view 视图类型
   * @param tasks 任务列表
   * @returns 视图对应的任务列表
   */
  getViewTasks(view: ViewType, tasks: Task[]): Task[] {
    switch (view) {
      case 'today':
        // 今天视图：截止日期为今天的所有未完成任务
        return tasks.filter(task => {
          if (task.completed) return false
          if (!task.dueDate) return false
          return isToday(task.dueDate)
        })

      case 'upcoming':
        // 即将到来视图：未来 7 天内截止的所有未完成任务
        return tasks.filter(task => {
          if (task.completed) return false
          if (!task.dueDate) return false
          return isUpcoming(task.dueDate)
        })

      case 'inbox':
        // 收件箱视图：默认项目中的所有任务
        return tasks.filter(task => task.projectId === DEFAULT_PROJECT_ID)

      case 'all':
        // 所有任务视图：返回所有任务
        return [...tasks]

      default:
        return [...tasks]
    }
  }
}

/**
 * 创建并导出单例实例
 */
export const filterEngine = new FilterEngine()
