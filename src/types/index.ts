/**
 * 核心数据类型定义
 * 
 * 本文件定义了待办事项应用的所有核心数据类型、枚举和 DTO
 */

// ============================================================================
// 枚举类型
// ============================================================================

/**
 * 任务优先级
 */
export type Priority = 'high' | 'medium' | 'low' | 'none'

/**
 * 重复任务频率
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'

/**
 * 视图类型
 */
export type ViewType = 'today' | 'upcoming' | 'inbox' | 'all'

/**
 * 排序选项
 */
export type SortOption = 'createdAt' | 'dueDate' | 'priority' | 'title'

/**
 * 导入策略
 */
export type ImportStrategy = 'overwrite' | 'merge' | 'skip'

// ============================================================================
// 核心数据模型
// ============================================================================

/**
 * 任务
 * 
 * 验收标准：
 * - 需求 1.7: 为每个任务分配唯一标识符
 * - 需求 1.8: 记录任务的创建时间和最后修改时间
 * - 需求 4.1: 支持四个优先级等级
 * - 需求 5.1: 支持设置任务重复规则
 */
export interface Task {
  /** 唯一标识符 */
  id: string
  
  /** 任务标题 */
  title: string
  
  /** 任务备注 */
  notes?: string
  
  /** 所属项目 ID */
  projectId: string
  
  /** 父任务 ID（用于子任务） */
  parentId?: string
  
  /** 优先级 */
  priority: Priority
  
  /** 标签列表 */
  tags: string[]
  
  /** 截止日期 */
  dueDate?: Date
  
  /** 提醒时间列表 */
  reminders: Date[]
  
  /** 重复规则 */
  recurrence?: RecurrenceRule
  
  /** 完成状态 */
  completed: boolean
  
  /** 完成时间 */
  completedAt?: Date
  
  /** 创建时间 */
  createdAt: Date
  
  /** 最后修改时间 */
  updatedAt: Date
  
  /** 排序顺序 */
  order: number
}

/**
 * 项目
 * 
 * 验收标准：
 * - 需求 2.1: 支持创建、编辑、删除项目
 * - 需求 2.2: 要求输入项目名称
 * - 需求 2.3: 允许为项目设置颜色标识
 * - 需求 2.7: 提供"收件箱"作为默认项目
 */
export interface Project {
  /** 唯一标识符 */
  id: string
  
  /** 项目名称 */
  name: string
  
  /** 项目颜色 */
  color: string
  
  /** 是否为默认项目（收件箱） */
  isDefault: boolean
  
  /** 创建时间 */
  createdAt: Date
  
  /** 排序顺序 */
  order: number
}

/**
 * 标签
 * 
 * 验收标准：
 * - 需求 4.3: 允许为任务添加多个标签
 * - 需求 4.4: 支持创建、编辑、删除自定义标签
 */
export interface Tag {
  /** 标签名称（唯一） */
  name: string
  
  /** 标签颜色 */
  color: string
  
  /** 使用次数 */
  usageCount: number
}

/**
 * 重复规则
 * 
 * 验收标准：
 * - 需求 5.2: 支持每天、每周、每月、每年、自定义重复频率
 * - 需求 5.3: 每周重复时允许选择星期几
 * - 需求 5.4: 每月重复时允许选择日期或第几个星期几
 * - 需求 5.6: 允许设置重复任务的结束日期
 */
export interface RecurrenceRule {
  /** 重复频率 */
  frequency: RecurrenceFrequency
  
  /** 间隔（每 N 天/周/月/年） */
  interval: number
  
  /** 每周的哪几天（仅当 frequency 为 weekly 时）
   * 0-6, 0 为周日
   */
  daysOfWeek?: number[]
  
  /** 每月的第几天（仅当 frequency 为 monthly 时）
   * 1-31
   */
  dayOfMonth?: number
  
  /** 每月的第几个星期几（仅当 frequency 为 monthly 时）
   * week: 1-5（第几周）, day: 0-6（星期几）
   */
  weekOfMonth?: { week: number; day: number }
  
  /** 结束日期 */
  endDate?: Date
  
  /** 重复次数限制 */
  count?: number
}

/**
 * 应用设置
 * 
 * 验收标准：
 * - 需求 15.2: 允许选择默认视图
 * - 需求 15.3: 允许选择默认任务排序方式
 * - 需求 15.4: 允许设置是否自动删除已完成任务
 * - 需求 15.6: 允许设置任务完成时是否播放音效
 * - 需求 15.7: 允许选择主题模式
 * - 需求 15.8: 允许设置每周的第一天
 */
export interface AppSettings {
  /** 默认视图 */
  defaultView: ViewType
  
  /** 默认排序方式 */
  defaultSort: SortOption
  
  /** 主题模式 */
  themeMode: 'auto' | 'light' | 'dark'
  
  /** 是否启用提醒 */
  enableReminders: boolean
  
  /** 是否自动删除已完成任务 */
  autoDeleteCompleted: boolean
  
  /** 自动删除延迟天数 */
  autoDeleteDelay: number
  
  /** 是否播放完成音效 */
  playCompletionSound: boolean
  
  /** 每周第一天（0: 周日, 1: 周一） */
  weekStartsOn: 0 | 1
  
  /** 是否启用动画 */
  enableAnimations: boolean
}

// ============================================================================
// DTO 类型
// ============================================================================

/**
 * 创建任务 DTO
 * 
 * 用于创建新任务时传递的数据
 */
export interface CreateTaskDTO {
  /** 任务标题 */
  title: string
  
  /** 任务备注 */
  notes?: string
  
  /** 所属项目 ID */
  projectId?: string
  
  /** 父任务 ID */
  parentId?: string
  
  /** 优先级 */
  priority?: Priority
  
  /** 标签列表 */
  tags?: string[]
  
  /** 截止日期 */
  dueDate?: Date
  
  /** 提醒时间列表 */
  reminders?: Date[]
  
  /** 重复规则 */
  recurrence?: RecurrenceRule
}

/**
 * 创建项目 DTO
 * 
 * 用于创建新项目时传递的数据
 */
export interface CreateProjectDTO {
  /** 项目名称 */
  name: string
  
  /** 项目颜色 */
  color?: string
}

/**
 * 自然语言解析结果
 * 
 * 验收标准：
 * - 需求 7.1: 识别并设置截止日期
 * - 需求 7.3: 识别标签（# 符号）
 * - 需求 7.4: 识别优先级（@ 符号）
 * - 需求 7.6: 识别项目名称（! 符号）
 * - 需求 7.7: 从任务文本中移除已解析的标识符
 */
export interface ParseResult {
  /** 清理后的任务标题 */
  title: string
  
  /** 提取的截止日期 */
  dueDate?: Date
  
  /** 提取的标签 */
  tags: string[]
  
  /** 提取的优先级 */
  priority?: Priority
  
  /** 提取的项目名称 */
  projectName?: string
}

/**
 * 任务过滤器
 * 
 * 验收标准：
 * - 需求 8.5: 允许按优先级过滤任务
 * - 需求 8.6: 允许按标签过滤任务
 * - 需求 8.7: 允许按完成状态过滤任务
 * - 需求 8.8: 支持多条件组合过滤
 */
export interface TaskFilter {
  /** 项目 ID */
  projectId?: string
  
  /** 标签列表 */
  tags?: string[]
  
  /** 优先级列表 */
  priority?: Priority[]
  
  /** 完成状态 */
  completed?: boolean
  
  /** 截止日期范围 */
  dueDateRange?: { start?: Date; end?: Date }
}

/**
 * 导出数据
 * 
 * 验收标准：
 * - 需求 12.1: 支持将所有数据导出为 JSON 格式
 * - 需求 12.2: 生成包含所有任务、项目、标签的 JSON 文件
 */
export interface ExportData {
  /** 数据格式版本 */
  version: string
  
  /** 导出时间 */
  exportedAt: Date
  
  /** 任务列表 */
  tasks: Task[]
  
  /** 项目列表 */
  projects: Project[]
  
  /** 标签列表 */
  tags: Tag[]
  
  /** 设置 */
  settings: AppSettings
}
