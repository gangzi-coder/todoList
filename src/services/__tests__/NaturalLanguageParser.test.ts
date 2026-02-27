/**
 * NaturalLanguageParser 单元测试
 *
 * 测试自然语言解析器的各项功能：
 * - 时间词汇识别
 * - 标签识别
 * - 优先级识别
 * - 项目名称识别
 * - 文本清理
 * - 组合输入解析
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parse } from '../NaturalLanguageParser'
import { addDays, addMonths, startOfDay } from '../../utils/date'

describe('NaturalLanguageParser', () => {
  // 固定当前时间以确保测试稳定
  const NOW = new Date(2024, 5, 10, 12, 0, 0) // 2024-06-10 周一
  const TODAY = startOfDay(NOW)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('基本解析', () => {
    it('应返回纯文本作为标题', () => {
      const result = parse('买牛奶')
      expect(result.title).toBe('买牛奶')
      expect(result.tags).toEqual([])
      expect(result.dueDate).toBeUndefined()
      expect(result.priority).toBeUndefined()
      expect(result.projectName).toBeUndefined()
    })

    it('应处理空字符串', () => {
      const result = parse('')
      expect(result.title).toBe('')
      expect(result.tags).toEqual([])
    })

    it('应去除首尾空格', () => {
      const result = parse('  买牛奶  ')
      expect(result.title).toBe('买牛奶')
    })
  })

  describe('标签识别（# 符号）- 需求 7.3', () => {
    it('应识别单个标签', () => {
      const result = parse('买牛奶 #购物')
      expect(result.tags).toEqual(['购物'])
      expect(result.title).toBe('买牛奶')
    })

    it('应识别多个标签', () => {
      const result = parse('写报告 #工作 #重要')
      expect(result.tags).toEqual(['工作', '重要'])
      expect(result.title).toBe('写报告')
    })

    it('应识别英文标签', () => {
      const result = parse('review code #dev #frontend')
      expect(result.tags).toEqual(['dev', 'frontend'])
    })

    it('应识别包含数字和下划线的标签', () => {
      const result = parse('任务 #tag_1 #test2')
      expect(result.tags).toEqual(['tag_1', 'test2'])
    })
  })

  describe('优先级识别（@ 符号）- 需求 7.4, 7.5', () => {
    it('应识别 @高 为高优先级', () => {
      const result = parse('紧急任务 @高')
      expect(result.priority).toBe('high')
      expect(result.title).toBe('紧急任务')
    })

    it('应识别 @中 为中优先级', () => {
      const result = parse('普通任务 @中')
      expect(result.priority).toBe('medium')
    })

    it('应识别 @低 为低优先级', () => {
      const result = parse('不急的任务 @低')
      expect(result.priority).toBe('low')
    })

    it('不应识别无效的优先级', () => {
      const result = parse('任务 @其他')
      expect(result.priority).toBeUndefined()
    })
  })

  describe('项目名称识别（! 符号）- 需求 7.6', () => {
    it('应识别项目名称', () => {
      const result = parse('写文档 !工作')
      expect(result.projectName).toBe('工作')
      expect(result.title).toBe('写文档')
    })

    it('应识别英文项目名称', () => {
      const result = parse('fix bug !project1')
      expect(result.projectName).toBe('project1')
    })

    it('只取第一个项目名称', () => {
      const result = parse('任务 !项目A !项目B')
      expect(result.projectName).toBe('项目A')
    })
  })

  describe('时间词汇识别 - 需求 7.1, 7.2', () => {
    it('应识别"今天"', () => {
      const result = parse('今天买牛奶')
      expect(result.dueDate).toEqual(TODAY)
      expect(result.title).toBe('买牛奶')
    })

    it('应识别"明天"', () => {
      const result = parse('明天开会')
      expect(result.dueDate).toEqual(addDays(TODAY, 1))
      expect(result.title).toBe('开会')
    })

    it('应识别"后天"', () => {
      const result = parse('后天交报告')
      expect(result.dueDate).toEqual(addDays(TODAY, 2))
      expect(result.title).toBe('交报告')
    })

    it('应识别"下周"', () => {
      // 2024-06-10 是周一，下周一是 2024-06-17
      const result = parse('下周开会')
      expect(result.dueDate).toEqual(addDays(TODAY, 7))
      expect(result.title).toBe('开会')
    })

    it('应识别"下月"', () => {
      const result = parse('下月交租')
      expect(result.dueDate).toEqual(addMonths(TODAY, 1))
      expect(result.title).toBe('交租')
    })

    it('应识别"下个月"', () => {
      const result = parse('下个月交租')
      expect(result.dueDate).toEqual(addMonths(TODAY, 1))
      expect(result.title).toBe('交租')
    })

    it('应识别"周三"（本周三）', () => {
      // 2024-06-10 是周一，周三是 2024-06-12
      const result = parse('周三开会')
      expect(result.dueDate).toEqual(addDays(TODAY, 2))
      expect(result.title).toBe('开会')
    })

    it('应识别"周日"', () => {
      // 2024-06-10 是周一，周日是 2024-06-16
      const result = parse('周日休息')
      expect(result.dueDate).toEqual(addDays(TODAY, 6))
      expect(result.title).toBe('休息')
    })

    it('应识别"星期五"', () => {
      // 2024-06-10 是周一，星期五是 2024-06-14
      const result = parse('星期五聚餐')
      expect(result.dueDate).toEqual(addDays(TODAY, 4))
      expect(result.title).toBe('聚餐')
    })
  })

  describe('组合输入解析 - 需求 7.7', () => {
    it('应同时解析标签、优先级和日期', () => {
      const result = parse('明天写报告 #工作 @高')
      expect(result.title).toBe('写报告')
      expect(result.dueDate).toEqual(addDays(TODAY, 1))
      expect(result.tags).toEqual(['工作'])
      expect(result.priority).toBe('high')
    })

    it('应同时解析所有标识符', () => {
      const result = parse('今天买牛奶 #购物 #生活 @低 !个人')
      expect(result.title).toBe('买牛奶')
      expect(result.dueDate).toEqual(TODAY)
      expect(result.tags).toEqual(['购物', '生活'])
      expect(result.priority).toBe('low')
      expect(result.projectName).toBe('个人')
    })

    it('应正确清理标题中的多余空格', () => {
      const result = parse('  明天  写报告  #工作  @高  !项目  ')
      expect(result.title).toBe('写报告')
    })
  })
})
