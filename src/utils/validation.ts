/**
 * 输入验证工具
 * 
 * 用于验证用户输入的数据，确保数据符合业务规则
 * 
 * 验收标准：
 * - 需求 18.1: 验证任务标题非空
 * - 需求 18.2: 限制任务标题最多 200 个字符
 * - 需求 18.3: 限制任务备注最多 500 个字符
 * - 需求 18.4: 限制项目名称最多 50 个字符
 * - 需求 18.5: 限制标签名称最多 20 个字符
 */

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean
  /** 错误消息（验证失败时） */
  error?: string
  /** 剩余字符数（用于长度验证） */
  remaining?: number
}

/**
 * 验证任务标题
 * 
 * 规则：
 * - 不能为空
 * - 不能只包含空白字符
 * - 长度不能超过 200 个字符
 * 
 * @param title 任务标题
 * @returns 验证结果
 */
export function validateTaskTitle(title: string): ValidationResult {
  // 检查是否为空或只包含空白字符
  if (!title || title.trim().length === 0) {
    return {
      valid: false,
      error: '任务标题不能为空'
    }
  }

  // 检查长度限制
  const maxLength = 200
  if (title.length > maxLength) {
    return {
      valid: false,
      error: `任务标题不能超过 ${maxLength} 个字符`,
      remaining: maxLength - title.length
    }
  }

  return {
    valid: true,
    remaining: maxLength - title.length
  }
}

/**
 * 验证任务备注
 * 
 * 规则：
 * - 可以为空
 * - 长度不能超过 500 个字符
 * 
 * @param notes 任务备注
 * @returns 验证结果
 */
export function validateTaskNotes(notes: string | undefined): ValidationResult {
  // 备注可以为空
  if (!notes) {
    return {
      valid: true,
      remaining: 500
    }
  }

  // 检查长度限制
  const maxLength = 500
  if (notes.length > maxLength) {
    return {
      valid: false,
      error: `任务备注不能超过 ${maxLength} 个字符`,
      remaining: maxLength - notes.length
    }
  }

  return {
    valid: true,
    remaining: maxLength - notes.length
  }
}

/**
 * 验证项目名称
 * 
 * 规则：
 * - 不能为空
 * - 不能只包含空白字符
 * - 长度不能超过 50 个字符
 * 
 * @param name 项目名称
 * @returns 验证结果
 */
export function validateProjectName(name: string): ValidationResult {
  // 检查是否为空或只包含空白字符
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: '项目名称不能为空'
    }
  }

  // 检查长度限制
  const maxLength = 50
  if (name.length > maxLength) {
    return {
      valid: false,
      error: `项目名称不能超过 ${maxLength} 个字符`,
      remaining: maxLength - name.length
    }
  }

  return {
    valid: true,
    remaining: maxLength - name.length
  }
}

/**
 * 验证标签名称
 * 
 * 规则：
 * - 不能为空
 * - 不能只包含空白字符
 * - 长度不能超过 20 个字符
 * - 不能包含特殊字符（只允许字母、数字、中文、下划线、连字符）
 * 
 * @param name 标签名称
 * @returns 验证结果
 */
export function validateTagName(name: string): ValidationResult {
  // 检查是否为空或只包含空白字符
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      error: '标签名称不能为空'
    }
  }

  // 检查长度限制
  const maxLength = 20
  if (name.length > maxLength) {
    return {
      valid: false,
      error: `标签名称不能超过 ${maxLength} 个字符`,
      remaining: maxLength - name.length
    }
  }

  // 检查是否包含非法字符
  // 允许：字母、数字、中文、下划线、连字符
  const validPattern = /^[\w\u4e00-\u9fa5-]+$/
  if (!validPattern.test(name)) {
    return {
      valid: false,
      error: '标签名称只能包含字母、数字、中文、下划线和连字符'
    }
  }

  return {
    valid: true,
    remaining: maxLength - name.length
  }
}

/**
 * 验证截止日期
 * 
 * 规则：
 * - 可以为空
 * - 如果早于当前日期，返回警告（但仍然有效）
 * 
 * @param dueDate 截止日期
 * @returns 验证结果
 */
export function validateDueDate(dueDate: Date | undefined): ValidationResult {
  // 截止日期可以为空
  if (!dueDate) {
    return {
      valid: true
    }
  }

  // 检查是否为有效日期
  if (!(dueDate instanceof Date) || isNaN(dueDate.getTime())) {
    return {
      valid: false,
      error: '截止日期格式无效'
    }
  }

  // 如果早于当前日期，返回警告
  const now = new Date()
  now.setHours(0, 0, 0, 0) // 重置到当天开始
  
  const dueDateOnly = new Date(dueDate)
  dueDateOnly.setHours(0, 0, 0, 0)
  
  if (dueDateOnly < now) {
    return {
      valid: true,
      error: '警告：截止日期早于当前日期'
    }
  }

  return {
    valid: true
  }
}

/**
 * 获取剩余字符数提示文本
 * 
 * @param current 当前字符数
 * @param max 最大字符数
 * @returns 提示文本
 */
export function getRemainingCharsText(current: number, max: number): string {
  const remaining = max - current
  
  if (remaining < 0) {
    return `超出 ${Math.abs(remaining)} 个字符`
  }
  
  if (remaining <= 20) {
    return `还可输入 ${remaining} 个字符`
  }
  
  return `${current}/${max}`
}

/**
 * 批量验证任务数据
 * 
 * @param data 任务数据
 * @returns 验证结果，包含所有字段的验证信息
 */
export function validateTaskData(data: {
  title: string
  notes?: string
  dueDate?: Date
}): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  // 验证标题
  const titleResult = validateTaskTitle(data.title)
  if (!titleResult.valid && titleResult.error) {
    errors.title = titleResult.error
  }

  // 验证备注
  const notesResult = validateTaskNotes(data.notes)
  if (!notesResult.valid && notesResult.error) {
    errors.notes = notesResult.error
  }

  // 验证截止日期
  const dueDateResult = validateDueDate(data.dueDate)
  if (!dueDateResult.valid && dueDateResult.error) {
    errors.dueDate = dueDateResult.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * 批量验证项目数据
 * 
 * @param data 项目数据
 * @returns 验证结果
 */
export function validateProjectData(data: {
  name: string
}): {
  valid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}

  // 验证名称
  const nameResult = validateProjectName(data.name)
  if (!nameResult.valid && nameResult.error) {
    errors.name = nameResult.error
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
