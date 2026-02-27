/**
 * TaskManager 单元测试
 * 
 * 测试任务管理器的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskManager } from '../TaskManager'
import type { CreateTaskDTO, Task } from '@/types'
import { dataStore } from '../DataStore'

// Mock DataStore
vi.mock('../DataStore', () => ({
  dataStore: {
    loadTasks: vi.fn().mockResolvedValue([]),
    saveTasks: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('TaskManager', () => {
  let taskManager: TaskManager

  beforeEach(async () => {
    // 重置 mock
    vi.clearAllMocks()
    
    // 重置 loadTasks 返回空数组
    vi.mocked(dataStore.loadTasks).mockResolvedValue([])
    
    // 创建新的 TaskManager 实例
    taskManager = new TaskManager()
    await taskManager.initialize()
  })

  describe('createTask', () => {
    it('应该创建一个新任务', async () => {
      const taskDTO: CreateTaskDTO = {
        title: '测试任务',
        notes: '这是一个测试任务',
        priority: 'high',
        tags: ['测试'],
      }

      const task = await taskManager.createTask(taskDTO)

      expect(task).toBeDefined()
      expect(task.id).toBeDefined()
      expect(task.title).toBe('测试任务')
      expect(task.notes).toBe('这是一个测试任务')
      expect(task.priority).toBe('high')
      expect(task.tags).toEqual(['测试'])
      expect(task.completed).toBe(false)
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.updatedAt).toBeInstanceOf(Date)
      expect(dataStore.saveTasks).toHaveBeenCalled()
    })

    it('应该为任务分配唯一 ID', async () => {
      const task1 = await taskManager.createTask({ title: '任务1' })
      const task2 = await taskManager.createTask({ title: '任务2' })

      expect(task1.id).not.toBe(task2.id)
    })

    it('应该使用默认值创建任务', async () => {
      const task = await taskManager.createTask({ title: '简单任务' })

      expect(task.projectId).toBe('inbox')
      expect(task.priority).toBe('none')
      expect(task.tags).toEqual([])
      expect(task.reminders).toEqual([])
      expect(task.completed).toBe(false)
    })

    it('应该拒绝空标题', async () => {
      await expect(
        taskManager.createTask({ title: '' })
      ).rejects.toThrow('任务标题不能为空')
    })

    it('应该拒绝只包含空白字符的标题', async () => {
      await expect(
        taskManager.createTask({ title: '   ' })
      ).rejects.toThrow('任务标题不能为空')
    })

    it('应该拒绝超长标题', async () => {
      const longTitle = 'a'.repeat(201)
      await expect(
        taskManager.createTask({ title: longTitle })
      ).rejects.toThrow('任务标题不能超过 200 个字符')
    })

    it('应该拒绝超长备注', async () => {
      const longNotes = 'a'.repeat(501)
      await expect(
        taskManager.createTask({ title: '任务', notes: longNotes })
      ).rejects.toThrow('任务备注不能超过 500 个字符')
    })

    it('应该修剪标题和备注的空白字符', async () => {
      const task = await taskManager.createTask({
        title: '  任务标题  ',
        notes: '  任务备注  ',
      })

      expect(task.title).toBe('任务标题')
      expect(task.notes).toBe('任务备注')
    })
  })

  describe('updateTask', () => {
    it('应该更新任务', async () => {
      const task = await taskManager.createTask({ title: '原始任务' })
      
      // 等待一小段时间确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const updatedTask = await taskManager.updateTask(task.id, {
        title: '更新后的任务',
        priority: 'high',
      })

      expect(updatedTask.title).toBe('更新后的任务')
      expect(updatedTask.priority).toBe('high')
      expect(updatedTask.updatedAt.getTime()).toBeGreaterThanOrEqual(task.updatedAt.getTime())
      expect(dataStore.saveTasks).toHaveBeenCalledTimes(2) // create + update
    })

    it('应该拒绝更新不存在的任务', async () => {
      await expect(
        taskManager.updateTask('non-existent-id', { title: '更新' })
      ).rejects.toThrow('任务不存在')
    })

    it('应该验证更新的标题', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      
      await expect(
        taskManager.updateTask(task.id, { title: '' })
      ).rejects.toThrow('任务标题不能为空')
    })

    it('应该验证更新的备注', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      const longNotes = 'a'.repeat(501)
      
      await expect(
        taskManager.updateTask(task.id, { notes: longNotes })
      ).rejects.toThrow('任务备注不能超过 500 个字符')
    })
  })

  describe('deleteTask', () => {
    it('应该立即删除已完成的任务', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      await taskManager.toggleTaskComplete(task.id)
      
      await taskManager.deleteTask(task.id)
      
      const deletedTask = await taskManager.getTask(task.id)
      expect(deletedTask).toBeNull()
      expect(dataStore.saveTasks).toHaveBeenCalledTimes(3) // create + toggle + delete
    })

    it('应该要求确认删除未完成的任务', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      
      await expect(
        taskManager.deleteTask(task.id)
      ).rejects.toThrow('CONFIRMATION_REQUIRED')
      
      // 任务应该仍然存在
      const existingTask = await taskManager.getTask(task.id)
      expect(existingTask).not.toBeNull()
    })

    it('应该在确认后删除未完成的任务', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      
      await taskManager.deleteTask(task.id, true)
      
      const deletedTask = await taskManager.getTask(task.id)
      expect(deletedTask).toBeNull()
    })

    it('应该拒绝删除不存在的任务', async () => {
      await expect(
        taskManager.deleteTask('non-existent-id')
      ).rejects.toThrow('任务不存在')
    })
  })

  describe('toggleTaskComplete', () => {
    it('应该切换任务完成状态', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      expect(task.completed).toBe(false)
      
      const completedTask = await taskManager.toggleTaskComplete(task.id)
      expect(completedTask.completed).toBe(true)
      expect(completedTask.completedAt).toBeInstanceOf(Date)
      
      const uncompletedTask = await taskManager.toggleTaskComplete(task.id)
      expect(uncompletedTask.completed).toBe(false)
      expect(uncompletedTask.completedAt).toBeUndefined()
    })

    it('应该记录完成时间', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      
      const completedTask = await taskManager.toggleTaskComplete(task.id)
      
      expect(completedTask.completedAt).toBeInstanceOf(Date)
      expect(completedTask.completedAt!.getTime()).toBeGreaterThanOrEqual(task.createdAt.getTime())
    })

    it('应该清除完成时间当取消完成时', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      await taskManager.toggleTaskComplete(task.id) // 完成
      
      const uncompletedTask = await taskManager.toggleTaskComplete(task.id) // 取消完成
      
      expect(uncompletedTask.completedAt).toBeUndefined()
    })

    it('应该拒绝切换不存在的任务', async () => {
      await expect(
        taskManager.toggleTaskComplete('non-existent-id')
      ).rejects.toThrow('任务不存在')
    })
  })

  describe('getTask', () => {
    it('应该获取任务', async () => {
      const task = await taskManager.createTask({ title: '任务' })
      
      const retrievedTask = await taskManager.getTask(task.id)
      
      expect(retrievedTask).not.toBeNull()
      expect(retrievedTask!.id).toBe(task.id)
      expect(retrievedTask!.title).toBe('任务')
    })

    it('应该返回 null 如果任务不存在', async () => {
      const task = await taskManager.getTask('non-existent-id')
      
      expect(task).toBeNull()
    })
  })

  describe('getAllTasks', () => {
    it('应该获取所有任务', async () => {
      await taskManager.createTask({ title: '任务1' })
      await taskManager.createTask({ title: '任务2' })
      await taskManager.createTask({ title: '任务3' })
      
      const tasks = await taskManager.getAllTasks()
      
      expect(tasks).toHaveLength(3)
      expect(tasks[0].title).toBe('任务1')
      expect(tasks[1].title).toBe('任务2')
      expect(tasks[2].title).toBe('任务3')
    })

    it('应该返回空数组如果没有任务', async () => {
      const tasks = await taskManager.getAllTasks()
      
      expect(tasks).toEqual([])
    })

    it('应该返回任务副本，避免外部修改', async () => {
      await taskManager.createTask({ title: '任务' })
      
      const tasks1 = await taskManager.getAllTasks()
      const tasks2 = await taskManager.getAllTasks()
      
      expect(tasks1).not.toBe(tasks2) // 不同的数组实例
      expect(tasks1).toEqual(tasks2) // 但内容相同
    })
  })

  describe('initialization', () => {
    it('应该在未初始化时抛出错误', async () => {
      const uninitializedManager = new TaskManager()
      
      await expect(
        uninitializedManager.createTask({ title: '任务' })
      ).rejects.toThrow('任务管理器未初始化')
    })

    it('应该从数据存储加载任务', async () => {
      const existingTasks: Task[] = [
        {
          id: 'task_1',
          title: '已存在的任务',
          projectId: 'inbox',
          priority: 'none',
          tags: [],
          reminders: [],
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 0,
        },
      ]
      
      vi.mocked(dataStore.loadTasks).mockResolvedValueOnce(existingTasks)
      
      const newManager = new TaskManager()
      await newManager.initialize()
      
      const tasks = await newManager.getAllTasks()
      expect(tasks).toHaveLength(1)
      expect(tasks[0].title).toBe('已存在的任务')
    })
  })

  // ==========================================================================
  // 子任务功能测试（需求 3.1 - 3.7）
  // ==========================================================================

  describe('addSubtask', () => {
    it('应该为父任务添加子任务（需求 3.1）', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      const subtask = await taskManager.addSubtask(parent.id, { title: '子任务1' })

      expect(subtask).toBeDefined()
      expect(subtask.parentId).toBe(parent.id)
      expect(subtask.title).toBe('子任务1')
    })

    it('子任务应继承父任务的项目 ID', async () => {
      const parent = await taskManager.createTask({ title: '父任务', projectId: 'project-1' })
      const subtask = await taskManager.addSubtask(parent.id, { title: '子任务' })

      expect(subtask.projectId).toBe('project-1')
    })

    it('子任务可以指定自己的项目 ID', async () => {
      const parent = await taskManager.createTask({ title: '父任务', projectId: 'project-1' })
      const subtask = await taskManager.addSubtask(parent.id, { title: '子任务', projectId: 'project-2' })

      expect(subtask.projectId).toBe('project-2')
    })

    it('应该支持最多 3 层嵌套（需求 3.3）', async () => {
      const level1 = await taskManager.createTask({ title: '第1层' })
      const level2 = await taskManager.addSubtask(level1.id, { title: '第2层' })
      const level3 = await taskManager.addSubtask(level2.id, { title: '第3层' })

      expect(level3).toBeDefined()
      expect(level3.parentId).toBe(level2.id)
    })

    it('应该拒绝超过 3 层的嵌套（需求 3.3）', async () => {
      const level1 = await taskManager.createTask({ title: '第1层' })
      const level2 = await taskManager.addSubtask(level1.id, { title: '第2层' })
      const level3 = await taskManager.addSubtask(level2.id, { title: '第3层' })

      await expect(
        taskManager.addSubtask(level3.id, { title: '第4层' })
      ).rejects.toThrow('子任务嵌套层级不能超过 3 层')
    })

    it('应该拒绝为不存在的父任务添加子任务', async () => {
      await expect(
        taskManager.addSubtask('non-existent-id', { title: '子任务' })
      ).rejects.toThrow('父任务不存在')
    })
  })

  describe('getSubtaskProgress', () => {
    it('应该返回子任务完成进度（需求 3.5）', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      await taskManager.addSubtask(parent.id, { title: '子任务1' })
      const sub2 = await taskManager.addSubtask(parent.id, { title: '子任务2' })
      await taskManager.addSubtask(parent.id, { title: '子任务3' })

      // 完成一个子任务
      await taskManager.toggleTaskComplete(sub2.id)

      const progress = await taskManager.getSubtaskProgress(parent.id)
      expect(progress.completed).toBe(1)
      expect(progress.total).toBe(3)
    })

    it('没有子任务时应返回 0/0', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })

      const progress = await taskManager.getSubtaskProgress(parent.id)
      expect(progress.completed).toBe(0)
      expect(progress.total).toBe(0)
    })

    it('所有子任务完成时应返回全部完成（需求 3.4）', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      const sub1 = await taskManager.addSubtask(parent.id, { title: '子任务1' })
      const sub2 = await taskManager.addSubtask(parent.id, { title: '子任务2' })

      await taskManager.toggleTaskComplete(sub1.id)
      await taskManager.toggleTaskComplete(sub2.id)

      const progress = await taskManager.getSubtaskProgress(parent.id)
      expect(progress.completed).toBe(2)
      expect(progress.total).toBe(2)
    })
  })

  describe('toggleTaskComplete - 子任务自动完成', () => {
    it('完成父任务时应自动完成所有子任务（需求 3.6）', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      const sub1 = await taskManager.addSubtask(parent.id, { title: '子任务1' })
      const sub2 = await taskManager.addSubtask(parent.id, { title: '子任务2' })

      await taskManager.toggleTaskComplete(parent.id)

      const updatedSub1 = await taskManager.getTask(sub1.id)
      const updatedSub2 = await taskManager.getTask(sub2.id)
      expect(updatedSub1!.completed).toBe(true)
      expect(updatedSub1!.completedAt).toBeInstanceOf(Date)
      expect(updatedSub2!.completed).toBe(true)
      expect(updatedSub2!.completedAt).toBeInstanceOf(Date)
    })

    it('完成父任务时应递归完成多层子任务', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      const child = await taskManager.addSubtask(parent.id, { title: '子任务' })
      const grandchild = await taskManager.addSubtask(child.id, { title: '孙任务' })

      await taskManager.toggleTaskComplete(parent.id)

      const updatedChild = await taskManager.getTask(child.id)
      const updatedGrandchild = await taskManager.getTask(grandchild.id)
      expect(updatedChild!.completed).toBe(true)
      expect(updatedGrandchild!.completed).toBe(true)
    })

    it('取消完成父任务时不应影响子任务状态', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      const sub = await taskManager.addSubtask(parent.id, { title: '子任务' })

      // 先完成父任务（子任务也会被完成）
      await taskManager.toggleTaskComplete(parent.id)
      // 再取消完成父任务
      await taskManager.toggleTaskComplete(parent.id)

      const updatedSub = await taskManager.getTask(sub.id)
      // 子任务应保持完成状态
      expect(updatedSub!.completed).toBe(true)
    })
  })

  describe('deleteTask - 级联删除子任务', () => {
    it('删除父任务时应同时删除所有子任务（需求 3.7）', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      const sub1 = await taskManager.addSubtask(parent.id, { title: '子任务1' })
      const sub2 = await taskManager.addSubtask(parent.id, { title: '子任务2' })

      await taskManager.deleteTask(parent.id, true)

      const allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(0)
      expect(await taskManager.getTask(sub1.id)).toBeNull()
      expect(await taskManager.getTask(sub2.id)).toBeNull()
    })

    it('删除父任务时应递归删除多层子任务', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      const child = await taskManager.addSubtask(parent.id, { title: '子任务' })
      await taskManager.addSubtask(child.id, { title: '孙任务' })

      await taskManager.deleteTask(parent.id, true)

      const allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(0)
    })

    it('删除子任务不应影响父任务', async () => {
      const parent = await taskManager.createTask({ title: '父任务' })
      const sub = await taskManager.addSubtask(parent.id, { title: '子任务' })

      await taskManager.toggleTaskComplete(sub.id)
      await taskManager.deleteTask(sub.id)

      const parentTask = await taskManager.getTask(parent.id)
      expect(parentTask).not.toBeNull()
      expect(parentTask!.title).toBe('父任务')
    })
  })

  // ==========================================================================
  // 重复任务功能测试（需求 5.1 - 5.7）
  // ==========================================================================

  describe('handleRecurringTask', () => {
    it('应该为每天重复的任务创建下一次任务（需求 5.2, 5.5）', async () => {
      const dueDate = new Date('2024-03-15T10:00:00')
      const task = await taskManager.createTask({
        title: '每日任务',
        dueDate,
        recurrence: { frequency: 'daily', interval: 1 },
      })

      // 完成任务触发重复
      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(2)

      const newTask = allTasks.find(t => t.id !== task.id)!
      expect(newTask.title).toBe('每日任务')
      expect(newTask.completed).toBe(false)
      expect(newTask.dueDate).toEqual(new Date('2024-03-16T10:00:00'))
      expect(newTask.recurrence).toEqual({ frequency: 'daily', interval: 1 })
    })

    it('应该支持每隔 N 天重复', async () => {
      const dueDate = new Date('2024-03-15T10:00:00')
      const task = await taskManager.createTask({
        title: '每3天任务',
        dueDate,
        recurrence: { frequency: 'daily', interval: 3 },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!
      expect(newTask.dueDate).toEqual(new Date('2024-03-18T10:00:00'))
    })

    it('应该为每周重复的任务创建下一次任务（需求 5.2）', async () => {
      const dueDate = new Date('2024-03-15T10:00:00') // 周五
      const task = await taskManager.createTask({
        title: '每周任务',
        dueDate,
        recurrence: { frequency: 'weekly', interval: 1 },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!
      expect(newTask.dueDate).toEqual(new Date('2024-03-22T10:00:00'))
    })

    it('应该支持每周选择星期几重复（需求 5.3）', async () => {
      const dueDate = new Date('2024-03-11T10:00:00') // 周一
      const task = await taskManager.createTask({
        title: '周一三五任务',
        dueDate,
        recurrence: {
          frequency: 'weekly',
          interval: 1,
          daysOfWeek: [1, 3, 5], // 周一、周三、周五
        },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!
      // 周一完成后，下一个应该是周三
      expect(newTask.dueDate).toEqual(new Date('2024-03-13T10:00:00'))
    })

    it('应该为每月重复的任务创建下一次任务（需求 5.2）', async () => {
      const dueDate = new Date('2024-03-15T10:00:00')
      const task = await taskManager.createTask({
        title: '每月任务',
        dueDate,
        recurrence: { frequency: 'monthly', interval: 1 },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!
      expect(newTask.dueDate).toEqual(new Date('2024-04-15T10:00:00'))
    })

    it('应该支持每月选择日期重复（需求 5.4）', async () => {
      const dueDate = new Date('2024-01-31T10:00:00')
      const task = await taskManager.createTask({
        title: '每月31号任务',
        dueDate,
        recurrence: {
          frequency: 'monthly',
          interval: 1,
          dayOfMonth: 31,
        },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!
      // 2月没有31号，应该使用该月最后一天（29号，2024是闰年）
      expect(newTask.dueDate!.getMonth()).toBe(1) // 2月
      expect(newTask.dueDate!.getDate()).toBe(29)
    })

    it('应该支持每月第几个星期几重复（需求 5.4）', async () => {
      const dueDate = new Date('2024-03-04T10:00:00') // 3月第1个周一
      const task = await taskManager.createTask({
        title: '每月第一个周一',
        dueDate,
        recurrence: {
          frequency: 'monthly',
          interval: 1,
          weekOfMonth: { week: 1, day: 1 }, // 第1个周一
        },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!
      // 2024年4月第1个周一是4月1日
      expect(newTask.dueDate!.getMonth()).toBe(3) // 4月
      expect(newTask.dueDate!.getDay()).toBe(1) // 周一
    })

    it('应该为每年重复的任务创建下一次任务（需求 5.2）', async () => {
      const dueDate = new Date('2024-03-15T10:00:00')
      const task = await taskManager.createTask({
        title: '每年任务',
        dueDate,
        recurrence: { frequency: 'yearly', interval: 1 },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!
      expect(newTask.dueDate).toEqual(new Date('2025-03-15T10:00:00'))
    })

    it('应该在到达结束日期时停止创建新任务（需求 5.6, 5.7）', async () => {
      const dueDate = new Date('2024-03-14T10:00:00')
      const task = await taskManager.createTask({
        title: '有结束日期的任务',
        dueDate,
        recurrence: {
          frequency: 'daily',
          interval: 1,
          endDate: new Date('2024-03-15T23:59:59'),
        },
      })

      // 第一次完成 - 应该创建下一次（3月15日在结束日期之前）
      await taskManager.toggleTaskComplete(task.id)
      let allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(2)

      // 完成第二次 - 不应该创建新任务（3月16日超过结束日期）
      const secondTask = allTasks.find(t => t.id !== task.id)!
      await taskManager.toggleTaskComplete(secondTask.id)
      allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(2) // 仍然只有2个任务
    })

    it('应该在到达重复次数限制时停止创建新任务', async () => {
      const dueDate = new Date('2024-03-15T10:00:00')
      const task = await taskManager.createTask({
        title: '限次任务',
        dueDate,
        recurrence: {
          frequency: 'daily',
          interval: 1,
          count: 2,
        },
      })

      // 第一次完成 - 应该创建下一次（已完成1次，限制2次）
      await taskManager.toggleTaskComplete(task.id)
      let allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(2)

      // 第二次完成 - 不应该创建新任务（已完成2次，达到限制）
      const secondTask = allTasks.find(t => !t.completed)!
      await taskManager.toggleTaskComplete(secondTask.id)
      allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(2) // 仍然只有2个任务
    })

    it('不应该为没有重复规则的任务创建新任务', async () => {
      const task = await taskManager.createTask({ title: '普通任务' })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(1)
    })

    it('新任务应复制原任务的属性但重置完成状态', async () => {
      const dueDate = new Date('2024-03-15T10:00:00')
      const task = await taskManager.createTask({
        title: '重复任务',
        notes: '任务备注',
        projectId: 'project-1',
        priority: 'high',
        tags: ['标签1', '标签2'],
        dueDate,
        recurrence: { frequency: 'daily', interval: 1 },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!

      expect(newTask.title).toBe('重复任务')
      expect(newTask.notes).toBe('任务备注')
      expect(newTask.projectId).toBe('project-1')
      expect(newTask.priority).toBe('high')
      expect(newTask.tags).toEqual(['标签1', '标签2'])
      expect(newTask.completed).toBe(false)
      expect(newTask.completedAt).toBeUndefined()
      expect(newTask.id).not.toBe(task.id)
    })

    it('直接调用 handleRecurringTask 对无重复规则的任务应返回 null', async () => {
      const task = await taskManager.createTask({ title: '普通任务' })

      const result = await taskManager.handleRecurringTask(task)
      expect(result).toBeNull()
    })

    it('应该支持自定义频率重复（需求 5.2）', async () => {
      const dueDate = new Date('2024-03-15T10:00:00')
      const task = await taskManager.createTask({
        title: '自定义重复任务',
        dueDate,
        recurrence: { frequency: 'custom', interval: 5 },
      })

      await taskManager.toggleTaskComplete(task.id)

      const allTasks = await taskManager.getAllTasks()
      const newTask = allTasks.find(t => t.id !== task.id)!
      expect(newTask.dueDate).toEqual(new Date('2024-03-20T10:00:00'))
    })

    it('取消完成重复任务时不应创建新任务', async () => {
      const dueDate = new Date('2024-03-15T10:00:00')
      const task = await taskManager.createTask({
        title: '重复任务',
        dueDate,
        recurrence: { frequency: 'daily', interval: 1 },
      })

      // 完成 -> 创建新任务
      await taskManager.toggleTaskComplete(task.id)
      let allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(2)

      // 取消完成 -> 不应创建新任务
      await taskManager.toggleTaskComplete(task.id)
      allTasks = await taskManager.getAllTasks()
      expect(allTasks).toHaveLength(2) // 仍然是2个
    })
  })
})
