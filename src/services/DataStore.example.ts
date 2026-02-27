/**
 * DataStore 使用示例
 * 
 * 本文件展示如何使用 DataStore 进行数据持久化操作
 */

import { dataStore } from './DataStore'
import type { Task, Project, Tag, AppSettings } from '@/types'

/**
 * 初始化示例
 */
async function initializeExample() {
  try {
    // 初始化数据存储（会自动选择 uTools DB 或 localStorage）
    await dataStore.initialize()
    console.log('DataStore 初始化成功')
  } catch (error) {
    console.error('DataStore 初始化失败:', error)
  }
}

/**
 * 任务操作示例
 */
async function taskExample() {
  // 创建任务
  const tasks: Task[] = [
    {
      id: '1',
      title: '完成项目文档',
      notes: '需要包含架构设计和 API 文档',
      projectId: 'work',
      priority: 'high',
      tags: ['文档', '重要'],
      reminders: [new Date('2024-01-15T09:00:00')],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: new Date('2024-01-15'),
      order: 0,
    },
    {
      id: '2',
      title: '购买生活用品',
      projectId: 'personal',
      priority: 'low',
      tags: ['购物'],
      reminders: [],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 1,
    },
  ]

  // 保存任务
  await dataStore.saveTasks(tasks)
  console.log('任务已保存')

  // 加载任务
  const loadedTasks = await dataStore.loadTasks()
  console.log('加载的任务:', loadedTasks)
}

/**
 * 项目操作示例
 */
async function projectExample() {
  const projects: Project[] = [
    {
      id: 'inbox',
      name: '收件箱',
      color: '#3b82f6',
      isDefault: true,
      createdAt: new Date(),
      order: 0,
    },
    {
      id: 'work',
      name: '工作',
      color: '#ef4444',
      isDefault: false,
      createdAt: new Date(),
      order: 1,
    },
    {
      id: 'personal',
      name: '个人',
      color: '#10b981',
      isDefault: false,
      createdAt: new Date(),
      order: 2,
    },
  ]

  await dataStore.saveProjects(projects)
  const loadedProjects = await dataStore.loadProjects()
  console.log('加载的项目:', loadedProjects)
}

/**
 * 标签操作示例
 */
async function tagExample() {
  const tags: Tag[] = [
    { name: '重要', color: '#ef4444', usageCount: 5 },
    { name: '紧急', color: '#f59e0b', usageCount: 3 },
    { name: '文档', color: '#3b82f6', usageCount: 2 },
  ]

  await dataStore.saveTags(tags)
  const loadedTags = await dataStore.loadTags()
  console.log('加载的标签:', loadedTags)
}

/**
 * 设置操作示例
 */
async function settingsExample() {
  // 加载设置（如果不存在会返回默认设置）
  const settings = await dataStore.loadSettings()
  console.log('当前设置:', settings)

  // 修改设置
  const updatedSettings: AppSettings = {
    ...settings,
    themeMode: 'dark',
    defaultView: 'all',
    enableReminders: true,
  }

  await dataStore.saveSettings(updatedSettings)
  console.log('设置已更新')
}

/**
 * 数据导出示例
 */
async function exportExample() {
  const exportData = await dataStore.exportData()
  
  console.log('导出数据:', {
    version: exportData.version,
    exportedAt: exportData.exportedAt,
    tasksCount: exportData.tasks.length,
    projectsCount: exportData.projects.length,
    tagsCount: exportData.tags.length,
  })

  // 可以将数据转换为 JSON 字符串保存到文件
  const jsonString = JSON.stringify(exportData, null, 2)
  console.log('JSON 数据:', jsonString)
}

/**
 * 数据导入示例
 */
async function importExample() {
  // 模拟导入数据
  const importData = {
    version: '1.0.0',
    exportedAt: new Date(),
    tasks: [
      {
        id: '3',
        title: '导入的任务',
        projectId: 'inbox',
        priority: 'medium' as const,
        tags: [],
        reminders: [],
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: 0,
      },
    ],
    projects: [],
    tags: [],
    settings: {
      defaultView: 'today' as const,
      defaultSort: 'createdAt' as const,
      themeMode: 'auto' as const,
      enableReminders: true,
      autoDeleteCompleted: false,
      autoDeleteDelay: 7,
      playCompletionSound: false,
      weekStartsOn: 1 as const,
      enableAnimations: true,
    },
  }

  // 使用合并策略导入（保留现有数据，添加新数据）
  await dataStore.importData(importData, 'merge')
  console.log('数据已导入（合并模式）')

  // 或使用覆盖策略（替换所有数据）
  // await dataStore.importData(importData, 'overwrite')
  
  // 或使用跳过策略（不导入）
  // await dataStore.importData(importData, 'skip')
}

/**
 * 完整使用流程示例
 */
export async function fullExample() {
  // 1. 初始化
  await initializeExample()

  // 2. 操作各种数据
  await projectExample()
  await taskExample()
  await tagExample()
  await settingsExample()

  // 3. 导出数据
  await exportExample()

  // 4. 导入数据
  await importExample()
}

// 如果直接运行此文件，执行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  fullExample().catch(console.error)
}
