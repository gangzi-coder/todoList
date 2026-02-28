/**
 * 任务管理器服务
 * 
 * 负责任务的 CRUD 操作和业务规则
 * 
 * 验收标准：
 * - 需求 1.1: 创建新任务并显示在任务列表中
 * - 需求 1.2: 切换任务的完成状态
 * - 需求 1.3: 允许修改任务的所有属性
 * - 需求 1.4: 删除已完成的任务立即删除
 * - 需求 1.5: 删除未完成的任务显示确认对话框
 * - 需求 1.6: 确认删除后永久删除任务
 * - 需求 1.7: 为每个任务分配唯一标识符
 * - 需求 1.8: 记录任务的创建时间和最后修改时间
 */

import type { Task, CreateTaskDTO } from '@/types'
import { calculateNextRecurrence } from '@/utils/date'
import { validateTaskTitle, validateTaskNotes } from '@/utils/validation'
import { dataStore } from './DataStore'

/**
 * 子任务完成进度
 */
export interface SubtaskProgress {
  /** 已完成子任务数 */
  completed: number
  /** 子任务总数 */
  total: number
}

/**
 * 任务管理器接口
 */
export interface ITaskManager {
  /** 创建任务 */
  createTask(task: CreateTaskDTO): Promise<Task>
  
  /** 更新任务 */
  updateTask(id: string, updates: Partial<Task>): Promise<Task>
  
  /** 删除任务（级联删除子任务） */
  deleteTask(id: string, confirmed?: boolean): Promise<void>
  
  /** 切换完成状态（父任务完成时自动完成子任务） */
  toggleTaskComplete(id: string): Promise<Task>
  
  /** 添加子任务（限制嵌套层级为 3） */
  addSubtask(parentId: string, subtask: CreateTaskDTO): Promise<Task>
  
  /** 获取子任务完成进度 */
  getSubtaskProgress(parentId: string): Promise<SubtaskProgress>
  
  /** 获取任务 */
  getTask(id: string): Promise<Task | null>
  
  /** 获取所有任务 */
  getAllTasks(): Promise<Task[]>
  
  /** 处理重复任务：完成时自动创建下一次任务 */
  handleRecurringTask(task: Task): Promise<Task | null>
}

/**
 * 任务管理器实现
 */
export class TaskManager implements ITaskManager {
  private tasks: Task[] = []
  private initialized = false

  /**
   * 初始化任务管理器
   * 从数据存储加载任务数据
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      this.tasks = await dataStore.loadTasks()
      this.initialized = true
    } catch (error) {
      console.error('[TaskManager] Failed to initialize:', error)
      throw new Error('任务管理器初始化失败')
    }
  }

  /**
   * 创建任务
   * 
   * 验收标准：
   * - 需求 1.1: 创建新任务并显示在任务列表中
   * - 需求 1.7: 为每个任务分配唯一标识符
   * - 需求 1.8: 记录任务的创建时间和最后修改时间
   * 
   * @param taskDTO 创建任务 DTO
   * @returns 创建的任务
   * @throws 如果验证失败
   */
  async createTask(taskDTO: CreateTaskDTO): Promise<Task> {
    this.ensureInitialized()

    // 验证任务标题
    const titleValidation = validateTaskTitle(taskDTO.title)
    if (!titleValidation.valid) {
      throw new Error(titleValidation.error || '任务标题验证失败')
    }

    // 验证任务备注
    const notesValidation = validateTaskNotes(taskDTO.notes)
    if (!notesValidation.valid) {
      throw new Error(notesValidation.error || '任务备注验证失败')
    }

    // 生成唯一 ID
    const id = this.generateUniqueId()

    // 获取当前时间
    const now = new Date()

    // 创建任务对象
    const task: Task = {
      id,
      title: taskDTO.title.trim(),
      notes: taskDTO.notes?.trim(),
      projectId: taskDTO.projectId || 'inbox', // 默认使用收件箱项目
      parentId: taskDTO.parentId,
      priority: taskDTO.priority || 'none',
      tags: taskDTO.tags || [],
      dueDate: taskDTO.dueDate,
      startDate: taskDTO.startDate,
      reminders: taskDTO.reminders || [],
      recurrence: taskDTO.recurrence,
      completed: false,
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
      order: this.getNextOrder(),
    }

    // 添加到任务列表
    this.tasks.push(task)

    // 保存到数据存储
    await this.saveTasks()

    return task
  }

  /**
   * 更新任务
   * 
   * 验收标准：
   * - 需求 1.3: 允许修改任务的所有属性
   * - 需求 1.8: 记录最后修改时间
   * 
   * @param id 任务 ID
   * @param updates 要更新的字段
   * @returns 更新后的任务
   * @throws 如果任务不存在或验证失败
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    this.ensureInitialized()

    // 查找任务
    const task = this.tasks.find(t => t.id === id)
    if (!task) {
      throw new Error('任务不存在')
    }

    // 验证更新的字段
    if (updates.title !== undefined) {
      const titleValidation = validateTaskTitle(updates.title)
      if (!titleValidation.valid) {
        throw new Error(titleValidation.error || '任务标题验证失败')
      }
      updates.title = updates.title.trim()
    }

    if (updates.notes !== undefined) {
      const notesValidation = validateTaskNotes(updates.notes)
      if (!notesValidation.valid) {
        throw new Error(notesValidation.error || '任务备注验证失败')
      }
      updates.notes = updates.notes.trim()
    }

    // 更新任务
    Object.assign(task, updates, {
      updatedAt: new Date(), // 更新修改时间
    })

    // 保存到数据存储
    await this.saveTasks()

    return task
  }

  /**
   * 删除任务
   * 
   * 验收标准：
   * - 需求 1.4: 删除已完成的任务立即删除
   * - 需求 1.5: 删除未完成的任务显示确认对话框
   * - 需求 1.6: 确认删除后永久删除任务
   * - 需求 3.7: 删除父任务时同时删除所有子任务
   * 
   * @param id 任务 ID
   * @param confirmed 是否已确认删除（用于未完成任务）
   * @throws 如果任务不存在或需要确认但未确认
   */
  async deleteTask(id: string, confirmed: boolean = false): Promise<void> {
    this.ensureInitialized()

    // 查找任务
    const task = this.tasks.find(t => t.id === id)
    if (!task) {
      throw new Error('任务不存在')
    }

    // 如果任务未完成且未确认，抛出错误要求确认
    if (!task.completed && !confirmed) {
      throw new Error('CONFIRMATION_REQUIRED')
    }

    // 收集所有需要删除的任务 ID（包括所有层级的子任务）
    const idsToDelete = this.collectDescendantIds(id)
    idsToDelete.add(id)

    // 从任务列表中删除任务及其所有子任务
    this.tasks = this.tasks.filter(t => !idsToDelete.has(t.id))

    // 保存到数据存储
    await this.saveTasks()
  }

  /**
   * 切换任务完成状态
   * 
   * 验收标准：
   * - 需求 1.2: 切换任务的完成状态
   * - 需求 3.6: 完成父任务时自动完成所有未完成的子任务
   * - 需求 5.5: 完成重复任务时自动创建下一次任务
   * - 记录完成时间
   * 
   * @param id 任务 ID
   * @returns 更新后的任务
   * @throws 如果任务不存在
   */
  async toggleTaskComplete(id: string): Promise<Task> {
    this.ensureInitialized()

    // 查找任务
    const task = this.tasks.find(t => t.id === id)
    if (!task) {
      throw new Error('任务不存在')
    }

    // 切换完成状态
    task.completed = !task.completed
    task.updatedAt = new Date()

    // 如果标记为完成，记录完成时间
    if (task.completed) {
      task.completedAt = new Date()

      // 需求 3.6: 自动完成所有未完成的子任务
      this.completeAllDescendants(id)

      // 需求 5.5: 完成重复任务时自动创建下一次任务
      if (task.recurrence) {
        await this.handleRecurringTask(task)
      }
    } else {
      // 如果取消完成，清除完成时间
      task.completedAt = undefined
    }

    // 保存到数据存储
    await this.saveTasks()

    return task
  }

  /**
   * 获取任务
   * 
   * @param id 任务 ID
   * @returns 任务对象，如果不存在则返回 null
   */
  async getTask(id: string): Promise<Task | null> {
    this.ensureInitialized()
    return this.tasks.find(t => t.id === id) || null
  }

  /**
   * 获取所有任务
   * 
   * @returns 所有任务列表
   */
  async getAllTasks(): Promise<Task[]> {
    this.ensureInitialized()
    return [...this.tasks] // 返回副本，避免外部修改
  }

  // ============================================================================
  // 子任务相关方法
  // ============================================================================

  /**
   * 添加子任务
   * 
   * 验收标准：
   * - 需求 3.1: 允许用户为任务添加子任务
   * - 需求 3.3: 支持最多 3 层的子任务嵌套
   * 
   * @param parentId 父任务 ID
   * @param subtaskDTO 子任务 DTO
   * @returns 创建的子任务
   * @throws 如果父任务不存在或超过嵌套层级限制
   */
  async addSubtask(parentId: string, subtaskDTO: CreateTaskDTO): Promise<Task> {
    this.ensureInitialized()

    // 查找父任务
    const parentTask = this.tasks.find(t => t.id === parentId)
    if (!parentTask) {
      throw new Error('父任务不存在')
    }

    // 检查嵌套层级（最多 3 层）
    const depth = this.getNestingDepth(parentId)
    if (depth >= 3) {
      throw new Error('子任务嵌套层级不能超过 3 层')
    }

    // 使用 createTask 创建子任务，设置 parentId
    const subtask = await this.createTask({
      ...subtaskDTO,
      parentId,
      projectId: subtaskDTO.projectId || parentTask.projectId,
    })

    return subtask
  }

  /**
   * 获取子任务完成进度
   * 
   * 验收标准：
   * - 需求 3.4: 所有子任务完成时在父任务上显示完成提示
   * - 需求 3.5: 在父任务上显示子任务完成进度（如 3/5）
   * 
   * @param parentId 父任务 ID
   * @returns 子任务完成进度 {completed, total}
   */
  async getSubtaskProgress(parentId: string): Promise<SubtaskProgress> {
    this.ensureInitialized()

    const directChildren = this.tasks.filter(t => t.parentId === parentId)
    const completed = directChildren.filter(t => t.completed).length
    const total = directChildren.length

    return { completed, total }
  }

  // ============================================================================
  // 重复任务相关方法
  // ============================================================================

  /**
   * 处理重复任务
   * 
   * 验收标准：
   * - 需求 5.1: 支持设置任务重复规则
   * - 需求 5.2: 支持每天、每周、每月、每年、自定义重复频率
   * - 需求 5.3: 每周重复时允许选择星期几
   * - 需求 5.4: 每月重复时允许选择日期或第几个星期几
   * - 需求 5.5: 完成重复任务时自动创建下一次任务
   * - 需求 5.6: 允许设置重复任务的结束日期
   * - 需求 5.7: 到达结束日期时停止创建新的重复任务
   * 
   * @param task 已完成的重复任务
   * @returns 新创建的下一次任务，如果重复已结束则返回 null
   */
  async handleRecurringTask(task: Task): Promise<Task | null> {
    this.ensureInitialized()

    if (!task.recurrence) {
      return null
    }

    const rule = task.recurrence

    // 检查重复次数限制
    if (rule.count !== undefined) {
      const completedCount = this.countCompletedRecurrences(task)
      if (completedCount >= rule.count) {
        return null
      }
    }

    // 计算下次任务日期
    const currentDueDate = task.dueDate || task.completedAt || new Date()
    const nextDueDate = calculateNextRecurrence(currentDueDate, rule)

    // 如果没有下次日期（已达到结束条件），返回 null
    if (!nextDueDate) {
      return null
    }

    // 创建下一次重复任务（复制所有属性，重置完成状态）
    const now = new Date()
    const newTask: Task = {
      id: this.generateUniqueId(),
      title: task.title,
      notes: task.notes,
      projectId: task.projectId,
      parentId: task.parentId,
      priority: task.priority,
      tags: [...task.tags],
      dueDate: nextDueDate,
      reminders: this.calculateNewReminders(task.reminders, task.dueDate, nextDueDate),
      recurrence: { ...rule },
      completed: false,
      completedAt: undefined,
      createdAt: now,
      updatedAt: now,
      order: this.getNextOrder(),
    }

    // 添加到任务列表
    this.tasks.push(newTask)

    return newTask
  }

  // ============================================================================
  // 私有辅助方法
  // ============================================================================

  /**
   * 确保任务管理器已初始化
   * @throws 如果未初始化
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('任务管理器未初始化，请先调用 initialize()')
    }
  }

  /**
   * 统计同一重复系列中已完成的任务数量
   * 通过匹配标题和重复规则来识别同一系列的任务
   * 
   * @param task 当前重复任务
   * @returns 已完成的重复次数
   */
  private countCompletedRecurrences(task: Task): number {
    return this.tasks.filter(t =>
      t.title === task.title &&
      t.completed &&
      t.recurrence !== undefined
    ).length
  }

  /**
   * 根据旧截止日期和新截止日期的偏移量，计算新任务的提醒时间
   * 
   * @param oldReminders 旧提醒时间列表
   * @param oldDueDate 旧截止日期
   * @param newDueDate 新截止日期
   * @returns 新的提醒时间列表
   */
  private calculateNewReminders(
    oldReminders: Date[],
    oldDueDate: Date | undefined,
    newDueDate: Date
  ): Date[] {
    if (!oldReminders.length || !oldDueDate) {
      return []
    }

    const timeDiff = newDueDate.getTime() - oldDueDate.getTime()
    return oldReminders.map(reminder => new Date(reminder.getTime() + timeDiff))
  }

  /**
   * 生成唯一 ID
   * 使用时间戳 + 随机数的方式生成
   * 
   * @returns 唯一 ID
   */
  private generateUniqueId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 9)
    return `task_${timestamp}_${random}`
  }

  /**
   * 获取下一个排序顺序
   * 
   * @returns 排序顺序值
   */
  private getNextOrder(): number {
    if (this.tasks.length === 0) {
      return 0
    }
    const maxOrder = Math.max(...this.tasks.map(t => t.order))
    return maxOrder + 1
  }

  /**
   * 保存任务到数据存储
   * 
   * @throws 如果保存失败
   */
  private async saveTasks(): Promise<void> {
    try {
      await dataStore.saveTasks(this.tasks)
    } catch (error) {
      console.error('[TaskManager] Failed to save tasks:', error)
      throw new Error('保存任务失败')
    }
  }

  /**
   * 计算任务的嵌套层级
   * 根任务为第 1 层，其子任务为第 2 层，以此类推
   * 
   * @param taskId 任务 ID
   * @returns 嵌套层级深度
   */
  private getNestingDepth(taskId: string): number {
    let depth = 1
    let currentTask = this.tasks.find(t => t.id === taskId)

    while (currentTask?.parentId) {
      depth++
      currentTask = this.tasks.find(t => t.id === currentTask!.parentId)
    }

    return depth
  }

  /**
   * 收集所有后代任务的 ID（递归）
   * 
   * @param parentId 父任务 ID
   * @returns 所有后代任务 ID 的集合
   */
  private collectDescendantIds(parentId: string): Set<string> {
    const ids = new Set<string>()
    const directChildren = this.tasks.filter(t => t.parentId === parentId)

    for (const child of directChildren) {
      ids.add(child.id)
      const grandchildIds = this.collectDescendantIds(child.id)
      grandchildIds.forEach(id => ids.add(id))
    }

    return ids
  }

  /**
   * 自动完成所有后代任务
   * 
   * 验收标准：
   * - 需求 3.6: 完成父任务时自动完成所有未完成的子任务
   * 
   * @param parentId 父任务 ID
   */
  private completeAllDescendants(parentId: string): void {
    const now = new Date()
    const descendants = this.tasks.filter(t => t.parentId === parentId)

    for (const child of descendants) {
      if (!child.completed) {
        child.completed = true
        child.completedAt = now
        child.updatedAt = now
      }
      // 递归完成更深层的子任务
      this.completeAllDescendants(child.id)
    }
  }
}

/**
 * 创建并导出单例实例
 */
export const taskManager = new TaskManager()
