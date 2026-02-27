/**
 * DataStore 导入导出功能测试
 * 
 * 测试数据导入导出功能和数据验证
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { ExportData, Task, Project, Tag, AppSettings } from '@/types'
import { validateExportData, ValidationError, parseAndValidateImportData } from '@/utils/dataValidation'

describe('数据验证', () => {
  let validExportData: ExportData

  beforeEach(() => {
    // 准备有效的测试数据
    validExportData = {
      version: '1.0.0',
      exportedAt: new Date(),
      tasks: [
        {
          id: 'task-1',
          title: '测试任务',
          projectId: 'project-1',
          priority: 'high',
          tags: ['标签1'],
          reminders: [],
          completed: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          order: 0,
        },
      ],
      projects: [
        {
          id: 'project-1',
          name: '测试项目',
          color: '#ff0000',
          isDefault: false,
          createdAt: new Date(),
          order: 0,
        },
      ],
      tags: [
        {
          name: '标签1',
          color: '#00ff00',
          usageCount: 1,
        },
      ],
      settings: {
        defaultView: 'today',
        defaultSort: 'createdAt',
        themeMode: 'auto',
        enableReminders: true,
        autoDeleteCompleted: false,
        autoDeleteDelay: 7,
        playCompletionSound: false,
        weekStartsOn: 1,
        enableAnimations: true,
      },
    }
  })

  it('应该验证有效的导出数据', () => {
    expect(() => validateExportData(validExportData)).not.toThrow()
  })

  it('应该拒绝非对象数据', () => {
    expect(() => validateExportData(null)).toThrow(ValidationError)
    expect(() => validateExportData('string')).toThrow(ValidationError)
    expect(() => validateExportData(123)).toThrow(ValidationError)
  })

  it('应该拒绝缺少版本号的数据', () => {
    const invalidData = { ...validExportData }
    delete (invalidData as any).version
    expect(() => validateExportData(invalidData)).toThrow('缺少或无效的版本号字段')
  })

  it('应该拒绝缺少导出时间的数据', () => {
    const invalidData = { ...validExportData }
    delete (invalidData as any).exportedAt
    expect(() => validateExportData(invalidData)).toThrow('缺少导出时间字段')
  })

  it('应该拒绝任务列表不是数组的数据', () => {
    const invalidData = { ...validExportData, tasks: 'not-array' }
    expect(() => validateExportData(invalidData)).toThrow('任务列表必须是数组')
  })

  it('应该拒绝项目列表不是数组的数据', () => {
    const invalidData = { ...validExportData, projects: 'not-array' }
    expect(() => validateExportData(invalidData)).toThrow('项目列表必须是数组')
  })

  it('应该拒绝标签列表不是数组的数据', () => {
    const invalidData = { ...validExportData, tags: 'not-array' }
    expect(() => validateExportData(invalidData)).toThrow('标签列表必须是数组')
  })

  it('应该验证任务字段', () => {
    const invalidTask = { ...validExportData }
    invalidTask.tasks = [{ id: 'task-1' }] as any
    expect(() => validateExportData(invalidTask)).toThrow('任务 #1 验证失败')
  })

  it('应该拒绝任务标题过长', () => {
    const invalidTask = { ...validExportData }
    invalidTask.tasks[0].title = 'a'.repeat(201)
    expect(() => validateExportData(invalidTask)).toThrow('任务标题长度不能超过 200 个字符')
  })

  it('应该拒绝任务备注过长', () => {
    const invalidTask = { ...validExportData }
    invalidTask.tasks[0].notes = 'a'.repeat(501)
    expect(() => validateExportData(invalidTask)).toThrow('任务备注长度不能超过 500 个字符')
  })

  it('应该拒绝无效的优先级', () => {
    const invalidTask = { ...validExportData }
    invalidTask.tasks[0].priority = 'invalid' as any
    expect(() => validateExportData(invalidTask)).toThrow('任务优先级无效')
  })

  it('应该验证项目字段', () => {
    const invalidProject = { ...validExportData }
    invalidProject.projects = [{ id: 'project-1' }] as any
    expect(() => validateExportData(invalidProject)).toThrow('项目 #1 验证失败')
  })

  it('应该拒绝项目名称过长', () => {
    const invalidProject = { ...validExportData }
    invalidProject.projects[0].name = 'a'.repeat(51)
    expect(() => validateExportData(invalidProject)).toThrow('项目名称长度不能超过 50 个字符')
  })

  it('应该验证标签字段', () => {
    const invalidTag = { ...validExportData }
    invalidTag.tags = [{ name: 'tag' }] as any
    expect(() => validateExportData(invalidTag)).toThrow('标签 #1 验证失败')
  })

  it('应该拒绝标签名称过长', () => {
    const invalidTag = { ...validExportData }
    invalidTag.tags[0].name = 'a'.repeat(21)
    expect(() => validateExportData(invalidTag)).toThrow('标签名称长度不能超过 20 个字符')
  })

  it('应该验证设置字段', () => {
    const invalidSettings = { ...validExportData }
    invalidSettings.settings = {} as any
    expect(() => validateExportData(invalidSettings)).toThrow('设置验证失败')
  })

  it('应该拒绝无效的默认视图', () => {
    const invalidSettings = { ...validExportData }
    invalidSettings.settings.defaultView = 'invalid' as any
    expect(() => validateExportData(invalidSettings)).toThrow('默认视图无效')
  })

  it('应该拒绝无效的主题模式', () => {
    const invalidSettings = { ...validExportData }
    invalidSettings.settings.themeMode = 'invalid' as any
    expect(() => validateExportData(invalidSettings)).toThrow('主题模式无效')
  })

  it('应该拒绝无效的自动删除延迟天数', () => {
    const invalidSettings = { ...validExportData }
    invalidSettings.settings.autoDeleteDelay = 0
    expect(() => validateExportData(invalidSettings)).toThrow('自动删除延迟天数必须在 1-30 之间')

    invalidSettings.settings.autoDeleteDelay = 31
    expect(() => validateExportData(invalidSettings)).toThrow('自动删除延迟天数必须在 1-30 之间')
  })

  it('应该验证重复规则', () => {
    const taskWithRecurrence = { ...validExportData }
    taskWithRecurrence.tasks[0].recurrence = {
      frequency: 'daily',
      interval: 1,
    }
    expect(() => validateExportData(taskWithRecurrence)).not.toThrow()
  })

  it('应该拒绝无效的重复频率', () => {
    const taskWithRecurrence = { ...validExportData }
    taskWithRecurrence.tasks[0].recurrence = {
      frequency: 'invalid' as any,
      interval: 1,
    }
    expect(() => validateExportData(taskWithRecurrence)).toThrow('重复频率无效')
  })

  it('应该拒绝无效的重复间隔', () => {
    const taskWithRecurrence = { ...validExportData }
    taskWithRecurrence.tasks[0].recurrence = {
      frequency: 'daily',
      interval: 0,
    }
    expect(() => validateExportData(taskWithRecurrence)).toThrow('重复间隔必须是大于 0 的数字')
  })
})

describe('parseAndValidateImportData - JSON 解析和验证', () => {
  const validData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    tasks: [
      {
        id: 'task-1',
        title: '测试任务',
        projectId: 'project-1',
        priority: 'high',
        tags: ['标签1'],
        reminders: [],
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: 0,
      },
    ],
    projects: [
      {
        id: 'project-1',
        name: '测试项目',
        color: '#ff0000',
        isDefault: false,
        createdAt: new Date().toISOString(),
        order: 0,
      },
    ],
    tags: [
      { name: '标签1', color: '#00ff00', usageCount: 1 },
    ],
    settings: {
      defaultView: 'today',
      defaultSort: 'createdAt',
      themeMode: 'auto',
      enableReminders: true,
      autoDeleteCompleted: false,
      autoDeleteDelay: 7,
      playCompletionSound: false,
      weekStartsOn: 1,
      enableAnimations: true,
    },
  }

  it('应该成功解析有效的 JSON 数据', () => {
    const result = parseAndValidateImportData(JSON.stringify(validData))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tasks).toHaveLength(1)
      expect(result.data.projects).toHaveLength(1)
    }
  })

  it('应该对无效 JSON 返回友好错误信息', () => {
    const result = parseAndValidateImportData('这不是 JSON')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('JSON 格式')
    }
  })

  it('应该对空字符串返回 JSON 解析错误', () => {
    const result = parseAndValidateImportData('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('JSON 格式')
    }
  })

  it('应该对截断的 JSON 返回解析错误', () => {
    const result = parseAndValidateImportData('{"version": "1.0.0", "tasks":')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('JSON 格式')
    }
  })

  it('应该对结构不完整的数据返回验证错误', () => {
    const result = parseAndValidateImportData(JSON.stringify({ version: '1.0.0' }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('数据验证失败')
    }
  })

  it('应该对缺少必需字段的任务返回具体错误', () => {
    const badData = {
      ...validData,
      tasks: [{ id: 'task-1' }],
    }
    const result = parseAndValidateImportData(JSON.stringify(badData))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('任务 #1 验证失败')
    }
  })
})
