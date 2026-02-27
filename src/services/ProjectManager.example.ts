/**
 * ProjectManager 使用示例
 * 
 * 本文件展示了如何使用 ProjectManager 服务进行项目管理
 */

import { projectManager, DEFAULT_PROJECT_ID } from './ProjectManager'
import { dataStore } from './DataStore'

/**
 * 示例：初始化和基本操作
 */
async function basicExample() {
  // 1. 初始化数据存储
  await dataStore.initialize()
  
  // 2. 初始化默认项目（收件箱）
  await projectManager.initializeDefaultProject()
  console.log('✓ 默认项目已初始化')
  
  // 3. 创建新项目
  const workProject = await projectManager.createProject({
    name: '工作',
    color: '#3b82f6', // 蓝色
  })
  console.log('✓ 创建项目:', workProject)
  
  const personalProject = await projectManager.createProject({
    name: '个人',
    // 不指定颜色，将自动分配
  })
  console.log('✓ 创建项目:', personalProject)
  
  // 4. 获取所有项目
  const allProjects = await projectManager.getAllProjects()
  console.log('✓ 所有项目:', allProjects)
  
  // 5. 更新项目
  const updatedProject = await projectManager.updateProject(workProject.id, {
    name: '工作项目',
    color: '#10b981', // 改为绿色
  })
  console.log('✓ 更新项目:', updatedProject)
  
  // 6. 获取单个项目
  const project = await projectManager.getProject(workProject.id)
  console.log('✓ 获取项目:', project)
  
  // 7. 获取项目任务数量
  const taskCount = await projectManager.getProjectTaskCount(DEFAULT_PROJECT_ID)
  console.log('✓ 收件箱任务数量:', taskCount)
}

/**
 * 示例：删除项目
 */
async function deleteProjectExample() {
  await dataStore.initialize()
  await projectManager.initializeDefaultProject()
  
  // 创建一个测试项目
  const testProject = await projectManager.createProject({
    name: '测试项目',
  })
  console.log('✓ 创建测试项目:', testProject)
  
  // 删除项目（项目内的任务会自动移动到收件箱）
  await projectManager.deleteProject(testProject.id)
  console.log('✓ 删除项目成功')
  
  // 验证项目已删除
  const deletedProject = await projectManager.getProject(testProject.id)
  console.log('✓ 项目已删除:', deletedProject === null)
}

/**
 * 示例：错误处理
 */
async function errorHandlingExample() {
  await dataStore.initialize()
  await projectManager.initializeDefaultProject()
  
  try {
    // 尝试创建空名称的项目
    await projectManager.createProject({ name: '' })
  } catch (error) {
    console.log('✓ 捕获错误:', (error as Error).message)
  }
  
  try {
    // 尝试删除默认项目
    await projectManager.deleteProject(DEFAULT_PROJECT_ID)
  } catch (error) {
    console.log('✓ 捕获错误:', (error as Error).message)
  }
  
  try {
    // 尝试更新不存在的项目
    await projectManager.updateProject('non-existent-id', { name: '新名称' })
  } catch (error) {
    console.log('✓ 捕获错误:', (error as Error).message)
  }
}

/**
 * 运行所有示例
 */
export async function runProjectManagerExamples() {
  console.log('\n=== 基本操作示例 ===')
  await basicExample()
  
  console.log('\n=== 删除项目示例 ===')
  await deleteProjectExample()
  
  console.log('\n=== 错误处理示例 ===')
  await errorHandlingExample()
  
  console.log('\n✓ 所有示例运行完成')
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runProjectManagerExamples().catch(console.error)
}
