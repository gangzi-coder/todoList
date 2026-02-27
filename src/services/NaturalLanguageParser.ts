/**
 * 自然语言解析器
 *
 * 解析用户输入的自然语言文本，提取任务属性（截止日期、标签、优先级、项目名称）
 *
 * 验收标准：
 * - 需求 7.1: 识别并设置截止日期
 * - 需求 7.2: 识别时间词汇：今天、明天、后天、下周、下月、周一到周日
 * - 需求 7.3: 识别标签（# 符号）
 * - 需求 7.4: 识别优先级（@ 符号）
 * - 需求 7.5: 识别 @高、@中、@低 作为优先级标识
 * - 需求 7.6: 识别项目名称（! 符号）
 * - 需求 7.7: 从任务文本中移除已解析的标识符
 */

import type { ParseResult, Priority } from '../types'
import { addDays, addMonths, startOfDay } from '../utils/date'

/**
 * 优先级映射表：中文关键词 → Priority 值
 */
const PRIORITY_MAP: Record<string, Priority> = {
  '高': 'high',
  '中': 'medium',
  '低': 'low',
}

/**
 * 星期映射表：中文星期 → getDay() 值 (0=周日, 1=周一, ..., 6=周六)
 */
const WEEKDAY_MAP: Record<string, number> = {
  '周一': 1,
  '周二': 2,
  '周三': 3,
  '周四': 4,
  '周五': 5,
  '周六': 6,
  '周日': 0,
  '星期一': 1,
  '星期二': 2,
  '星期三': 3,
  '星期四': 4,
  '星期五': 5,
  '星期六': 6,
  '星期日': 0,
  '星期天': 0,
}

/**
 * 解析用户输入的自然语言文本，提取任务属性
 * @param input 用户输入的原始文本
 * @returns ParseResult 解析结果
 */
export function parse(input: string): ParseResult {
  let text = input.trim()

  const tags = parseTags(text)
  text = removeTags(text)

  const priority = parsePriority(text)
  text = removePriority(text)

  const projectName = parseProjectName(text)
  text = removeProjectName(text)

  const dueDate = parseDueDate(text)
  text = removeDateTokens(text)

  // 清理多余空格
  const title = text.replace(/\s+/g, ' ').trim()

  const result: ParseResult = {
    title,
    tags,
  }

  if (dueDate) {
    result.dueDate = dueDate
  }

  if (priority) {
    result.priority = priority
  }

  if (projectName) {
    result.projectName = projectName
  }

  return result
}

// ============================================================================
// 标签解析（# 符号）
// ============================================================================

/**
 * 从文本中提取所有标签
 * @param text 输入文本
 * @returns 标签数组
 */
function parseTags(text: string): string[] {
  const tagRegex = /#([\u4e00-\u9fa5a-zA-Z0-9_]+)/g
  const tags: string[] = []
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(text)) !== null) {
    tags.push(match[1])
  }

  return tags
}

/**
 * 从文本中移除所有标签标识符
 */
function removeTags(text: string): string {
  return text.replace(/#[\u4e00-\u9fa5a-zA-Z0-9_]+/g, '')
}

// ============================================================================
// 优先级解析（@ 符号）
// ============================================================================

/**
 * 从文本中提取优先级
 * @param text 输入文本
 * @returns 优先级或 undefined
 */
function parsePriority(text: string): Priority | undefined {
  const priorityRegex = /@(高|中|低)/
  const match = text.match(priorityRegex)

  if (match) {
    return PRIORITY_MAP[match[1]]
  }

  return undefined
}

/**
 * 从文本中移除优先级标识符
 */
function removePriority(text: string): string {
  return text.replace(/@(高|中|低)/g, '')
}

// ============================================================================
// 项目名称解析（! 符号）
// ============================================================================

/**
 * 从文本中提取项目名称
 * @param text 输入文本
 * @returns 项目名称或 undefined
 */
function parseProjectName(text: string): string | undefined {
  const projectRegex = /!([\u4e00-\u9fa5a-zA-Z0-9_]+)/
  const match = text.match(projectRegex)

  if (match) {
    return match[1]
  }

  return undefined
}

/**
 * 从文本中移除项目名称标识符
 */
function removeProjectName(text: string): string {
  return text.replace(/![\u4e00-\u9fa5a-zA-Z0-9_]+/g, '')
}

// ============================================================================
// 日期解析（时间词汇）
// ============================================================================

/**
 * 从文本中提取截止日期
 * @param text 输入文本
 * @returns 日期对象或 undefined
 */
function parseDueDate(text: string): Date | undefined {
  const today = startOfDay(new Date())

  // 今天
  if (/今天/.test(text)) {
    return today
  }

  // 明天
  if (/明天/.test(text)) {
    return addDays(today, 1)
  }

  // 后天
  if (/后天/.test(text)) {
    return addDays(today, 2)
  }

  // 下周（不跟具体星期几时，默认下周一）
  // 注意：需要排除"下周X"（如下周一、下周二）的情况，这些由星期匹配处理
  if (/下周/.test(text) && !/下周[一二三四五六日天]/.test(text)) {
    const currentDay = today.getDay()
    // 下周一
    const daysUntilNextMonday = ((1 - currentDay + 7) % 7) || 7
    return addDays(today, daysUntilNextMonday)
  }

  // 下月
  if (/下月/.test(text) || /下个月/.test(text)) {
    return addMonths(today, 1)
  }

  // 周一到周日 / 星期一到星期天
  for (const [keyword, dayOfWeek] of Object.entries(WEEKDAY_MAP)) {
    if (text.includes(keyword)) {
      const currentDay = today.getDay()
      let daysToAdd = dayOfWeek - currentDay
      if (daysToAdd <= 0) {
        daysToAdd += 7
      }
      return addDays(today, daysToAdd)
    }
  }

  return undefined
}

/**
 * 从文本中移除日期相关的时间词汇
 */
function removeDateTokens(text: string): string {
  // 移除时间词汇，按长度从长到短匹配避免部分匹配问题
  const datePatterns = [
    /星期天/g,
    /星期一/g,
    /星期二/g,
    /星期三/g,
    /星期四/g,
    /星期五/g,
    /星期六/g,
    /星期日/g,
    /下个月/g,
    /后天/g,
    /明天/g,
    /今天/g,
    /下周/g,
    /下月/g,
    /周一/g,
    /周二/g,
    /周三/g,
    /周四/g,
    /周五/g,
    /周六/g,
    /周日/g,
  ]

  let result = text
  for (const pattern of datePatterns) {
    result = result.replace(pattern, '')
  }

  return result
}

export default { parse }
