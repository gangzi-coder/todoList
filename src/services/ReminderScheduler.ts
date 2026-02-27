/**
 * 提醒调度器服务
 *
 * 管理任务提醒的调度、取消和触发
 *
 * 验收标准：
 * - 需求 6.1: 允许用户为任务设置提醒时间
 * - 需求 6.2: 支持设置多个提醒时间
 * - 需求 6.3: 到达提醒时间时通过 uTools 发送系统通知
 * - 需求 6.4: 在通知中显示任务标题和项目名称
 * - 需求 6.5: 用户点击通知时打开应用并定位到该任务
 */

import type { Task, Project } from '@/types'

/**
 * 提醒调度器接口
 */
export interface IReminderScheduler {
  /** 调度提醒 */
  scheduleReminder(taskId: string, reminderTime: Date): Promise<void>

  /** 取消指定提醒 */
  cancelReminder(taskId: string, reminderTime: Date): Promise<void>

  /** 取消任务的所有提醒 */
  cancelAllReminders(taskId: string): Promise<void>

  /** 触发提醒通知 */
  triggerReminder(taskId: string): Promise<void>

  /** 检查待触发的提醒（应用启动时调用） */
  checkPendingReminders(): Promise<void>
}

/**
 * 生成提醒定时器的唯一键
 * 使用 taskId + 时间戳组合，支持同一任务的多个提醒
 */
function makeTimerKey(taskId: string, reminderTime: Date): string {
  return `${taskId}::${reminderTime.getTime()}`
}

/**
 * 提醒调度器实现
 *
 * 使用 setTimeout 调度提醒，维护定时器映射以支持取消操作。
 * 通知优先使用 uTools API，不可用时降级到浏览器 Notification API。
 */
export class ReminderScheduler implements IReminderScheduler {
  /** 已调度的定时器映射：key -> timerId */
  private timers = new Map<string, ReturnType<typeof setTimeout>>()

  /** 获取任务数据的回调 */
  private getTask: (id: string) => Task | undefined

  /** 获取项目数据的回调 */
  private getProject: (id: string) => Project | undefined

  /** 通知点击回调：定位到指定任务 */
  private onNotificationClick?: (taskId: string) => void

  constructor(options: {
    getTask: (id: string) => Task | undefined
    getProject: (id: string) => Project | undefined
    onNotificationClick?: (taskId: string) => void
  }) {
    this.getTask = options.getTask
    this.getProject = options.getProject
    this.onNotificationClick = options.onNotificationClick
  }

  /**
   * 调度提醒
   *
   * 需求 6.1: 允许用户为任务设置提醒时间
   * 需求 6.2: 支持设置多个提醒时间
   *
   * @param taskId 任务 ID
   * @param reminderTime 提醒时间
   */
  async scheduleReminder(taskId: string, reminderTime: Date): Promise<void> {
    const key = makeTimerKey(taskId, reminderTime)

    // 如果已存在相同的提醒，先取消旧的
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!)
      this.timers.delete(key)
    }

    const now = Date.now()
    const delay = reminderTime.getTime() - now

    // 如果提醒时间已过，立即触发
    if (delay <= 0) {
      await this.triggerReminder(taskId)
      return
    }

    // 使用 setTimeout 调度提醒
    const timerId = setTimeout(async () => {
      this.timers.delete(key)
      await this.triggerReminder(taskId)
    }, delay)

    this.timers.set(key, timerId)
  }

  /**
   * 取消指定提醒
   *
   * @param taskId 任务 ID
   * @param reminderTime 提醒时间
   */
  async cancelReminder(taskId: string, reminderTime: Date): Promise<void> {
    const key = makeTimerKey(taskId, reminderTime)
    const timerId = this.timers.get(key)

    if (timerId !== undefined) {
      clearTimeout(timerId)
      this.timers.delete(key)
    }
  }

  /**
   * 取消任务的所有提醒
   *
   * @param taskId 任务 ID
   */
  async cancelAllReminders(taskId: string): Promise<void> {
    const prefix = `${taskId}::`

    for (const [key, timerId] of this.timers.entries()) {
      if (key.startsWith(prefix)) {
        clearTimeout(timerId)
        this.timers.delete(key)
      }
    }
  }

  /**
   * 触发提醒通知
   *
   * 需求 6.3: 通过 uTools 发送系统通知
   * 需求 6.4: 在通知中显示任务标题和项目名称
   * 需求 6.5: 用户点击通知时打开应用并定位到该任务
   *
   * @param taskId 任务 ID
   */
  async triggerReminder(taskId: string): Promise<void> {
    const task = this.getTask(taskId)
    if (!task) {
      console.warn(`[ReminderScheduler] 任务不存在: ${taskId}`)
      return
    }

    // 已完成的任务不再提醒
    if (task.completed) {
      return
    }

    // 构建通知内容
    const project = this.getProject(task.projectId)
    const projectName = project?.name || '收件箱'
    const body = `[${projectName}] ${task.title}`

    // 优先使用 uTools 通知 API
    if (window.utools?.showNotification) {
      // clickFeatureCode 用于通知点击时唤起插件，需与 plugin.json 中的 feature code 一致
      window.utools.showNotification(body, 'todo')

      // uTools 通知点击会重新唤起插件，通过回调定位任务
      if (this.onNotificationClick) {
        this.onNotificationClick(taskId)
      }
      return
    }

    // 降级到浏览器 Notification API
    if (typeof Notification !== 'undefined') {
      try {
        if (Notification.permission === 'granted') {
          this.showBrowserNotification(body, taskId)
        } else if (Notification.permission !== 'denied') {
          const permission = await Notification.requestPermission()
          if (permission === 'granted') {
            this.showBrowserNotification(body, taskId)
          }
        }
      } catch (error) {
        console.warn('[ReminderScheduler] 浏览器通知不可用:', error)
      }
      return
    }

    console.warn('[ReminderScheduler] 没有可用的通知 API')
  }

  /**
   * 检查待触发的提醒
   *
   * 应用启动时调用，遍历所有任务的提醒时间：
   * - 已过期的提醒立即触发
   * - 未到期的提醒重新调度
   *
   * @param tasks 所有任务列表
   */
  async checkPendingReminders(tasks?: Task[]): Promise<void> {
    const allTasks = tasks || this.getAllTasks()
    const now = Date.now()

    for (const task of allTasks) {
      // 跳过已完成的任务
      if (task.completed) {
        continue
      }

      // 跳过没有提醒的任务
      if (!task.reminders || task.reminders.length === 0) {
        continue
      }

      for (const reminder of task.reminders) {
        const reminderTime = reminder instanceof Date ? reminder : new Date(reminder)
        const delay = reminderTime.getTime() - now

        if (delay <= 0) {
          // 已过期的提醒，立即触发
          await this.triggerReminder(task.id)
        } else {
          // 未到期的提醒，重新调度
          await this.scheduleReminder(task.id, reminderTime)
        }
      }
    }
  }

  /**
   * 获取当前已调度的提醒数量（用于调试和测试）
   */
  getScheduledCount(): number {
    return this.timers.size
  }

  /**
   * 销毁调度器，清除所有定时器
   */
  destroy(): void {
    for (const timerId of this.timers.values()) {
      clearTimeout(timerId)
    }
    this.timers.clear()
  }

  // ============================================================================
  // 私有方法
  // ============================================================================

  /**
   * 显示浏览器原生通知
   */
  private showBrowserNotification(body: string, taskId: string): void {
    const notification = new Notification('待办提醒', {
      body,
      icon: '/favicon.ico',
      tag: `reminder-${taskId}`,
    })

    notification.onclick = () => {
      window.focus()
      if (this.onNotificationClick) {
        this.onNotificationClick(taskId)
      }
      notification.close()
    }
  }

  /**
   * 尝试从 getTask 回调获取所有任务
   * 这是一个辅助方法，checkPendingReminders 可以接收外部传入的任务列表
   */
  private getAllTasks(): Task[] {
    // 如果没有传入任务列表，返回空数组
    // 调用方应该显式传入任务列表
    return []
  }
}

/**
 * 创建提醒调度器实例的工厂函数
 *
 * 在应用初始化时调用，传入 store 的 getter 方法
 */
export function createReminderScheduler(options: {
  getTask: (id: string) => Task | undefined
  getProject: (id: string) => Project | undefined
  onNotificationClick?: (taskId: string) => void
}): ReminderScheduler {
  return new ReminderScheduler(options)
}
