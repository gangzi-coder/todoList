/**
 * DataStore 导入导出功能使用示例
 * 
 * 本文件展示如何使用 DataStore 的导入导出功能
 */

import { dataStore } from './DataStore'
import type { ExportData } from '@/types'

/**
 * 示例 1: 导出数据
 * 
 * 导出所有任务、项目、标签和设置到 JSON 格式
 */
async function exportDataExample() {
  try {
    // 初始化数据存储
    await dataStore.initialize()
    
    // 导出所有数据
    const exportedData = await dataStore.exportData()
    
    // 将数据转换为 JSON 字符串
    const jsonString = JSON.stringify(exportedData, null, 2)
    
    // 生成文件名（包含导出日期时间）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `todo-backup-${timestamp}.json`
    
    console.log('导出成功！')
    console.log('文件名:', filename)
    console.log('数据大小:', jsonString.length, '字符')
    console.log('任务数量:', exportedData.tasks.length)
    console.log('项目数量:', exportedData.projects.length)
    console.log('标签数量:', exportedData.tags.length)
    
    // 在实际应用中，可以使用 uTools API 保存文件
    // 或者提供下载链接给用户
    
    return { filename, data: jsonString }
  } catch (error) {
    console.error('导出失败:', error)
    throw error
  }
}

/**
 * 示例 2: 导入数据 - 覆盖策略
 * 
 * 使用覆盖策略导入数据，会替换所有现有数据
 */
async function importDataWithOverwrite(jsonData: string) {
  try {
    // 初始化数据存储
    await dataStore.initialize()
    
    // 解析 JSON 数据
    const importData: ExportData = JSON.parse(jsonData)
    
    // 使用覆盖策略导入
    // 这会删除所有现有数据，并用导入的数据替换
    await dataStore.importData(importData, 'overwrite')
    
    console.log('导入成功（覆盖模式）！')
    console.log('已导入任务数量:', importData.tasks.length)
    console.log('已导入项目数量:', importData.projects.length)
    console.log('已导入标签数量:', importData.tags.length)
  } catch (error) {
    if (error instanceof Error && error.message.includes('数据验证失败')) {
      console.error('数据格式验证失败:', error.message)
      // 显示友好的错误提示给用户
      alert('导入失败：数据格式不正确。请确保文件是有效的待办事项备份文件。')
    } else if (error instanceof SyntaxError) {
      console.error('JSON 解析失败:', error)
      alert('导入失败：文件格式不正确。请确保文件是有效的 JSON 格式。')
    } else {
      console.error('导入失败:', error)
      alert('导入失败：发生未知错误。')
    }
    throw error
  }
}

/**
 * 示例 3: 导入数据 - 合并策略
 * 
 * 使用合并策略导入数据，会保留现有数据并合并导入的数据
 */
async function importDataWithMerge(jsonData: string) {
  try {
    // 初始化数据存储
    await dataStore.initialize()
    
    // 获取导入前的数据统计
    const beforeTasks = await dataStore.loadTasks()
    const beforeProjects = await dataStore.loadProjects()
    const beforeTags = await dataStore.loadTags()
    
    console.log('导入前统计:')
    console.log('- 任务数量:', beforeTasks.length)
    console.log('- 项目数量:', beforeProjects.length)
    console.log('- 标签数量:', beforeTags.length)
    
    // 解析 JSON 数据
    const importData: ExportData = JSON.parse(jsonData)
    
    // 使用合并策略导入
    // 这会保留现有数据，并合并导入的数据
    // 如果 ID 相同，导入的数据会覆盖现有数据
    await dataStore.importData(importData, 'merge')
    
    // 获取导入后的数据统计
    const afterTasks = await dataStore.loadTasks()
    const afterProjects = await dataStore.loadProjects()
    const afterTags = await dataStore.loadTags()
    
    console.log('导入成功（合并模式）！')
    console.log('导入后统计:')
    console.log('- 任务数量:', afterTasks.length, `(+${afterTasks.length - beforeTasks.length})`)
    console.log('- 项目数量:', afterProjects.length, `(+${afterProjects.length - beforeProjects.length})`)
    console.log('- 标签数量:', afterTags.length, `(+${afterTags.length - beforeTags.length})`)
  } catch (error) {
    console.error('导入失败:', error)
    throw error
  }
}

/**
 * 示例 4: 导入数据 - 跳过策略
 * 
 * 使用跳过策略导入数据，不会执行任何操作
 * 这可以用于预览导入数据而不实际导入
 */
async function importDataWithSkip(jsonData: string) {
  try {
    // 初始化数据存储
    await dataStore.initialize()
    
    // 解析 JSON 数据
    const importData: ExportData = JSON.parse(jsonData)
    
    // 使用跳过策略导入（实际上不会导入任何数据）
    await dataStore.importData(importData, 'skip')
    
    console.log('数据验证成功！')
    console.log('预览信息:')
    console.log('- 任务数量:', importData.tasks.length)
    console.log('- 项目数量:', importData.projects.length)
    console.log('- 标签数量:', importData.tags.length)
    console.log('- 导出时间:', importData.exportedAt)
    console.log('- 数据版本:', importData.version)
  } catch (error) {
    console.error('数据验证失败:', error)
    throw error
  }
}

/**
 * 示例 5: 完整的导入流程（带用户确认）
 * 
 * 展示一个完整的导入流程，包括数据验证、冲突检测和用户确认
 */
async function completeImportFlow(jsonData: string) {
  try {
    // 步骤 1: 解析和验证数据
    console.log('步骤 1: 解析和验证数据...')
    const importData: ExportData = JSON.parse(jsonData)
    
    // 使用跳过策略进行验证（不实际导入）
    await dataStore.importData(importData, 'skip')
    console.log('✓ 数据格式验证通过')
    
    // 步骤 2: 检测冲突
    console.log('步骤 2: 检测数据冲突...')
    const existingTasks = await dataStore.loadTasks()
    const existingProjects = await dataStore.loadProjects()
    
    const conflictingTasks = importData.tasks.filter(t => 
      existingTasks.some(et => et.id === t.id)
    )
    const conflictingProjects = importData.projects.filter(p => 
      existingProjects.some(ep => ep.id === p.id)
    )
    
    console.log('冲突检测结果:')
    console.log('- 冲突任务数量:', conflictingTasks.length)
    console.log('- 冲突项目数量:', conflictingProjects.length)
    
    // 步骤 3: 用户选择策略
    let strategy: 'overwrite' | 'merge' | 'skip'
    
    if (conflictingTasks.length > 0 || conflictingProjects.length > 0) {
      console.log('检测到数据冲突，请选择处理策略:')
      console.log('1. 覆盖 - 删除所有现有数据，使用导入的数据')
      console.log('2. 合并 - 保留现有数据，合并导入的数据（冲突时使用导入数据）')
      console.log('3. 取消 - 取消导入')
      
      // 在实际应用中，这里应该显示一个对话框让用户选择
      // 这里为了示例，我们使用合并策略
      strategy = 'merge'
    } else {
      console.log('未检测到冲突，将直接导入数据')
      strategy = 'merge'
    }
    
    // 步骤 4: 执行导入
    if (strategy !== 'skip') {
      console.log(`步骤 3: 执行导入（策略: ${strategy}）...`)
      await dataStore.importData(importData, strategy)
      console.log('✓ 导入完成！')
      
      // 显示导入结果
      const finalTasks = await dataStore.loadTasks()
      const finalProjects = await dataStore.loadProjects()
      const finalTags = await dataStore.loadTags()
      
      console.log('导入结果:')
      console.log('- 总任务数:', finalTasks.length)
      console.log('- 总项目数:', finalProjects.length)
      console.log('- 总标签数:', finalTags.length)
    } else {
      console.log('用户取消了导入')
    }
  } catch (error) {
    console.error('导入流程失败:', error)
    throw error
  }
}

// 导出示例函数
export {
  exportDataExample,
  importDataWithOverwrite,
  importDataWithMerge,
  importDataWithSkip,
  completeImportFlow,
}
