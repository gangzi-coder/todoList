# uTools 待办事项插件

功能完善的任务管理工具，支持项目分组、子任务、重复任务、提醒通知等高级功能。

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **类型系统**: TypeScript
- **构建工具**: Vite
- **代码规范**: ESLint + Prettier

## 项目结构

```
src/
├── components/        # Vue 组件
│   ├── task/         # 任务相关组件
│   ├── project/      # 项目相关组件
│   ├── filter/       # 过滤器组件
│   ├── stats/        # 统计组件
│   ├── common/       # 通用组件
│   └── settings/     # 设置组件
├── composables/      # 组合式函数
├── stores/           # Pinia 状态管理
├── services/         # 业务逻辑服务
├── utils/            # 工具函数
├── styles/           # 样式文件
└── types/            # TypeScript 类型定义
```

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 构建 uTools 插件

1. 运行 `npm run build` 构建项目
2. 将 `dist` 目录、`plugin.json` 和 `preload.js` 打包
3. 在 uTools 开发者工具中导入插件

## 功能特性

- ✅ 任务基础管理（创建、编辑、删除、完成）
- ✅ 项目分组管理
- ✅ 子任务支持（最多 3 层嵌套）
- ✅ 任务属性（优先级、标签、截止日期、备注）
- ✅ 重复任务
- ✅ 提醒通知
- ✅ 自然语言输入
- ✅ 视图和过滤
- ✅ 搜索功能
- ✅ 统计和分析
- ✅ 数据导入导出
- ✅ 亮色/暗色主题
- ✅ 快捷键支持

## 许可证

MIT
