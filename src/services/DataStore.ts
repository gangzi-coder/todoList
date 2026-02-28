/**
 * 数据存储服务
 * 
 * 提供统一的数据持久化接口，支持 uTools DB 和 localStorage 降级
 * 
 * 验收标准：
 * - 需求 11.1: 使用 uTools 数据库 API 持久化所有任务数据
 * - 需求 11.2: uTools 数据库不可用时降级使用 localStorage
 * - 需求 11.3: 在 500 毫秒内完成数据保存
 * - 需求 11.8: 支持存储最多 10000 个任务
 * - 需求 12.1: 支持将所有数据导出为 JSON 格式
 * - 需求 12.2: 生成包含所有任务、项目、标签的 JSON 文件
 * - 需求 12.4: 支持导入 JSON 格式的数据文件
 * - 需求 12.5: 验证文件格式的有效性
 * - 需求 12.7: 支持冲突解决策略（覆盖、合并、跳过）
 */

import type { Task, Project, Tag, AppSettings, ExportData, ImportStrategy } from '@/types'
import { validateExportData, ValidationError } from '@/utils/dataValidation'

/**
 * 数据存储接口
 */
export interface IDataStore {
  /** 初始化存储 */
  initialize(): Promise<void>
  
  /** 保存任务 */
  saveTasks(tasks: Task[]): Promise<void>
  
  /** 加载任务 */
  loadTasks(): Promise<Task[]>
  
  /** 保存项目 */
  saveProjects(projects: Project[]): Promise<void>
  
  /** 加载项目 */
  loadProjects(): Promise<Project[]>
  
  /** 保存标签 */
  saveTags(tags: Tag[]): Promise<void>
  
  /** 加载标签 */
  loadTags(): Promise<Tag[]>
  
  /** 保存设置 */
  saveSettings(settings: AppSettings): Promise<void>
  
  /** 加载设置 */
  loadSettings(): Promise<AppSettings>
  
  /** 导出数据 */
  exportData(): Promise<ExportData>
  
  /** 导入数据 */
  importData(data: ExportData, strategy: ImportStrategy): Promise<void>
}

/**
 * 存储键名常量
 */
const STORAGE_KEYS = {
  TASKS: 'todo_tasks',
  PROJECTS: 'todo_projects',
  TAGS: 'todo_tags',
  SETTINGS: 'todo_settings',
} as const

/**
 * 默认应用设置
 */
const DEFAULT_SETTINGS: AppSettings = {
  defaultView: 'today',
  defaultSort: 'createdAt',
  themeMode: 'auto',
  enableReminders: true,
  autoDeleteCompleted: false,
  autoDeleteDelay: 7,
  playCompletionSound: false,
  weekStartsOn: 1,
  enableAnimations: true,
}

/**
 * uTools DB 适配器
 * 
 * 使用 uTools 数据库 API 进行数据持久化
 */
class UToolsDBAdapter implements IDataStore {
  private initialized = false

  async initialize(): Promise<void> {
    // 检查 uTools API 是否可用
    if (!window.utools || !window.utools.db) {
      throw new Error('uTools DB API not available')
    }
    this.initialized = true
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    this.ensureInitialized()
    // 将 Vue 响应式代理对象转为纯 JSON 对象，避免结构化克隆失败
    const plainTasks = JSON.parse(JSON.stringify(tasks))
    const doc = {
      _id: STORAGE_KEYS.TASKS,
      data: plainTasks,
      _rev: this.getRevision(STORAGE_KEYS.TASKS),
    }
    window.utools!.db.put(doc)
  }

  async loadTasks(): Promise<Task[]> {
    this.ensureInitialized()
    const doc = window.utools!.db.get(STORAGE_KEYS.TASKS)
    if (!doc || !doc.data) {
      return []
    }
    return this.deserializeDates(doc.data) as Task[]
  }

  async saveProjects(projects: Project[]): Promise<void> {
    this.ensureInitialized()
    const plainProjects = JSON.parse(JSON.stringify(projects))
    const doc = {
      _id: STORAGE_KEYS.PROJECTS,
      data: plainProjects,
      _rev: this.getRevision(STORAGE_KEYS.PROJECTS),
    }
    window.utools!.db.put(doc)
  }

  async loadProjects(): Promise<Project[]> {
    this.ensureInitialized()
    const doc = window.utools!.db.get(STORAGE_KEYS.PROJECTS)
    if (!doc || !doc.data) {
      return []
    }
    return this.deserializeDates(doc.data) as Project[]
  }

  async saveTags(tags: Tag[]): Promise<void> {
    this.ensureInitialized()
    const plainTags = JSON.parse(JSON.stringify(tags))
    const doc = {
      _id: STORAGE_KEYS.TAGS,
      data: plainTags,
      _rev: this.getRevision(STORAGE_KEYS.TAGS),
    }
    window.utools!.db.put(doc)
  }

  async loadTags(): Promise<Tag[]> {
    this.ensureInitialized()
    const doc = window.utools!.db.get(STORAGE_KEYS.TAGS)
    if (!doc || !doc.data) {
      return []
    }
    return doc.data as Tag[]
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.ensureInitialized()
    const plainSettings = JSON.parse(JSON.stringify(settings))
    const doc = {
      _id: STORAGE_KEYS.SETTINGS,
      data: plainSettings,
      _rev: this.getRevision(STORAGE_KEYS.SETTINGS),
    }
    window.utools!.db.put(doc)
  }

  async loadSettings(): Promise<AppSettings> {
    this.ensureInitialized()
    const doc = window.utools!.db.get(STORAGE_KEYS.SETTINGS)
    if (!doc || !doc.data) {
      return { ...DEFAULT_SETTINGS }
    }
    return { ...DEFAULT_SETTINGS, ...doc.data }
  }

  async exportData(): Promise<ExportData> {
    const [tasks, projects, tags, settings] = await Promise.all([
      this.loadTasks(),
      this.loadProjects(),
      this.loadTags(),
      this.loadSettings(),
    ])

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      tasks,
      projects,
      tags,
      settings,
    }
  }

  async importData(data: ExportData, strategy: ImportStrategy): Promise<void> {
    // 验证数据格式
    try {
      validateExportData(data)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`数据验证失败: ${error.message}`)
      }
      throw error
    }

    // 根据策略执行导入
    if (strategy === 'overwrite') {
      // 覆盖策略：直接替换所有数据
      await this.saveTasks(data.tasks)
      await this.saveProjects(data.projects)
      await this.saveTags(data.tags)
      await this.saveSettings(data.settings)
    } else if (strategy === 'merge') {
      // 合并策略：合并现有数据和导入数据
      const [existingTasks, existingProjects, existingTags] = await Promise.all([
        this.loadTasks(),
        this.loadProjects(),
        this.loadTags(),
      ])

      // 合并任务（按 ID 去重，导入数据优先）
      const taskMap = new Map(existingTasks.map(t => [t.id, t]))
      data.tasks.forEach(t => taskMap.set(t.id, t))
      await this.saveTasks(Array.from(taskMap.values()))

      // 合并项目（按 ID 去重，导入数据优先）
      const projectMap = new Map(existingProjects.map(p => [p.id, p]))
      data.projects.forEach(p => projectMap.set(p.id, p))
      await this.saveProjects(Array.from(projectMap.values()))

      // 合并标签（按名称去重，更新使用次数）
      const tagMap = new Map(existingTags.map(t => [t.name, t]))
      data.tags.forEach(t => {
        const existing = tagMap.get(t.name)
        if (existing) {
          // 如果标签已存在，累加使用次数
          tagMap.set(t.name, {
            ...t,
            usageCount: existing.usageCount + t.usageCount,
          })
        } else {
          tagMap.set(t.name, t)
        }
      })
      await this.saveTags(Array.from(tagMap.values()))

      // 设置使用导入的数据
      await this.saveSettings(data.settings)
    }
    // strategy === 'skip' 时不执行任何操作
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('DataStore not initialized')
    }
  }

  private getRevision(key: string): string | undefined {
    const doc = window.utools!.db.get(key)
    return doc?._rev
  }

  /**
   * 反序列化日期字段
   * uTools DB 会将 Date 对象序列化为字符串，需要转换回来
   */
  private deserializeDates(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.deserializeDates(item))
    }
    
    if (data && typeof data === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        // 识别日期字段
        if (
          (key.includes('Date') || key.includes('At') || key === 'reminders') &&
          typeof value === 'string'
        ) {
          result[key] = new Date(value)
        } else if (key === 'reminders' && Array.isArray(value)) {
          result[key] = value.map(v => new Date(v))
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.deserializeDates(value)
        } else {
          result[key] = value
        }
      }
      return result
    }
    
    return data
  }
}

/**
 * localStorage 适配器
 * 
 * 作为 uTools DB 不可用时的降级方案
 */
class LocalStorageAdapter implements IDataStore {
  private initialized = false

  async initialize(): Promise<void> {
    // 检查 localStorage 是否可用
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      this.initialized = true
    } catch (error) {
      throw new Error('localStorage not available')
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    this.ensureInitialized()
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks))
  }

  async loadTasks(): Promise<Task[]> {
    this.ensureInitialized()
    const data = localStorage.getItem(STORAGE_KEYS.TASKS)
    if (!data) {
      return []
    }
    return this.deserializeDates(JSON.parse(data)) as Task[]
  }

  async saveProjects(projects: Project[]): Promise<void> {
    this.ensureInitialized()
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
  }

  async loadProjects(): Promise<Project[]> {
    this.ensureInitialized()
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS)
    if (!data) {
      return []
    }
    return this.deserializeDates(JSON.parse(data)) as Project[]
  }

  async saveTags(tags: Tag[]): Promise<void> {
    this.ensureInitialized()
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags))
  }

  async loadTags(): Promise<Tag[]> {
    this.ensureInitialized()
    const data = localStorage.getItem(STORAGE_KEYS.TAGS)
    if (!data) {
      return []
    }
    return JSON.parse(data) as Tag[]
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.ensureInitialized()
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }

  async loadSettings(): Promise<AppSettings> {
    this.ensureInitialized()
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!data) {
      return { ...DEFAULT_SETTINGS }
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
  }

  async exportData(): Promise<ExportData> {
    const [tasks, projects, tags, settings] = await Promise.all([
      this.loadTasks(),
      this.loadProjects(),
      this.loadTags(),
      this.loadSettings(),
    ])

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      tasks,
      projects,
      tags,
      settings,
    }
  }

  async importData(data: ExportData, strategy: ImportStrategy): Promise<void> {
    // 验证数据格式
    try {
      validateExportData(data)
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new Error(`数据验证失败: ${error.message}`)
      }
      throw error
    }

    // 根据策略执行导入
    if (strategy === 'overwrite') {
      // 覆盖策略：直接替换所有数据
      await this.saveTasks(data.tasks)
      await this.saveProjects(data.projects)
      await this.saveTags(data.tags)
      await this.saveSettings(data.settings)
    } else if (strategy === 'merge') {
      // 合并策略：合并现有数据和导入数据
      const [existingTasks, existingProjects, existingTags] = await Promise.all([
        this.loadTasks(),
        this.loadProjects(),
        this.loadTags(),
      ])

      // 合并任务（按 ID 去重，导入数据优先）
      const taskMap = new Map(existingTasks.map(t => [t.id, t]))
      data.tasks.forEach(t => taskMap.set(t.id, t))
      await this.saveTasks(Array.from(taskMap.values()))

      // 合并项目（按 ID 去重，导入数据优先）
      const projectMap = new Map(existingProjects.map(p => [p.id, p]))
      data.projects.forEach(p => projectMap.set(p.id, p))
      await this.saveProjects(Array.from(projectMap.values()))

      // 合并标签（按名称去重，更新使用次数）
      const tagMap = new Map(existingTags.map(t => [t.name, t]))
      data.tags.forEach(t => {
        const existing = tagMap.get(t.name)
        if (existing) {
          // 如果标签已存在，累加使用次数
          tagMap.set(t.name, {
            ...t,
            usageCount: existing.usageCount + t.usageCount,
          })
        } else {
          tagMap.set(t.name, t)
        }
      })
      await this.saveTags(Array.from(tagMap.values()))

      // 设置使用导入的数据
      await this.saveSettings(data.settings)
    }
    // strategy === 'skip' 时不执行任何操作
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('DataStore not initialized')
    }
  }

  /**
   * 反序列化日期字段
   */
  private deserializeDates(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.deserializeDates(item))
    }
    
    if (data && typeof data === 'object') {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        // 识别日期字段
        if (
          (key.includes('Date') || key.includes('At')) &&
          typeof value === 'string'
        ) {
          result[key] = new Date(value)
        } else if (key === 'reminders' && Array.isArray(value)) {
          result[key] = value.map(v => new Date(v))
        } else if (typeof value === 'object' && value !== null) {
          result[key] = this.deserializeDates(value)
        } else {
          result[key] = value
        }
      }
      return result
    }
    
    return data
  }
}

/**
 * 数据存储工厂
 * 
 * 自动选择可用的存储适配器，实现降级逻辑
 */
export class DataStore implements IDataStore {
  private adapter: IDataStore | null = null
  private initPromise: Promise<void> | null = null

  async initialize(): Promise<void> {
    // 避免重复初始化
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this._initialize()
    return this.initPromise
  }

  private async _initialize(): Promise<void> {
    // 首先尝试使用 uTools DB
    try {
      const utoolsAdapter = new UToolsDBAdapter()
      await utoolsAdapter.initialize()
      this.adapter = utoolsAdapter
      console.log('[DataStore] Using uTools DB adapter')
      return
    } catch (error) {
      console.warn('[DataStore] uTools DB not available, falling back to localStorage', error)
    }

    // 降级到 localStorage
    try {
      const localStorageAdapter = new LocalStorageAdapter()
      await localStorageAdapter.initialize()
      this.adapter = localStorageAdapter
      console.log('[DataStore] Using localStorage adapter')
      return
    } catch (error) {
      console.error('[DataStore] No storage adapter available', error)
      throw new Error('No storage adapter available')
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    this.ensureInitialized()
    return this.adapter!.saveTasks(tasks)
  }

  async loadTasks(): Promise<Task[]> {
    this.ensureInitialized()
    return this.adapter!.loadTasks()
  }

  async saveProjects(projects: Project[]): Promise<void> {
    this.ensureInitialized()
    return this.adapter!.saveProjects(projects)
  }

  async loadProjects(): Promise<Project[]> {
    this.ensureInitialized()
    return this.adapter!.loadProjects()
  }

  async saveTags(tags: Tag[]): Promise<void> {
    this.ensureInitialized()
    return this.adapter!.saveTags(tags)
  }

  async loadTags(): Promise<Tag[]> {
    this.ensureInitialized()
    return this.adapter!.loadTags()
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.ensureInitialized()
    return this.adapter!.saveSettings(settings)
  }

  async loadSettings(): Promise<AppSettings> {
    this.ensureInitialized()
    return this.adapter!.loadSettings()
  }

  async exportData(): Promise<ExportData> {
    this.ensureInitialized()
    return this.adapter!.exportData()
  }

  async importData(data: ExportData, strategy: ImportStrategy): Promise<void> {
    this.ensureInitialized()
    return this.adapter!.importData(data, strategy)
  }

  private ensureInitialized(): void {
    if (!this.adapter) {
      throw new Error('DataStore not initialized. Call initialize() first.')
    }
  }
}

/**
 * 创建并导出单例实例
 */
export const dataStore = new DataStore()
