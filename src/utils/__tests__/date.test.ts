/**
 * 日期工具函数单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatDate,
  formatRelativeDate,
  isToday,
  isOverdue,
  isUpcoming,
  isInRange,
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  calculateNextRecurrence,
  daysBetween
} from '../date'
import type { RecurrenceRule } from '../../types'

describe('日期格式化函数', () => {
  it('应该格式化完整日期时间', () => {
    const date = new Date(2024, 0, 15, 14, 30, 0)
    expect(formatDate(date, 'full')).toBe('2024-01-15 14:30')
  })

  it('应该格式化仅日期', () => {
    const date = new Date(2024, 0, 15, 14, 30, 0)
    expect(formatDate(date, 'date')).toBe('2024-01-15')
  })

  it('应该格式化仅时间', () => {
    const date = new Date(2024, 0, 15, 14, 30, 0)
    expect(formatDate(date, 'time')).toBe('14:30')
  })

  it('应该处理个位数月份和日期', () => {
    const date = new Date(2024, 0, 5, 9, 5, 0)
    expect(formatDate(date, 'full')).toBe('2024-01-05 09:05')
  })

  it('应该处理无效日期', () => {
    const invalidDate = new Date('invalid')
    expect(formatDate(invalidDate)).toBe('')
  })

  it('应该格式化相对日期 - 今天', () => {
    const today = new Date()
    expect(formatRelativeDate(today)).toBe('今天')
  })

  it('应该格式化相对日期 - 明天', () => {
    const tomorrow = addDays(new Date(), 1)
    expect(formatRelativeDate(tomorrow)).toBe('明天')
  })

  it('应该格式化相对日期 - 昨天', () => {
    const yesterday = addDays(new Date(), -1)
    expect(formatRelativeDate(yesterday)).toBe('昨天')
  })

  it('应该格式化相对日期 - 几天后', () => {
    const future = addDays(new Date(), 3)
    expect(formatRelativeDate(future)).toBe('3天后')
  })

  it('应该格式化相对日期 - 具体日期', () => {
    const date = new Date(2024, 5, 15) // 6月15日
    const result = formatRelativeDate(date)
    expect(result).toMatch(/6月15日/)
  })
})

describe('日期比较函数', () => {
  it('应该正确判断是否为今天', () => {
    const today = new Date()
    const todayMorning = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0)
    const todayEvening = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 20, 0)
    
    expect(isToday(today)).toBe(true)
    expect(isToday(todayMorning)).toBe(true)
    expect(isToday(todayEvening)).toBe(true)
    expect(isToday(addDays(today, 1))).toBe(false)
    expect(isToday(addDays(today, -1))).toBe(false)
  })

  it('应该正确判断是否已过期', () => {
    const today = new Date()
    const yesterday = addDays(today, -1)
    const tomorrow = addDays(today, 1)
    
    expect(isOverdue(yesterday)).toBe(true)
    expect(isOverdue(today)).toBe(false)
    expect(isOverdue(tomorrow)).toBe(false)
  })

  it('应该正确判断是否即将到来', () => {
    const today = new Date()
    
    expect(isUpcoming(today)).toBe(true)
    expect(isUpcoming(addDays(today, 3))).toBe(true)
    expect(isUpcoming(addDays(today, 7))).toBe(true)
    expect(isUpcoming(addDays(today, 8))).toBe(false)
    expect(isUpcoming(addDays(today, -1))).toBe(false)
  })

  it('应该正确判断日期是否在范围内', () => {
    const date = new Date(2024, 0, 15)
    const start = new Date(2024, 0, 10)
    const end = new Date(2024, 0, 20)
    
    expect(isInRange(date, start, end)).toBe(true)
    expect(isInRange(date, start)).toBe(true)
    expect(isInRange(date, undefined, end)).toBe(true)
    expect(isInRange(date, new Date(2024, 0, 16), end)).toBe(false)
    expect(isInRange(date, start, new Date(2024, 0, 14))).toBe(false)
  })
})

describe('日期计算函数', () => {
  it('应该获取一天的开始时间', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45, 123)
    const start = startOfDay(date)
    
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getMilliseconds()).toBe(0)
  })

  it('应该获取一天的结束时间', () => {
    const date = new Date(2024, 0, 15, 14, 30, 45, 123)
    const end = endOfDay(date)
    
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getSeconds()).toBe(59)
    expect(end.getMilliseconds()).toBe(999)
  })

  it('应该正确添加天数', () => {
    const date = new Date(2024, 0, 15)
    const future = addDays(date, 5)
    const past = addDays(date, -5)
    
    expect(future.getDate()).toBe(20)
    expect(past.getDate()).toBe(10)
  })

  it('应该正确添加周数', () => {
    const date = new Date(2024, 0, 15)
    const future = addWeeks(date, 2)
    
    expect(future.getDate()).toBe(29)
  })

  it('应该正确添加月数', () => {
    const date = new Date(2024, 0, 15)
    const future = addMonths(date, 2)
    
    expect(future.getMonth()).toBe(2) // 3月
    expect(future.getDate()).toBe(15)
  })

  it('应该正确添加年数', () => {
    const date = new Date(2024, 0, 15)
    const future = addYears(date, 2)
    
    expect(future.getFullYear()).toBe(2026)
    expect(future.getMonth()).toBe(0)
    expect(future.getDate()).toBe(15)
  })

  it('应该计算两个日期之间的天数差', () => {
    const date1 = new Date(2024, 0, 15)
    const date2 = new Date(2024, 0, 20)
    
    expect(daysBetween(date1, date2)).toBe(5)
    expect(daysBetween(date2, date1)).toBe(-5)
  })
})

describe('重复任务日期计算', () => {
  it('应该计算每天重复的下次日期', () => {
    const currentDate = new Date(2024, 0, 15)
    const rule: RecurrenceRule = {
      frequency: 'daily',
      interval: 1
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).not.toBeNull()
    expect(nextDate!.getDate()).toBe(16)
  })

  it('应该计算每2天重复的下次日期', () => {
    const currentDate = new Date(2024, 0, 15)
    const rule: RecurrenceRule = {
      frequency: 'daily',
      interval: 2
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).not.toBeNull()
    expect(nextDate!.getDate()).toBe(17)
  })

  it('应该计算每周重复的下次日期', () => {
    const currentDate = new Date(2024, 0, 15) // 周一
    const rule: RecurrenceRule = {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [1] // 周一
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).not.toBeNull()
    expect(nextDate!.getDate()).toBe(22) // 下周一
  })

  it('应该计算每周多天重复的下次日期', () => {
    const currentDate = new Date(2024, 0, 15) // 周一
    const rule: RecurrenceRule = {
      frequency: 'weekly',
      interval: 1,
      daysOfWeek: [1, 3, 5] // 周一、周三、周五
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).not.toBeNull()
    expect(nextDate!.getDay()).toBe(3) // 周三
  })

  it('应该计算每月重复的下次日期', () => {
    const currentDate = new Date(2024, 0, 15)
    const rule: RecurrenceRule = {
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 15
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).not.toBeNull()
    expect(nextDate!.getMonth()).toBe(1) // 2月
    expect(nextDate!.getDate()).toBe(15)
  })

  it('应该处理月份天数不足的情况', () => {
    const currentDate = new Date(2024, 0, 31) // 1月31日
    const rule: RecurrenceRule = {
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 31
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).not.toBeNull()
    expect(nextDate!.getMonth()).toBe(1) // 2月
    expect(nextDate!.getDate()).toBe(29) // 2024年是闰年，2月有29天
  })

  it('应该计算每月第几个星期几的下次日期', () => {
    const currentDate = new Date(2024, 0, 15) // 2024年1月15日（第三个周一）
    const rule: RecurrenceRule = {
      frequency: 'monthly',
      interval: 1,
      weekOfMonth: { week: 3, day: 1 } // 第三个周一
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).not.toBeNull()
    expect(nextDate!.getMonth()).toBe(1) // 2月
    expect(nextDate!.getDay()).toBe(1) // 周一
  })

  it('应该计算每年重复的下次日期', () => {
    const currentDate = new Date(2024, 0, 15)
    const rule: RecurrenceRule = {
      frequency: 'yearly',
      interval: 1
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).not.toBeNull()
    expect(nextDate!.getFullYear()).toBe(2025)
    expect(nextDate!.getMonth()).toBe(0)
    expect(nextDate!.getDate()).toBe(15)
  })

  it('应该在达到结束日期时返回 null', () => {
    const currentDate = new Date(2024, 0, 15)
    const rule: RecurrenceRule = {
      frequency: 'daily',
      interval: 1,
      endDate: new Date(2024, 0, 15)
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).toBeNull()
  })

  it('应该在超过结束日期时返回 null', () => {
    const currentDate = new Date(2024, 0, 15)
    const rule: RecurrenceRule = {
      frequency: 'daily',
      interval: 1,
      endDate: new Date(2024, 0, 14)
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).toBeNull()
  })

  it('应该在下次日期超过结束日期时返回 null', () => {
    const currentDate = new Date(2024, 0, 15)
    const rule: RecurrenceRule = {
      frequency: 'daily',
      interval: 5,
      endDate: new Date(2024, 0, 18)
    }
    
    const nextDate = calculateNextRecurrence(currentDate, rule)
    expect(nextDate).toBeNull()
  })
})
