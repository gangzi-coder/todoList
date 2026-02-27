/**
 * 项目管理服务
 * 
 * 负责项目的管理和任务分组
 * 
 * 验收标准：
 * - 需求 2.1: 支持创建、编辑、删除项目
 * - 需求 2.2: 创建项目时要求输入项目名称
 * - 需求 2.3: 允许为项目设置颜色标识
 * - 需求 2.4: 创建任务时允许选择所属项目
 * - 需求 2.5: 删除项目时显示确认对话框并说明项目内任务数量
 * - 需求 2.6: 确认删除项目时将项目内所有任务移动到默认项目
 * - 需求 2.7: 提供"收件箱"作为默认项目
 * - 需求 2.8: 在项目列表中显示每个项目的未完成任务数量
 */

import type { Project, CreateProjectDTO } from '@/types'
import { dataStore } from './DataStore'

/**
 * 默认项目 ID
 */
export const DEFAULT_PROJECT_ID = 'inbox'

/**
 * 默认项目颜色列表
 */
const DEFAULT_COLORS = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#f59e0b', // 橙色
  '#ef4444', // 红色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
  '#06b6d4', // 青色
  '#84cc16', // 黄绿色
]

/**
 * 项目管理器接口
 */
export interface IProjectManager {
  /** 创建项目 */
  createProject(project: CreateProjectDTO): Promise<Project>
  
  /** 更新项目 */
  updateProject(id: string, updates: Partial<Project>): Promise<Project>
  
  /** 删除项目 */
  deleteProject(id: string): Promise<void>
  
  /** 获取项目 */
  getProject(id: string): Promise<Project | null>
  
  /** 获取所有项目 */
  getAllProjects(): Promise<Project[]>
  
  /** 获取项目的任务数量 */
  getProjectTaskCount(id: string): Promise<number>
  
  /** 移动任务到项目 */
  moveTaskToProject(taskId: string, projectId: string): Promise<void>
  
  /** 初始化默认项目 */
  initializeDefaultProject(): Promise<void>
}

/**
 * 项目管理器实现
 */
export class ProjectManager implements IProjectManager {
  /**
   * 创建项目
   * 
   * 验收标准：
   * - 需求 2.1: 支持创建项目
   * - 需求 2.2: 要求输入项目名称
   * - 需求 2.3: 允许设置颜色标识
   */
  async createProject(dto: CreateProjectDTO): Promise<Project> {
    // 验证项目名称
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('项目名称不能为空')
    }

    // 加载现有项目
    const projects = await dataStore.loadProjects()

    // 生成唯一 ID
    const id = this.generateId()

    // 选择颜色（如果未提供，则使用默认颜色）
    const color = dto.color || this.getNextColor(projects)

    // 创建项目对象
    const project: Project = {
      id,
      name: dto.name.trim(),
      color,
      isDefault: false,
      createdAt: new Date(),
      order: projects.length,
    }

    // 保存项目
    projects.push(project)
    await dataStore.saveProjects(projects)

    return project
  }

  /**
   * 更新项目
   * 
   * 验收标准：
   * - 需求 2.1: 支持编辑项目
   */
  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    // 不允许更新默认项目的某些属性
    if (id === DEFAULT_PROJECT_ID) {
      if (updates.isDefault === false || updates.id) {
        throw new Error('不能修改默认项目的关键属性')
      }
    }

    // 加载现有项目
    const projects = await dataStore.loadProjects()
    const projectIndex = projects.findIndex(p => p.id === id)

    if (projectIndex === -1) {
      throw new Error(`项目不存在: ${id}`)
    }

    // 验证项目名称
    if (updates.name !== undefined) {
      if (!updates.name || updates.name.trim().length === 0) {
        throw new Error('项目名称不能为空')
      }
      updates.name = updates.name.trim()
    }

    // 更新项目
    const updatedProject = {
      ...projects[projectIndex],
      ...updates,
      // 不允许通过 updates 修改这些字段
      id: projects[projectIndex].id,
      isDefault: projects[projectIndex].isDefault,
      createdAt: projects[projectIndex].createdAt,
    }

    projects[projectIndex] = updatedProject
    await dataStore.saveProjects(projects)

    return updatedProject
  }

  /**
   * 删除项目
   * 
   * 验收标准：
   * - 需求 2.1: 支持删除项目
   * - 需求 2.6: 确认删除项目时将项目内所有任务移动到默认项目
   */
  async deleteProject(id: string): Promise<void> {
    // 不允许删除默认项目
    if (id === DEFAULT_PROJECT_ID) {
      throw new Error('不能删除默认项目')
    }

    // 加载现有项目
    const projects = await dataStore.loadProjects()
    const projectIndex = projects.findIndex(p => p.id === id)

    if (projectIndex === -1) {
      throw new Error(`项目不存在: ${id}`)
    }

    // 将项目内的所有任务移动到默认项目
    const tasks = await dataStore.loadTasks()
    const updatedTasks = tasks.map(task => {
      if (task.projectId === id) {
        return {
          ...task,
          projectId: DEFAULT_PROJECT_ID,
          updatedAt: new Date(),
        }
      }
      return task
    })

    // 保存更新后的任务
    await dataStore.saveTasks(updatedTasks)

    // 删除项目
    projects.splice(projectIndex, 1)
    await dataStore.saveProjects(projects)
  }

  /**
   * 获取项目
   */
  async getProject(id: string): Promise<Project | null> {
    const projects = await dataStore.loadProjects()
    return projects.find(p => p.id === id) || null
  }

  /**
   * 获取所有项目
   */
  async getAllProjects(): Promise<Project[]> {
    const projects = await dataStore.loadProjects()
    // 按 order 排序
    return projects.sort((a, b) => a.order - b.order)
  }

  /**
   * 获取项目的任务数量
   * 
   * 验收标准：
   * - 需求 2.8: 在项目列表中显示每个项目的未完成任务数量
   */
  async getProjectTaskCount(id: string): Promise<number> {
    const tasks = await dataStore.loadTasks()
    // 只统计未完成的任务
    return tasks.filter(task => task.projectId === id && !task.completed).length
  }

  /**
   * 移动任务到项目
   * 
   * 验收标准：
   * - 需求 2.4: 创建任务时允许选择所属项目
   */
  async moveTaskToProject(taskId: string, projectId: string): Promise<void> {
    // 验证项目是否存在
    const project = await this.getProject(projectId)
    if (!project) {
      throw new Error(`项目不存在: ${projectId}`)
    }

    // 加载任务
    const tasks = await dataStore.loadTasks()
    const taskIndex = tasks.findIndex(t => t.id === taskId)

    if (taskIndex === -1) {
      throw new Error(`任务不存在: ${taskId}`)
    }

    // 更新任务的项目 ID
    tasks[taskIndex] = {
      ...tasks[taskIndex],
      projectId,
      updatedAt: new Date(),
    }

    await dataStore.saveTasks(tasks)
  }

  /**
   * 初始化默认项目
   * 
   * 验收标准：
   * - 需求 2.7: 提供"收件箱"作为默认项目
   */
  async initializeDefaultProject(): Promise<void> {
    const projects = await dataStore.loadProjects()
    
    // 检查默认项目是否已存在
    const defaultProject = projects.find(p => p.id === DEFAULT_PROJECT_ID)
    
    if (!defaultProject) {
      // 创建默认项目
      const inboxProject: Project = {
        id: DEFAULT_PROJECT_ID,
        name: '收件箱',
        color: '#6b7280', // 灰色
        isDefault: true,
        createdAt: new Date(),
        order: -1, // 确保默认项目始终在最前面
      }
      
      projects.unshift(inboxProject)
      await dataStore.saveProjects(projects)
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取下一个默认颜色
   */
  private getNextColor(projects: Project[]): string {
    // 统计已使用的颜色
    const usedColors = projects.map(p => p.color)
    
    // 找到第一个未使用的默认颜色
    for (const color of DEFAULT_COLORS) {
      if (!usedColors.includes(color)) {
        return color
      }
    }
    
    // 如果所有默认颜色都已使用，则循环使用
    return DEFAULT_COLORS[projects.length % DEFAULT_COLORS.length]
  }
}

/**
 * 创建并导出单例实例
 */
export const projectManager = new ProjectManager()
