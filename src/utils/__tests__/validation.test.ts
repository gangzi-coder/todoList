/**
 * 输入验证工具单元测试
 */

import { describe, it, expect } from 'vitest'
import {
  validateTaskTitle,
  validateTaskNotes,
  validateProjectName,
  validateTagName,
  validateDueDate,
  getRemainingCharsText,
  validateTaskData,
  validateProjectData
} from '../validation'

describe('validateTaskTitle', () => {
  it('应该拒绝空字符串', () => {
    const result = validateTaskTitle('')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('任务标题不能为空')
  })

  it('应该拒绝只包含空白字符的字符串', () => {
    const result = validateTaskTitle('   ')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('任务标题不能为空')
  })

  it('应该接受有效的标题', () => {
    const result = validateTaskTitle('完成项目文档')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.remaining).toBe(200 - '完成项目文档'.length)
  })

  it('应该拒绝超过 200 个字符的标题', () => {
    const longTitle = 'a'.repeat(201)
    const result = validateTaskTitle(longTitle)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('不能超过 200 个字符')
    expect(result.remaining).toBe(-1)
  })

  it('应该接受正好 200 个字符的标题', () => {
    const title = 'a'.repeat(200)
    const result = validateTaskTitle(title)
    expect(result.valid).toBe(true)
    expect(result.remaining).toBe(0)
  })
})

describe('validateTaskNotes', () => {
  it('应该接受空备注', () => {
    const result = validateTaskNotes(undefined)
    expect(result.valid).toBe(true)
    expect(result.remaining).toBe(500)
  })

  it('应该接受空字符串备注', () => {
    const result = validateTaskNotes('')
    expect(result.valid).toBe(true)
    expect(result.remaining).toBe(500)
  })

  it('应该接受有效的备注', () => {
    const notes = '这是一个详细的任务备注'
    const result = validateTaskNotes(notes)
    expect(result.valid).toBe(true)
    expect(result.remaining).toBe(500 - notes.length)
  })

  it('应该拒绝超过 500 个字符的备注', () => {
    const longNotes = 'a'.repeat(501)
    const result = validateTaskNotes(longNotes)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('不能超过 500 个字符')
    expect(result.remaining).toBe(-1)
  })

  it('应该接受正好 500 个字符的备注', () => {
    const notes = 'a'.repeat(500)
    const result = validateTaskNotes(notes)
    expect(result.valid).toBe(true)
    expect(result.remaining).toBe(0)
  })
})

describe('validateProjectName', () => {
  it('应该拒绝空字符串', () => {
    const result = validateProjectName('')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('项目名称不能为空')
  })

  it('应该拒绝只包含空白字符的字符串', () => {
    const result = validateProjectName('   ')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('项目名称不能为空')
  })

  it('应该接受有效的项目名称', () => {
    const result = validateProjectName('工作项目')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.remaining).toBe(50 - '工作项目'.length)
  })

  it('应该拒绝超过 50 个字符的项目名称', () => {
    const longName = 'a'.repeat(51)
    const result = validateProjectName(longName)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('不能超过 50 个字符')
    expect(result.remaining).toBe(-1)
  })

  it('应该接受正好 50 个字符的项目名称', () => {
    const name = 'a'.repeat(50)
    const result = validateProjectName(name)
    expect(result.valid).toBe(true)
    expect(result.remaining).toBe(0)
  })
})

describe('validateTagName', () => {
  it('应该拒绝空字符串', () => {
    const result = validateTagName('')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('标签名称不能为空')
  })

  it('应该拒绝只包含空白字符的字符串', () => {
    const result = validateTagName('   ')
    expect(result.valid).toBe(false)
    expect(result.error).toBe('标签名称不能为空')
  })

  it('应该接受有效的标签名称（中文）', () => {
    const result = validateTagName('工作')
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(result.remaining).toBe(20 - '工作'.length)
  })

  it('应该接受有效的标签名称（英文）', () => {
    const result = validateTagName('work')
    expect(result.valid).toBe(true)
    expect(result.remaining).toBe(20 - 'work'.length)
  })

  it('应该接受包含下划线和连字符的标签名称', () => {
    const result1 = validateTagName('work_task')
    expect(result1.valid).toBe(true)

    const result2 = validateTagName('work-task')
    expect(result2.valid).toBe(true)
  })

  it('应该接受包含数字的标签名称', () => {
    const result = validateTagName('task123')
    expect(result.valid).toBe(true)
  })

  it('应该拒绝包含特殊字符的标签名称', () => {
    const result1 = validateTagName('work@task')
    expect(result1.valid).toBe(false)
    expect(result1.error).toContain('只能包含')

    const result2 = validateTagName('work#task')
    expect(result2.valid).toBe(false)

    const result3 = validateTagName('work task')
    expect(result3.valid).toBe(false)
  })

  it('应该拒绝超过 20 个字符的标签名称', () => {
    const longName = 'a'.repeat(21)
    const result = validateTagName(longName)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('不能超过 20 个字符')
    expect(result.remaining).toBe(-1)
  })

  it('应该接受正好 20 个字符的标签名称', () => {
    const name = 'a'.repeat(20)
    const result = validateTagName(name)
    expect(result.valid).toBe(true)
    expect(result.remaining).toBe(0)
  })
})

describe('validateDueDate', () => {
  it('应该接受空日期', () => {
    const result = validateDueDate(undefined)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('应该接受未来的日期', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const result = validateDueDate(futureDate)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('应该接受今天的日期', () => {
    const today = new Date()
    const result = validateDueDate(today)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('应该对过去的日期返回警告', () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 7)
    const result = validateDueDate(pastDate)
    expect(result.valid).toBe(true)
    expect(result.error).toContain('警告')
  })

  it('应该拒绝无效的日期', () => {
    const invalidDate = new Date('invalid')
    const result = validateDueDate(invalidDate)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('格式无效')
  })
})

describe('getRemainingCharsText', () => {
  it('应该显示剩余字符数（剩余较多时）', () => {
    const text = getRemainingCharsText(50, 200)
    expect(text).toBe('50/200')
  })

  it('应该显示详细提示（剩余较少时）', () => {
    const text = getRemainingCharsText(195, 200)
    expect(text).toBe('还可输入 5 个字符')
  })

  it('应该显示超出字符数', () => {
    const text = getRemainingCharsText(205, 200)
    expect(text).toBe('超出 5 个字符')
  })

  it('应该正确处理正好达到限制的情况', () => {
    const text = getRemainingCharsText(200, 200)
    expect(text).toBe('还可输入 0 个字符')
  })
})

describe('validateTaskData', () => {
  it('应该验证有效的任务数据', () => {
    const result = validateTaskData({
      title: '完成项目文档',
      notes: '详细的备注信息',
      dueDate: new Date('2025-12-31')
    })
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })

  it('应该检测标题错误', () => {
    const result = validateTaskData({
      title: '',
      notes: '备注'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeDefined()
  })

  it('应该检测备注错误', () => {
    const result = validateTaskData({
      title: '任务标题',
      notes: 'a'.repeat(501)
    })
    expect(result.valid).toBe(false)
    expect(result.errors.notes).toBeDefined()
  })

  it('应该检测多个错误', () => {
    const result = validateTaskData({
      title: '',
      notes: 'a'.repeat(501)
    })
    expect(result.valid).toBe(false)
    expect(result.errors.title).toBeDefined()
    expect(result.errors.notes).toBeDefined()
  })

  it('应该接受最小有效数据', () => {
    const result = validateTaskData({
      title: '任务'
    })
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })
})

describe('validateProjectData', () => {
  it('应该验证有效的项目数据', () => {
    const result = validateProjectData({
      name: '工作项目'
    })
    expect(result.valid).toBe(true)
    expect(Object.keys(result.errors).length).toBe(0)
  })

  it('应该检测名称错误', () => {
    const result = validateProjectData({
      name: ''
    })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })

  it('应该检测名称长度错误', () => {
    const result = validateProjectData({
      name: 'a'.repeat(51)
    })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
  })
})
