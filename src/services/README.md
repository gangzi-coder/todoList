# 服务层文档

本目录包含待办事项应用的核心业务逻辑服务。

## 服务列表

- [DataStore](#datastore-数据存储服务) - 数据持久化服务
- [ProjectManager](#projectmanager-项目管理服务) - 项目管理服务

---

# DataStore 数据存储服务

## 概述

DataStore 是待办事项应用的数据持久化层，提供统一的数据存储接口。它支持自动降级机制：优先使用 uTools 数据库 API，当 uTools 不可用时自动降级到 localStorage。

## 功能特性

- ✅ 统一的数据存储接口
- ✅ 自动适配器选择（uTools DB / localStorage）
- ✅ 支持任务、项目、标签、设置的持久化
- ✅ 数据导入导出功能
- ✅ 日期字段自动序列化/反序列化
- ✅ 支持多种导入策略（覆盖/合并/跳过）

## 验收标准

本实现满足以下需求：

- **需求 11.1**: 使用 uTools 数据库 API 持久化所有任务数据
- **需求 11.2**: uTools 数据库不可用时降级使用 localStorage
- **需求 11.3**: 在 500 毫秒内完成数据保存
- **需求 11.8**: 支持存储最多 10000 个任务

## 快速开始

### 1. 初始化

```typescript
import { dataStore } from '@/services/DataStore'

// 在应用启动时初始化
await dataStore.initialize()
```

### 2. 保存和加载任务

```typescript
import type { Task } from '@/types'

// 保存任务
const tasks: Task[] = [
  {
    id: '1',
    title: '完成项目文档',
    projectId: 'work',
    priority: 'high',
    tags: ['文档'],
    reminders: [],
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 0,
  },
]

await dataStore.saveTasks(tasks)

// 加载任务
const loadedTasks = await dataStore.loadTasks()
```

### 3. 保存和加载项目

```typescript
import type { Project } from '@/types'

const projects: Project[] = [
  {
    id: 'inbox',
    name: '收件箱',
    color: '#3b82f6',
    isDefault: true,
    createdAt: new Date(),
    order: 0,
  },
]

await dataStore.saveProjects(projects)
const loadedProjects = await dataStore.loadProjects()
```

### 4. 保存和加载标签

```typescript
import type { Tag } from '@/types'

const tags: Tag[] = [
  { name: '重要', color: '#ef4444', usageCount: 5 },
]

await dataStore.saveTags(tags)
const loadedTags = await dataStore.loadTags()
```

### 5. 保存和加载设置

```typescript
import type { AppSettings } from '@/types'

// 加载设置（不存在时返回默认设置）
const settings = await dataStore.loadSettings()

// 修改并保存设置
const updatedSettings: AppSettings = {
  ...settings,
  themeMode: 'dark',
  defaultView: 'all',
}

await dataStore.saveSettings(updatedSettings)
```

### 6. 导出数据

```typescript
// 导出所有数据
const exportData = await dataStore.exportData()

// 转换为 JSON 字符串
const jsonString = JSON.stringify(exportData, null, 2)

// 可以保存到文件或发送到其他地方
console.log(jsonString)
```

### 7. 导入数据

```typescript
import type { ExportData } from '@/types'

const importData: ExportData = {
  version: '1.0.0',
  exportedAt: new Date(),
  tasks: [...],
  projects: [...],
  tags: [...],
  settings: {...},
}

// 覆盖模式：替换所有现有数据
await dataStore.importData(importData, 'overwrite')

// 合并模式：保留现有数据，添加/更新导入的数据
await dataStore.importData(importData, 'merge')

// 跳过模式：不导入任何数据
await dataStore.importData(importData, 'skip')
```

## API 文档

### IDataStore 接口

```typescript
interface IDataStore {
  // 初始化存储
  initialize(): Promise<void>
  
  // 任务操作
  saveTasks(tasks: Task[]): Promise<void>
  loadTasks(): Promise<Task[]>
  
  // 项目操作
  saveProjects(projects: Project[]): Promise<void>
  loadProjects(): Promise<Project[]>
  
  // 标签操作
  saveTags(tags: Tag[]): Promise<void>
  loadTags(): Promise<Tag[]>
  
  // 设置操作
  saveSettings(settings: AppSettings): Promise<void>
  loadSettings(): Promise<AppSettings>
  
  // 导入导出
  exportData(): Promise<ExportData>
  importData(data: ExportData, strategy: ImportStrategy): Promise<void>
}
```

### 导入策略

- `'overwrite'`: 覆盖所有现有数据
- `'merge'`: 合并数据（按 ID 去重，保留新数据）
- `'skip'`: 不导入任何数据

## 架构设计

### 适配器模式

DataStore 使用适配器模式实现存储层的抽象：

```
DataStore (工厂类)
    ├── UToolsDBAdapter (uTools 数据库适配器)
    └── LocalStorageAdapter (localStorage 适配器)
```

### 自动降级逻辑

1. 初始化时首先尝试使用 `UToolsDBAdapter`
2. 如果 uTools API 不可用，自动降级到 `LocalStorageAdapter`
3. 如果两者都不可用，抛出错误

### 日期序列化

由于 JSON 不支持 Date 对象，DataStore 会自动处理日期字段的序列化和反序列化：

- **保存时**: Date 对象自动转换为 ISO 字符串
- **加载时**: 识别日期字段（包含 `Date`、`At` 或 `reminders`）并转换回 Date 对象

## 存储键名

DataStore 使用以下键名存储数据：

- `todo_tasks`: 任务列表
- `todo_projects`: 项目列表
- `todo_tags`: 标签列表
- `todo_settings`: 应用设置

## 默认设置

```typescript
{
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
```

## 错误处理

### 初始化错误

```typescript
try {
  await dataStore.initialize()
} catch (error) {
  console.error('存储初始化失败:', error)
  // 显示错误提示给用户
}
```

### 数据操作错误

```typescript
try {
  await dataStore.saveTasks(tasks)
} catch (error) {
  console.error('保存任务失败:', error)
  // 显示错误提示并提供重试选项
}
```

## 性能考虑

- 所有数据操作都是异步的，不会阻塞 UI
- 建议在应用层实现防抖机制，避免频繁保存
- 支持存储最多 10000 个任务（符合需求 11.8）

## 注意事项

1. **必须先初始化**: 在使用任何数据操作方法前，必须先调用 `initialize()`
2. **单例模式**: 导出的 `dataStore` 是单例实例，整个应用共享
3. **数据完整性**: 导入数据时会进行基本的格式验证
4. **日期处理**: 确保传入的日期字段是 Date 对象，而不是字符串

## 示例代码

完整的使用示例请参考 `DataStore.example.ts` 文件。

## 相关文件

- `src/services/DataStore.ts` - 主实现文件
- `src/services/DataStore.example.ts` - 使用示例
- `src/types/index.ts` - 类型定义
- `src/types/utools.d.ts` - uTools API 类型定义


---

# ProjectManager 项目管理服务

## 概述

ProjectManager 负责项目的创建、编辑、删除和管理，以及任务的项目分组功能。它提供了完整的项目生命周期管理，包括默认"收件箱"项目的初始化。

## 功能特性

- ✅ 创建、编辑、删除项目
- ✅ 自动生成唯一项目 ID
- ✅ 项目颜色管理（自动分配或自定义）
- ✅ 默认"收件箱"项目
- ✅ 删除项目时自动迁移任务到收件箱
- ✅ 获取项目的未完成任务数量
- ✅ 移动任务到指定项目

## 验收标准

本实现满足以下需求：

- **需求 2.1**: 支持创建、编辑、删除项目
- **需求 2.2**: 创建项目时要求输入项目名称
- **需求 2.3**: 允许为项目设置颜色标识
- **需求 2.4**: 创建任务时允许选择所属项目
- **需求 2.5**: 删除项目时显示确认对话框并说明项目内任务数量
- **需求 2.6**: 确认删除项目时将项目内所有任务移动到默认项目
- **需求 2.7**: 提供"收件箱"作为默认项目
- **需求 2.8**: 在项目列表中显示每个项目的未完成任务数量

## 快速开始

### 1. 初始化默认项目

```typescript
import { projectManager, DEFAULT_PROJECT_ID } from '@/services/ProjectManager'
import { dataStore } from '@/services/DataStore'

// 先初始化数据存储
await dataStore.initialize()

// 初始化默认"收件箱"项目
await projectManager.initializeDefaultProject()
```

### 2. 创建项目

```typescript
// 创建项目并指定颜色
const workProject = await projectManager.createProject({
  name: '工作',
  color: '#3b82f6', // 蓝色
})

// 创建项目，自动分配颜色
const personalProject = await projectManager.createProject({
  name: '个人',
})

console.log('创建的项目:', workProject)
```

### 3. 获取项目

```typescript
// 获取单个项目
const project = await projectManager.getProject(workProject.id)

// 获取所有项目（按 order 排序）
const allProjects = await projectManager.getAllProjects()

console.log('所有项目:', allProjects)
```

### 4. 更新项目

```typescript
// 更新项目名称和颜色
const updatedProject = await projectManager.updateProject(workProject.id, {
  name: '工作项目',
  color: '#10b981', // 改为绿色
})

console.log('更新后的项目:', updatedProject)
```

### 5. 删除项目

```typescript
// 删除项目（项目内的任务会自动移动到收件箱）
await projectManager.deleteProject(workProject.id)

// 注意：不能删除默认项目
try {
  await projectManager.deleteProject(DEFAULT_PROJECT_ID)
} catch (error) {
  console.error('错误:', error.message) // "不能删除默认项目"
}
```

### 6. 获取项目任务数量

```typescript
// 获取项目的未完成任务数量
const taskCount = await projectManager.getProjectTaskCount(workProject.id)

console.log(`项目 ${workProject.name} 有 ${taskCount} 个未完成任务`)
```

### 7. 移动任务到项目

```typescript
// 将任务移动到指定项目
await projectManager.moveTaskToProject('task_123', workProject.id)

console.log('任务已移动到新项目')
```

## API 文档

### IProjectManager 接口

```typescript
interface IProjectManager {
  // 创建项目
  createProject(project: CreateProjectDTO): Promise<Project>
  
  // 更新项目
  updateProject(id: string, updates: Partial<Project>): Promise<Project>
  
  // 删除项目
  deleteProject(id: string): Promise<void>
  
  // 获取项目
  getProject(id: string): Promise<Project | null>
  
  // 获取所有项目
  getAllProjects(): Promise<Project[]>
  
  // 获取项目的任务数量
  getProjectTaskCount(id: string): Promise<number>
  
  // 移动任务到项目
  moveTaskToProject(taskId: string, projectId: string): Promise<void>
  
  // 初始化默认项目
  initializeDefaultProject(): Promise<void>
}
```

### CreateProjectDTO

```typescript
interface CreateProjectDTO {
  name: string      // 项目名称（必填）
  color?: string    // 项目颜色（可选，不提供则自动分配）
}
```

### Project

```typescript
interface Project {
  id: string           // 唯一标识符
  name: string         // 项目名称
  color: string        // 项目颜色（十六进制）
  isDefault: boolean   // 是否为默认项目
  createdAt: Date      // 创建时间
  order: number        // 排序顺序
}
```

## 常量

### DEFAULT_PROJECT_ID

默认项目（收件箱）的 ID：

```typescript
export const DEFAULT_PROJECT_ID = 'inbox'
```

### 默认颜色列表

ProjectManager 会自动从以下颜色列表中分配颜色：

```typescript
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
```

## 业务规则

### 项目创建

1. 项目名称不能为空
2. 自动生成唯一 ID（格式：`project_时间戳_随机字符串`）
3. 如果未指定颜色，自动从默认颜色列表中选择未使用的颜色
4. 自动设置创建时间和排序顺序

### 项目更新

1. 不能修改项目 ID
2. 不能修改默认项目的 `isDefault` 属性
3. 不能修改项目的创建时间
4. 项目名称不能为空

### 项目删除

1. 不能删除默认项目（收件箱）
2. 删除项目时，项目内的所有任务会自动移动到收件箱
3. 任务的 `updatedAt` 时间会更新

### 默认项目

1. 默认项目的 ID 固定为 `'inbox'`
2. 默认项目的名称为"收件箱"
3. 默认项目的 `order` 为 -1，确保始终在列表最前面
4. 默认项目的 `isDefault` 为 `true`

## 错误处理

### 创建项目错误

```typescript
try {
  await projectManager.createProject({ name: '' })
} catch (error) {
  console.error(error.message) // "项目名称不能为空"
}
```

### 更新项目错误

```typescript
try {
  await projectManager.updateProject('non-existent-id', { name: '新名称' })
} catch (error) {
  console.error(error.message) // "项目不存在: non-existent-id"
}

try {
  await projectManager.updateProject(DEFAULT_PROJECT_ID, { isDefault: false })
} catch (error) {
  console.error(error.message) // "不能修改默认项目的关键属性"
}
```

### 删除项目错误

```typescript
try {
  await projectManager.deleteProject(DEFAULT_PROJECT_ID)
} catch (error) {
  console.error(error.message) // "不能删除默认项目"
}

try {
  await projectManager.deleteProject('non-existent-id')
} catch (error) {
  console.error(error.message) // "项目不存在: non-existent-id"
}
```

### 移动任务错误

```typescript
try {
  await projectManager.moveTaskToProject('task_123', 'non-existent-project')
} catch (error) {
  console.error(error.message) // "项目不存在: non-existent-project"
}

try {
  await projectManager.moveTaskToProject('non-existent-task', workProject.id)
} catch (error) {
  console.error(error.message) // "任务不存在: non-existent-task"
}
```

## 使用场景

### 场景 1：应用初始化

```typescript
async function initializeApp() {
  // 1. 初始化数据存储
  await dataStore.initialize()
  
  // 2. 初始化默认项目
  await projectManager.initializeDefaultProject()
  
  // 3. 加载所有项目
  const projects = await projectManager.getAllProjects()
  
  console.log('应用初始化完成，项目列表:', projects)
}
```

### 场景 2：显示项目列表（带任务数量）

```typescript
async function displayProjectList() {
  const projects = await projectManager.getAllProjects()
  
  for (const project of projects) {
    const taskCount = await projectManager.getProjectTaskCount(project.id)
    console.log(`${project.name} (${taskCount})`)
  }
}
```

### 场景 3：删除项目前确认

```typescript
async function deleteProjectWithConfirmation(projectId: string) {
  // 1. 获取项目信息
  const project = await projectManager.getProject(projectId)
  if (!project) {
    throw new Error('项目不存在')
  }
  
  // 2. 获取任务数量
  const taskCount = await projectManager.getProjectTaskCount(projectId)
  
  // 3. 显示确认对话框（UI 层实现）
  const confirmed = await showConfirmDialog(
    `确定要删除项目"${project.name}"吗？`,
    `该项目包含 ${taskCount} 个未完成任务，这些任务将移动到收件箱。`
  )
  
  // 4. 执行删除
  if (confirmed) {
    await projectManager.deleteProject(projectId)
    console.log('项目已删除')
  }
}
```

### 场景 4：创建任务时选择项目

```typescript
async function createTaskWithProject(taskData: CreateTaskDTO) {
  // 1. 如果未指定项目，使用默认项目
  const projectId = taskData.projectId || DEFAULT_PROJECT_ID
  
  // 2. 验证项目是否存在
  const project = await projectManager.getProject(projectId)
  if (!project) {
    throw new Error('指定的项目不存在')
  }
  
  // 3. 创建任务（TaskManager 实现）
  const task = await taskManager.createTask({
    ...taskData,
    projectId,
  })
  
  console.log(`任务已创建到项目"${project.name}"`)
  return task
}
```

## 性能考虑

1. **批量操作**: 如果需要获取多个项目的任务数量，考虑一次性加载所有任务后在内存中计算
2. **缓存**: 在应用层可以考虑缓存项目列表，减少频繁的数据库读取
3. **异步操作**: 所有方法都是异步的，不会阻塞 UI

## 注意事项

1. **依赖 DataStore**: ProjectManager 依赖 DataStore，使用前必须先初始化 DataStore
2. **单例模式**: 导出的 `projectManager` 是单例实例，整个应用共享
3. **任务迁移**: 删除项目时会自动迁移任务，这个操作是原子性的
4. **默认项目**: 应用启动时应该调用 `initializeDefaultProject()` 确保默认项目存在

## 示例代码

完整的使用示例请参考 `ProjectManager.example.ts` 文件。

## 相关文件

- `src/services/ProjectManager.ts` - 主实现文件
- `src/services/ProjectManager.example.ts` - 使用示例
- `src/services/DataStore.ts` - 数据存储服务
- `src/types/index.ts` - 类型定义
