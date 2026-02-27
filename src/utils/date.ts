/**
 * 日期工具函数
 * 
 * 提供日期格式化、比较和计算功能，支持任务截止日期和重复任务的日期计算
 * 
 * 验收标准：
 * - 需求 4.5: 允许为任务设置截止日期和时间
 * - 需求 4.6: 任务截止日期临近时使用醒目颜色标识
 * - 需求 4.7: 任务已过期时显示"已过期"标识
 * - 需求 5.5: 完成重复任务时根据重复规则自动创建下一次任务
 */

import type { RecurrenceRule } from '../types'

// ============================================================================
// 日期格式化函数
// ============================================================================

/**
 * 格式化日期为本地化字符串
 * @param date 日期对象
 * @param format 格式类型：'full' | 'date' | 'time' | 'relative'
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date,
  format: 'full' | 'date' | 'time' | 'relative' = 'date'
): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return ''
  }

  switch (format) {
    case 'full':
      // 完整日期时间：2024-01-15 14:30
      return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
    
    case 'date':
      // 仅日期：2024-01-15
      return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`
    
    case 'time':
      // 仅时间：14:30
      return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`
    
    case 'relative':
      // 相对时间：今天、明天、1月15日
      return formatRelativeDate(date)
    
    default:
      return formatDate(date, 'date')
  }
}

/**
 * 格式化相对日期（今天、明天、具体日期）
 * @param date 日期对象
 * @returns 相对日期字符串
 */
export function formatRelativeDate(date: Date): string {
  const today = startOfDay(new Date())
  const targetDay = startOfDay(date)
  const diffDays = Math.floor((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '明天'
  if (diffDays === -1) return '昨天'
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}天后`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}天前`

  // 超过一周，显示具体日期
  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()
  const currentYear = new Date().getFullYear()

  // 同一年不显示年份
  if (year === currentYear) {
    return `${month}月${day}日`
  }
  return `${year}年${month}月${day}日`
}

/**
 * 补零函数（将个位数补零）
 * @param num 数字
 * @returns 补零后的字符串
 */
function padZero(num: number): string {
  return num.toString().padStart(2, '0')
}

// ============================================================================
// 日期比较函数
// ============================================================================

/**
 * 判断日期是否为今天
 * @param date 日期对象
 * @returns 是否为今天
 */
export function isToday(date: Date): boolean {
  const today = startOfDay(new Date())
  const targetDay = startOfDay(date)
  return today.getTime() === targetDay.getTime()
}

/**
 * 判断日期是否已过期（早于今天）
 * @param date 日期对象
 * @returns 是否已过期
 */
export function isOverdue(date: Date): boolean {
  const today = startOfDay(new Date())
  const targetDay = startOfDay(date)
  return targetDay.getTime() < today.getTime()
}

/**
 * 判断日期是否即将到来（未来 7 天内）
 * @param date 日期对象
 * @returns 是否即将到来
 */
export function isUpcoming(date: Date): boolean {
  const today = startOfDay(new Date())
  const targetDay = startOfDay(date)
  const diffDays = Math.floor((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 0 && diffDays <= 7
}

/**
 * 判断日期是否在指定范围内
 * @param date 日期对象
 * @param start 开始日期（可选）
 * @param end 结束日期（可选）
 * @returns 是否在范围内
 */
export function isInRange(date: Date, start?: Date, end?: Date): boolean {
  const targetTime = date.getTime()
  
  if (start && targetTime < start.getTime()) {
    return false
  }
  
  if (end && targetTime > end.getTime()) {
    return false
  }
  
  return true
}

// ============================================================================
// 日期计算函数
// ============================================================================

/**
 * 获取一天的开始时间（00:00:00）
 * @param date 日期对象
 * @returns 当天开始时间
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * 获取一天的结束时间（23:59:59）
 * @param date 日期对象
 * @returns 当天结束时间
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * 添加天数
 * @param date 日期对象
 * @param days 要添加的天数（可以为负数）
 * @returns 新的日期对象
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * 添加周数
 * @param date 日期对象
 * @param weeks 要添加的周数
 * @returns 新的日期对象
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

/**
 * 添加月数
 * @param date 日期对象
 * @param months 要添加的月数
 * @returns 新的日期对象
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * 添加年数
 * @param date 日期对象
 * @param years 要添加的年数
 * @returns 新的日期对象
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

// ============================================================================
// 重复任务日期计算
// ============================================================================

/**
 * 根据重复规则计算下次任务日期
 * @param currentDate 当前任务日期
 * @param rule 重复规则
 * @returns 下次任务日期，如果已达到结束条件则返回 null
 */
export function calculateNextRecurrence(
  currentDate: Date,
  rule: RecurrenceRule
): Date | null {
  // 检查是否已达到结束日期
  if (rule.endDate && currentDate >= rule.endDate) {
    return null
  }

  let nextDate: Date

  switch (rule.frequency) {
    case 'daily':
      nextDate = addDays(currentDate, rule.interval)
      break

    case 'weekly':
      nextDate = calculateNextWeeklyRecurrence(currentDate, rule)
      break

    case 'monthly':
      nextDate = calculateNextMonthlyRecurrence(currentDate, rule)
      break

    case 'yearly':
      nextDate = addYears(currentDate, rule.interval)
      break

    case 'custom':
      // 自定义频率，默认按天计算
      nextDate = addDays(currentDate, rule.interval)
      break

    default:
      nextDate = addDays(currentDate, 1)
  }

  // 再次检查结束日期
  if (rule.endDate && nextDate > rule.endDate) {
    return null
  }

  return nextDate
}

/**
 * 计算每周重复的下次日期
 * @param currentDate 当前日期
 * @param rule 重复规则
 * @returns 下次日期
 */
function calculateNextWeeklyRecurrence(
  currentDate: Date,
  rule: RecurrenceRule
): Date {
  if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) {
    // 如果没有指定星期几，默认按当前星期几重复
    return addWeeks(currentDate, rule.interval)
  }

  // 排序星期几（0-6）
  const sortedDays = [...rule.daysOfWeek].sort((a, b) => a - b)
  const currentDay = currentDate.getDay()

  // 查找当前周内的下一个重复日
  const nextDayInWeek = sortedDays.find(day => day > currentDay)

  if (nextDayInWeek !== undefined) {
    // 在当前周内找到下一个重复日
    const daysToAdd = nextDayInWeek - currentDay
    return addDays(currentDate, daysToAdd)
  } else {
    // 当前周没有更多重复日，跳到下一个周期的第一个重复日
    const firstDay = sortedDays[0]
    const daysToAdd = (7 - currentDay + firstDay) + (rule.interval - 1) * 7
    return addDays(currentDate, daysToAdd)
  }
}

/**
 * 计算每月重复的下次日期
 * @param currentDate 当前日期
 * @param rule 重复规则
 * @returns 下次日期
 */
function calculateNextMonthlyRecurrence(
  currentDate: Date,
  rule: RecurrenceRule
): Date {
  if (rule.dayOfMonth !== undefined) {
    // 按每月的第几天重复
    return calculateNextMonthlyByDay(currentDate, rule.dayOfMonth, rule.interval)
  } else if (rule.weekOfMonth) {
    // 按每月的第几个星期几重复
    return calculateNextMonthlyByWeekday(
      currentDate,
      rule.weekOfMonth.week,
      rule.weekOfMonth.day,
      rule.interval
    )
  } else {
    // 默认按当前日期重复
    return addMonths(currentDate, rule.interval)
  }
}

/**
 * 按每月的第几天计算下次日期
 * @param currentDate 当前日期
 * @param dayOfMonth 每月的第几天（1-31）
 * @param interval 间隔月数
 * @returns 下次日期
 */
function calculateNextMonthlyByDay(
  currentDate: Date,
  dayOfMonth: number,
  interval: number
): Date {
  // 先设置为1号，避免日期溢出问题
  const result = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  
  // 加上月份间隔
  result.setMonth(result.getMonth() + interval)
  
  // 获取目标月份的年和月
  const targetYear = result.getFullYear()
  const targetMonth = result.getMonth()
  
  // 获取该月的最后一天
  const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
  
  // 设置为指定日期或该月最后一天（取较小值）
  result.setDate(Math.min(dayOfMonth, lastDayOfMonth))
  
  return result
}

/**
 * 按每月的第几个星期几计算下次日期
 * @param currentDate 当前日期
 * @param week 第几周（1-5）
 * @param day 星期几（0-6）
 * @param interval 间隔月数
 * @returns 下次日期
 */
function calculateNextMonthlyByWeekday(
  currentDate: Date,
  week: number,
  day: number,
  interval: number
): Date {
  const nextMonth = addMonths(currentDate, interval)
  const year = nextMonth.getFullYear()
  const month = nextMonth.getMonth()
  
  // 找到该月第一天
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  
  // 计算第一个目标星期几的日期
  let targetDate = 1 + ((day - firstDayOfWeek + 7) % 7)
  
  // 加上周数偏移
  targetDate += (week - 1) * 7
  
  const result = new Date(year, month, targetDate)
  
  // 检查是否超出该月范围
  if (result.getMonth() !== month) {
    // 如果超出，返回该月最后一个目标星期几
    const lastDay = new Date(year, month + 1, 0)
    const lastDayOfWeek = lastDay.getDay()
    const daysBack = (lastDayOfWeek - day + 7) % 7
    return new Date(year, month, lastDay.getDate() - daysBack)
  }
  
  return result
}

/**
 * 获取两个日期之间的天数差
 * @param date1 日期1
 * @param date2 日期2
 * @returns 天数差（date2 - date1）
 */
export function daysBetween(date1: Date, date2: Date): number {
  const day1 = startOfDay(date1)
  const day2 = startOfDay(date2)
  return Math.floor((day2.getTime() - day1.getTime()) / (1000 * 60 * 60 * 24))
}
