# 数据导入导出功能文档

## 概述

本文档描述了待办事项应用的数据导入导出功能实现。该功能允许用户备份和恢复所有应用数据，包括任务、项目、标签和设置。

## 功能特性

### 1. 数据导出

- **格式**: JSON 格式
- **内容**: 包含所有任务、项目、标签和应用设置
- **文件名**: 建议使用 `todo-backup-{日期时间}.json` 格式
- **版本控制**: 导出数据包含版本号，便于未来兼容性处理

#### 导出数据结构

```typescript
interface ExportData {
  version: string        // 数据格式版本（当前为 "1.0.0"）
  exportedAt: Date      // 导出时间
  tasks: Task[]         // 所有任务
  projects: Project[]   // 所有项目
  tags: Tag[]          // 所有标签
  settings: AppSettings // 应用设置
}
```

### 2. 数据导入

#### 数据验证

导入数据前会进行严格的格式验证，包括：

- **基本结构验证**
  - 检查必需字段是否存在
  - 验证字段类型是否正确
  - 验证数组和对象结构

- **任务数据验证**
  - 任务标题：非空，最多 200 个字符
  - 任务备注：最多 500 个字符
  - 优先级：必须是 high/medium/low/none 之一
  - 日期字段：验证日期格式有效性
  - 重复规则：验证频率、间隔等参数

- **项目数据验证**
  - 项目名称：非空，最多 50 个字符
  - 项目颜色：必须是有效的颜色值

- **标签数据验证**
  - 标签名称：非空，最多 20 个字符
  - 使用次数：必须是非负整数

- **设置数据验证**
  - 默认视图：必须是 today/upcoming/inbox/all 之一
  - 主题模式：必须是 auto/light/dark 之一
  - 自动删除延迟：必须在 1-30 天之间

#### 冲突解决策略

导入时支持三种冲突解决策略：

##### 1. 覆盖（overwrite）

- **行为**: 删除所有现有数据，使用导入的数据完全替换
- **适用场景**: 
  - 恢复完整备份
  - 在新设备上导入数据
  - 想要完全替换当前数据
- **注意**: 会丢失所有现有数据，请谨慎使用

##### 2. 合并（merge）

- **行为**: 保留现有数据，合并导入的数据
- **合并规则**:
  - **任务**: 按 ID 去重，如果 ID 相同则使用导入的数据覆盖
  - **项目**: 按 ID 去重，如果 ID 相同则使用导入的数据覆盖
  - **标签**: 按名称去重，如果名称相同则累加使用次数
  - **设置**: 使用导入的设置覆盖现有设置
- **适用场景**:
  - 从其他设备导入部分数据
  - 合并多个备份文件
  - 保留现有数据的同时添加新数据

##### 3. 跳过（skip）

- **行为**: 不执行任何导入操作
- **适用场景**:
  - 验证导入文件格式
  - 预览导入数据内容
  - 检测数据冲突

## 使用方法

### 导出数据

```typescript
import { dataStore } from '@/services/DataStore'

async function exportData() {
  // 初始化数据存储
  await dataStore.initialize()
  
  // 导出所有数据
  const exportedData = await dataStore.exportData()
  
  // 转换为 JSON 字符串
  const jsonString = JSON.stringify(exportedData, null, 2)
  
  // 生成文件名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `todo-backup-${timestamp}.json`
  
  // 保存文件（使用 uTools API 或浏览器下载）
  // ...
}
```

### 导入数据

```typescript
import { dataStore } from '@/services/DataStore'
import type { ExportData } from '@/types'

async function importData(jsonString: string, strategy: 'overwrite' | 'merge' | 'skip') {
  try {
    // 初始化数据存储
    await dataStore.initialize()
    
    // 解析 JSON 数据
    const importData: ExportData = JSON.parse(jsonString)
    
    // 导入数据（会自动进行验证）
    await dataStore.importData(importData, strategy)
    
    console.log('导入成功！')
  } catch (error) {
    if (error instanceof Error && error.message.includes('数据验证失败')) {
      // 数据格式验证失败
      console.error('数据格式不正确:', error.message)
      alert('导入失败：数据格式不正确')
    } else if (error instanceof SyntaxError) {
      // JSON 解析失败
      console.error('JSON 格式错误:', error)
      alert('导入失败：文件格式不正确')
    } else {
      // 其他错误
      console.error('导入失败:', error)
      alert('导入失败：发生未知错误')
    }
  }
}
```

### 完整导入流程（推荐）

```typescript
async function completeImportFlow(jsonString: string) {
  try {
    // 1. 解析和验证数据
    const importData: ExportData = JSON.parse(jsonString)
    await dataStore.importData(importData, 'skip') // 仅验证，不导入
    
    // 2. 检测冲突
    const existingTasks = await dataStore.loadTasks()
    const conflictingTasks = importData.tasks.filter(t => 
      existingTasks.some(et => et.id === t.id)
    )
    
    // 3. 根据冲突情况选择策略
    let strategy: 'overwrite' | 'merge'
    if (conflictingTasks.length > 0) {
      // 显示对话框让用户选择
      strategy = await showConflictDialog(conflictingTasks.length)
    } else {
      strategy = 'merge'
    }
    
    // 4. 执行导入
    await dataStore.importData(importData, strategy)
    
    // 5. 显示成功消息
    showSuccessMessage(`成功导入 ${importData.tasks.length} 个任务`)
  } catch (error) {
    handleImportError(error)
  }
}
```

## 错误处理

### 常见错误类型

1. **JSON 解析错误**
   - 原因：文件不是有效的 JSON 格式
   - 处理：提示用户文件格式不正确

2. **数据验证错误**
   - 原因：数据结构不符合要求
   - 处理：显示具体的验证错误信息

3. **存储错误**
   - 原因：数据库写入失败
   - 处理：提示用户重试或检查存储空间

### 错误消息示例

```
数据验证失败: 任务 #1 验证失败: 任务标题长度不能超过 200 个字符
数据验证失败: 项目 #3 验证失败: 项目名称长度不能超过 50 个字符
数据验证失败: 缺少或无效的版本号字段
```

## 最佳实践

### 导出

1. **定期备份**: 建议用户定期导出数据进行备份
2. **文件命名**: 使用包含日期时间的文件名，便于管理多个备份
3. **安全存储**: 提醒用户将备份文件保存在安全的位置

### 导入

1. **验证优先**: 导入前先使用 'skip' 策略验证数据格式
2. **冲突检测**: 检测并提示用户数据冲突情况
3. **用户确认**: 特别是使用 'overwrite' 策略时，必须让用户确认
4. **错误提示**: 提供清晰、友好的错误提示信息

## 技术实现

### 文件位置

- **数据存储服务**: `src/services/DataStore.ts`
- **数据验证工具**: `src/utils/dataValidation.ts`
- **使用示例**: `src/services/DataStore.example-import-export.ts`

### 关键类和函数

- `DataStore.exportData()`: 导出数据
- `DataStore.importData()`: 导入数据
- `validateExportData()`: 验证导出数据格式
- `ValidationError`: 验证错误类

## 需求覆盖

本实现覆盖了以下需求：

- ✅ 需求 12.1: 支持将所有数据导出为 JSON 格式文件
- ✅ 需求 12.2: 生成包含所有任务、项目、标签的 JSON 文件
- ✅ 需求 12.4: 支持导入 JSON 格式的数据文件
- ✅ 需求 12.5: 验证文件格式的有效性
- ✅ 需求 12.7: 支持冲突解决策略（覆盖、合并、跳过）

## 未来改进

1. **增量备份**: 支持只导出修改过的数据
2. **压缩**: 支持导出压缩格式以减小文件大小
3. **加密**: 支持加密备份文件保护隐私
4. **云同步**: 支持自动备份到云存储
5. **版本兼容**: 支持导入旧版本的备份文件
