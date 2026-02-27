/**
 * FilterEngine 单元测试
 * 
 * 测试过滤引擎的各种过滤、排序和视图功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FilterEngine } from '../FilterEngine'
import type { Task, TaskFilter, Priority } from '@/types'
import { DEFAULT_PROJECT_ID } from '../ProjectManager'

describe('FilterEngine', () => {
  let filterEngine: FilterEngine
  let mockTasks: Task[]

  beforeEach(() => {
    filterEngine = new FilterEngine()

    // 创建测试任务数据
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    mockTasks = [
      {
        id: '1',
        title: 'Task 1 - Today High Priority',
        projectId: DEFAULT_PROJECT_ID,
        priority: 'high',
        tags: ['work', 'urgent'],
        dueDate: today,
        completed: false,
        createdAt: lastWeek,
        updatedAt: lastWeek,
        reminders: [],
        order: 0,
      },
      {
        id: '2',
        title: 'Task 2 - Tomorrow Medium Priority',
        projectId: 'project1',
        priority: 'medium',
        tags: ['personal'],
        dueDate: tomorrow,
        completed: false,
        createdAt: now,
        updatedAt: now,
        reminders: [],
        order: 1,
      },
      {
        id: '3',
        title: 'Task 3 - Completed',
        projectId: DEFAULT_PROJECT_ID,
        priority: 'low',
        tags: ['work'],
        dueDate: today,
        completed: true,
        completedAt: now,
        createdAt: lastWeek,
        updatedAt: now,
        reminders: [],
        order: 2,
      },
      {
        id: '4',
        title: 'Task 4 - Next Week',
        projectId: 'project1',
        priority: 'none',
        tags: ['personal', 'hobby'],
        dueDate: nextWeek,
        completed: false,
        createdAt: now,
        updatedAt: now,
        reminders: [],
        order: 3,
      },
      {
        id: '5',
        title: 'Task 5 - No Due Date',
        projectId: DEFAULT_PROJECT_ID,
        priority: 'high',
        tags: [],
        completed: false,
        createdAt: now,
        updatedAt: now,
        reminders: [],
        order: 4,
      },
    ] as Task[]
  })

  describe('applyFilter', () => {
    it('应该按项目 ID 过滤任务', () => {
      const filter: TaskFilter = { projectId: DEFAULT_PROJECT_ID }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      expect(result).toHaveLength(3)
      expect(result.every(task => task.projectId === DEFAULT_PROJECT_ID)).toBe(true)
    })

    it('应该按标签过滤任务', () => {
      const filter: TaskFilter = { tags: ['work'] }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      expect(result).toHaveLength(2)
      expect(result.every(task => task.tags.includes('work'))).toBe(true)
    })

    it('应该按多个标签过滤任务（必须包含所有标签）', () => {
      const filter: TaskFilter = { tags: ['personal', 'hobby'] }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('4')
    })

    it('应该按优先级过滤任务', () => {
      const filter: TaskFilter = { priority: ['high', 'medium'] }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      expect(result).toHaveLength(3)
      expect(result.every(task => ['high', 'medium'].includes(task.priority))).toBe(true)
    })

    it('应该按完成状态过滤任务', () => {
      const filter: TaskFilter = { completed: false }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      expect(result).toHaveLength(4)
      expect(result.every(task => !task.completed)).toBe(true)
    })

    it('应该按完成状态过滤已完成任务', () => {
      const filter: TaskFilter = { completed: true }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('3')
    })

    it('应该支持多条件组合过滤', () => {
      const filter: TaskFilter = {
        projectId: DEFAULT_PROJECT_ID,
        completed: false,
        priority: ['high'],
      }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      expect(result).toHaveLength(2)
      expect(result.every(task => 
        task.projectId === DEFAULT_PROJECT_ID &&
        !task.completed &&
        task.priority === 'high'
      )).toBe(true)
    })

    it('应该按截止日期范围过滤任务', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const filter: TaskFilter = {
        dueDateRange: {
          start: today,
          end: tomorrow,
        },
      }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      // 应该包含今天和明天的任务
      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(result.every(task => task.dueDate !== undefined)).toBe(true)
    })

    it('应该过滤掉没有截止日期的任务（当使用日期范围过滤时）', () => {
      const today = new Date()
      const nextMonth = new Date(today)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      const filter: TaskFilter = {
        dueDateRange: {
          start: today,
          end: nextMonth,
        },
      }
      const result = filterEngine.applyFilter(mockTasks, filter)
      
      expect(result.every(task => task.dueDate !== undefined)).toBe(true)
      expect(result.find(task => task.id === '5')).toBeUndefined()
    })
  })

  describe('applySort', () => {
    it('应该按创建时间排序（最新的在前）', () => {
      const result = filterEngine.applySort(mockTasks, 'createdAt')
      
      // 验证排序顺序
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          result[i + 1].createdAt.getTime()
        )
      }
    })

    it('应该按截止日期排序（最早的在前）', () => {
      const result = filterEngine.applySort(mockTasks, 'dueDate')
      
      // 有截止日期的任务应该在前面
      const withDueDate = result.filter(task => task.dueDate)
      const withoutDueDate = result.filter(task => !task.dueDate)
      
      expect(result.length).toBe(withDueDate.length + withoutDueDate.length)
      
      // 验证有截止日期的任务按日期排序
      for (let i = 0; i < withDueDate.length - 1; i++) {
        expect(withDueDate[i].dueDate!.getTime()).toBeLessThanOrEqual(
          withDueDate[i + 1].dueDate!.getTime()
        )
      }
    })

    it('应该按优先级排序（高优先级在前）', () => {
      const result = filterEngine.applySort(mockTasks, 'priority')
      
      const priorityOrder: Priority[] = ['high', 'medium', 'low', 'none']
      
      // 验证优先级顺序
      for (let i = 0; i < result.length - 1; i++) {
        const currentIndex = priorityOrder.indexOf(result[i].priority)
        const nextIndex = priorityOrder.indexOf(result[i + 1].priority)
        expect(currentIndex).toBeLessThanOrEqual(nextIndex)
      }
    })

    it('应该按标题字母顺序排序', () => {
      const result = filterEngine.applySort(mockTasks, 'title')
      
      // 验证标题排序
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].title.localeCompare(result[i + 1].title, 'zh-CN')).toBeLessThanOrEqual(0)
      }
    })
  })

  describe('getViewTasks', () => {
    it('应该返回今天视图的任务（今天截止且未完成）', () => {
      const result = filterEngine.getViewTasks('today', mockTasks)
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
      expect(result[0].completed).toBe(false)
    })

    it('应该返回即将到来视图的任务（未来 7 天内截止且未完成）', () => {
      const result = filterEngine.getViewTasks('upcoming', mockTasks)
      
      // 应该包含今天和明天的任务，但不包含已完成的
      expect(result.length).toBeGreaterThanOrEqual(2)
      expect(result.every(task => !task.completed)).toBe(true)
      expect(result.every(task => task.dueDate !== undefined)).toBe(true)
    })

    it('应该返回收件箱视图的任务（默认项目中的所有任务）', () => {
      const result = filterEngine.getViewTasks('inbox', mockTasks)
      
      expect(result).toHaveLength(3)
      expect(result.every(task => task.projectId === DEFAULT_PROJECT_ID)).toBe(true)
    })

    it('应该返回所有任务视图', () => {
      const result = filterEngine.getViewTasks('all', mockTasks)
      
      expect(result).toHaveLength(mockTasks.length)
    })

    it('今天视图不应该包含已完成的任务', () => {
      const result = filterEngine.getViewTasks('today', mockTasks)
      
      expect(result.every(task => !task.completed)).toBe(true)
    })

    it('即将到来视图不应该包含已完成的任务', () => {
      const result = filterEngine.getViewTasks('upcoming', mockTasks)
      
      expect(result.every(task => !task.completed)).toBe(true)
    })

    it('收件箱视图应该包含已完成和未完成的任务', () => {
      const result = filterEngine.getViewTasks('inbox', mockTasks)
      
      const hasCompleted = result.some(task => task.completed)
      const hasIncomplete = result.some(task => !task.completed)
      
      expect(hasCompleted).toBe(true)
      expect(hasIncomplete).toBe(true)
    })
  })

  describe('组合使用过滤和排序', () => {
    it('应该能够先过滤再排序', () => {
      // 先过滤未完成的任务
      const filtered = filterEngine.applyFilter(mockTasks, { completed: false })
      
      // 再按优先级排序
      const sorted = filterEngine.applySort(filtered, 'priority')
      
      expect(sorted.every(task => !task.completed)).toBe(true)
      expect(sorted[0].priority).toBe('high')
    })

    it('应该能够使用视图后再排序', () => {
      // 获取收件箱视图
      const viewTasks = filterEngine.getViewTasks('inbox', mockTasks)
      
      // 按截止日期排序
      const sorted = filterEngine.applySort(viewTasks, 'dueDate')
      
      expect(sorted.every(task => task.projectId === DEFAULT_PROJECT_ID)).toBe(true)
    })
  })
})
