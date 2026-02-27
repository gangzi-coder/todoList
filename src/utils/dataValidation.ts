/**
 * 数据验证工具
 * 
 * 用于验证导入数据的格式和完整性
 * 
 * 验收标准：
 * - 需求 12.5: 验证文件格式的有效性
 * - 需求 12.6: 格式无效时显示错误提示并终止导入
 * - 需求 18.8: 验证导入的 JSON 数据格式符合应用数据结构
 */

import type { ExportData, Task, Project, Tag, AppSettings, Priority, RecurrenceFrequency } from '@/types'

/**
 * 验证错误类
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * 验证导出数据格式
 * 
 * @param data 待验证的数据
 * @throws {ValidationError} 如果数据格式无效
 */
export function validateExportData(data: any): asserts data is ExportData {
  // 检查是否为对象
  if (!data || typeof data !== 'object') {
    throw new ValidationError('导入数据必须是一个对象')
  }

  // 检查必需字段
  if (!data.version || typeof data.version !== 'string') {
    throw new ValidationError('缺少或无效的版本号字段')
  }

  if (!data.exportedAt) {
    throw new ValidationError('缺少导出时间字段')
  }

  // 验证导出时间
  const exportedAt = new Date(data.exportedAt)
  if (isNaN(exportedAt.getTime())) {
    throw new ValidationError('导出时间格式无效')
  }

  // 检查数据数组
  if (!Array.isArray(data.tasks)) {
    throw new ValidationError('任务列表必须是数组')
  }

  if (!Array.isArray(data.projects)) {
    throw new ValidationError('项目列表必须是数组')
  }

  if (!Array.isArray(data.tags)) {
    throw new ValidationError('标签列表必须是数组')
  }

  if (!data.settings || typeof data.settings !== 'object') {
    throw new ValidationError('设置必须是对象')
  }

  // 验证任务数据
  data.tasks.forEach((task: any, index: number) => {
    try {
      validateTask(task)
    } catch (error) {
      throw new ValidationError(`任务 #${index + 1} 验证失败: ${(error as Error).message}`)
    }
  })

  // 验证项目数据
  data.projects.forEach((project: any, index: number) => {
    try {
      validateProject(project)
    } catch (error) {
      throw new ValidationError(`项目 #${index + 1} 验证失败: ${(error as Error).message}`)
    }
  })

  // 验证标签数据
  data.tags.forEach((tag: any, index: number) => {
    try {
      validateTag(tag)
    } catch (error) {
      throw new ValidationError(`标签 #${index + 1} 验证失败: ${(error as Error).message}`)
    }
  })

  // 验证设置数据
  try {
    validateSettings(data.settings)
  } catch (error) {
    throw new ValidationError(`设置验证失败: ${(error as Error).message}`)
  }
}

/**
 * 验证任务对象
 */
function validateTask(task: any): asserts task is Task {
  if (!task || typeof task !== 'object') {
    throw new ValidationError('任务必须是对象')
  }

  // 必需字段
  if (!task.id || typeof task.id !== 'string') {
    throw new ValidationError('任务缺少有效的 id 字段')
  }

  if (!task.title || typeof task.title !== 'string') {
    throw new ValidationError('任务缺少有效的 title 字段')
  }

  if (task.title.length > 200) {
    throw new ValidationError('任务标题长度不能超过 200 个字符')
  }

  if (!task.projectId || typeof task.projectId !== 'string') {
    throw new ValidationError('任务缺少有效的 projectId 字段')
  }

  // 验证优先级
  const validPriorities: Priority[] = ['high', 'medium', 'low', 'none']
  if (!validPriorities.includes(task.priority)) {
    throw new ValidationError(`任务优先级无效: ${task.priority}`)
  }

  // 验证标签数组
  if (!Array.isArray(task.tags)) {
    throw new ValidationError('任务标签必须是数组')
  }

  // 验证提醒数组
  if (!Array.isArray(task.reminders)) {
    throw new ValidationError('任务提醒必须是数组')
  }

  // 验证日期字段
  if (task.reminders.length > 0) {
    task.reminders.forEach((reminder: any, index: number) => {
      const date = new Date(reminder)
      if (isNaN(date.getTime())) {
        throw new ValidationError(`提醒时间 #${index + 1} 格式无效`)
      }
    })
  }

  // 验证完成状态
  if (typeof task.completed !== 'boolean') {
    throw new ValidationError('任务完成状态必须是布尔值')
  }

  // 验证时间戳
  const createdAt = new Date(task.createdAt)
  if (isNaN(createdAt.getTime())) {
    throw new ValidationError('任务创建时间格式无效')
  }

  const updatedAt = new Date(task.updatedAt)
  if (isNaN(updatedAt.getTime())) {
    throw new ValidationError('任务更新时间格式无效')
  }

  // 验证排序顺序
  if (typeof task.order !== 'number') {
    throw new ValidationError('任务排序顺序必须是数字')
  }

  // 可选字段验证
  if (task.notes !== undefined && typeof task.notes !== 'string') {
    throw new ValidationError('任务备注必须是字符串')
  }

  if (task.notes && task.notes.length > 500) {
    throw new ValidationError('任务备注长度不能超过 500 个字符')
  }

  if (task.parentId !== undefined && typeof task.parentId !== 'string') {
    throw new ValidationError('父任务 ID 必须是字符串')
  }

  if (task.dueDate !== undefined) {
    const dueDate = new Date(task.dueDate)
    if (isNaN(dueDate.getTime())) {
      throw new ValidationError('任务截止日期格式无效')
    }
  }

  if (task.completedAt !== undefined) {
    const completedAt = new Date(task.completedAt)
    if (isNaN(completedAt.getTime())) {
      throw new ValidationError('任务完成时间格式无效')
    }
  }

  // 验证重复规则
  if (task.recurrence !== undefined) {
    validateRecurrenceRule(task.recurrence)
  }
}

/**
 * 验证重复规则
 */
function validateRecurrenceRule(rule: any): void {
  if (!rule || typeof rule !== 'object') {
    throw new ValidationError('重复规则必须是对象')
  }

  const validFrequencies: RecurrenceFrequency[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom']
  if (!validFrequencies.includes(rule.frequency)) {
    throw new ValidationError(`重复频率无效: ${rule.frequency}`)
  }

  if (typeof rule.interval !== 'number' || rule.interval < 1) {
    throw new ValidationError('重复间隔必须是大于 0 的数字')
  }

  if (rule.daysOfWeek !== undefined) {
    if (!Array.isArray(rule.daysOfWeek)) {
      throw new ValidationError('每周重复天数必须是数组')
    }
    rule.daysOfWeek.forEach((day: any) => {
      if (typeof day !== 'number' || day < 0 || day > 6) {
        throw new ValidationError('每周重复天数必须在 0-6 之间')
      }
    })
  }

  if (rule.dayOfMonth !== undefined) {
    if (typeof rule.dayOfMonth !== 'number' || rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
      throw new ValidationError('每月重复日期必须在 1-31 之间')
    }
  }

  if (rule.weekOfMonth !== undefined) {
    if (!rule.weekOfMonth.week || !rule.weekOfMonth.day) {
      throw new ValidationError('每月重复周次格式无效')
    }
    if (rule.weekOfMonth.week < 1 || rule.weekOfMonth.week > 5) {
      throw new ValidationError('每月重复周次必须在 1-5 之间')
    }
    if (rule.weekOfMonth.day < 0 || rule.weekOfMonth.day > 6) {
      throw new ValidationError('每月重复星期几必须在 0-6 之间')
    }
  }

  if (rule.endDate !== undefined) {
    const endDate = new Date(rule.endDate)
    if (isNaN(endDate.getTime())) {
      throw new ValidationError('重复结束日期格式无效')
    }
  }

  if (rule.count !== undefined) {
    if (typeof rule.count !== 'number' || rule.count < 1) {
      throw new ValidationError('重复次数必须是大于 0 的数字')
    }
  }
}

/**
 * 验证项目对象
 */
function validateProject(project: any): asserts project is Project {
  if (!project || typeof project !== 'object') {
    throw new ValidationError('项目必须是对象')
  }

  if (!project.id || typeof project.id !== 'string') {
    throw new ValidationError('项目缺少有效的 id 字段')
  }

  if (!project.name || typeof project.name !== 'string') {
    throw new ValidationError('项目缺少有效的 name 字段')
  }

  if (project.name.length > 50) {
    throw new ValidationError('项目名称长度不能超过 50 个字符')
  }

  if (!project.color || typeof project.color !== 'string') {
    throw new ValidationError('项目缺少有效的 color 字段')
  }

  if (typeof project.isDefault !== 'boolean') {
    throw new ValidationError('项目 isDefault 字段必须是布尔值')
  }

  const createdAt = new Date(project.createdAt)
  if (isNaN(createdAt.getTime())) {
    throw new ValidationError('项目创建时间格式无效')
  }

  if (typeof project.order !== 'number') {
    throw new ValidationError('项目排序顺序必须是数字')
  }
}

/**
 * 验证标签对象
 */
function validateTag(tag: any): asserts tag is Tag {
  if (!tag || typeof tag !== 'object') {
    throw new ValidationError('标签必须是对象')
  }

  if (!tag.name || typeof tag.name !== 'string') {
    throw new ValidationError('标签缺少有效的 name 字段')
  }

  if (tag.name.length > 20) {
    throw new ValidationError('标签名称长度不能超过 20 个字符')
  }

  if (!tag.color || typeof tag.color !== 'string') {
    throw new ValidationError('标签缺少有效的 color 字段')
  }

  if (typeof tag.usageCount !== 'number' || tag.usageCount < 0) {
    throw new ValidationError('标签使用次数必须是非负数字')
  }
}

/**
 * 验证设置对象
 */
function validateSettings(settings: any): asserts settings is AppSettings {
  if (!settings || typeof settings !== 'object') {
    throw new ValidationError('设置必须是对象')
  }

  const validViews = ['today', 'upcoming', 'inbox', 'all']
  if (!validViews.includes(settings.defaultView)) {
    throw new ValidationError(`默认视图无效: ${settings.defaultView}`)
  }

  const validSorts = ['createdAt', 'dueDate', 'priority', 'title']
  if (!validSorts.includes(settings.defaultSort)) {
    throw new ValidationError(`默认排序无效: ${settings.defaultSort}`)
  }

  const validThemes = ['auto', 'light', 'dark']
  if (!validThemes.includes(settings.themeMode)) {
    throw new ValidationError(`主题模式无效: ${settings.themeMode}`)
  }

  if (typeof settings.enableReminders !== 'boolean') {
    throw new ValidationError('启用提醒设置必须是布尔值')
  }

  if (typeof settings.autoDeleteCompleted !== 'boolean') {
    throw new ValidationError('自动删除已完成任务设置必须是布尔值')
  }

  if (typeof settings.autoDeleteDelay !== 'number' || settings.autoDeleteDelay < 1 || settings.autoDeleteDelay > 30) {
    throw new ValidationError('自动删除延迟天数必须在 1-30 之间')
  }

  if (typeof settings.playCompletionSound !== 'boolean') {
    throw new ValidationError('播放完成音效设置必须是布尔值')
  }

  if (settings.weekStartsOn !== 0 && settings.weekStartsOn !== 1) {
    throw new ValidationError('每周第一天必须是 0 或 1')
  }

  if (typeof settings.enableAnimations !== 'boolean') {
    throw new ValidationError('启用动画设置必须是布尔值')
  }
}

/**
 * 解析并验证导入的 JSON 字符串
 *
 * 处理 JSON 解析错误和数据验证错误，返回统一的结果
 *
 * @param jsonString 待解析的 JSON 字符串
 * @returns 解析结果，包含数据或错误信息
 */
export function parseAndValidateImportData(jsonString: string): { success: true; data: ExportData } | { success: false; error: string } {
  // 步骤 1: 解析 JSON
  let parsed: any
  try {
    parsed = JSON.parse(jsonString)
  } catch {
    return { success: false, error: '文件不是有效的 JSON 格式，请检查文件内容' }
  }

  // 步骤 2: 验证数据结构
  try {
    validateExportData(parsed)
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: `数据验证失败: ${error.message}` }
    }
    return { success: false, error: '数据验证过程中发生未知错误' }
  }

  return { success: true, data: parsed as ExportData }
}

