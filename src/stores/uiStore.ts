/**
 * UI 状态管理 Store
 * 
 * 管理应用的 UI 状态，包括视图、过滤、排序、搜索、主题等
 * 
 * 验收标准：
 * - 需求 8.1: 提供内置视图（今天、即将到来、收件箱、所有任务）
 * - 需求 13.2: 支持亮色和暗色两种主题模式
 * - 需求 13.3: 根据系统主题自动切换应用主题
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ViewType, SortOption, TaskFilter, Priority } from '@/types'

export const useUIStore = defineStore('ui', () => {
  // ============================================================================
  // State
  // ============================================================================

  /** 当前视图 */
  const currentView = ref<ViewType>('today')

  /** 过滤条件 */
  const filter = ref<TaskFilter>({})

  /** 排序方式 */
  const sortBy = ref<SortOption>('createdAt')

  /** 排序方向（升序/降序） */
  const sortAscending = ref(true)

  /** 搜索关键词 */
  const searchQuery = ref('')

  /** 主题模式 */
  const themeMode = ref<'auto' | 'light' | 'dark'>('auto')

  /** 当前实际应用的主题（解析 auto 后的结果） */
  const activeTheme = ref<'light' | 'dark'>('light')

  /** 是否显示侧边栏 */
  const showSidebar = ref(true)

  /** 是否显示统计面板 */
  const showStatsPanel = ref(true)

  /** 是否显示设置面板 */
  const showSettingsPanel = ref(false)

  /** 是否显示任务编辑器 */
  const showTaskEditor = ref(false)

  /** 正在编辑的任务 ID */
  const editingTaskId = ref<string | null>(null)

  // ============================================================================
  // Getters
  // ============================================================================

  /**
   * 是否有活动的过滤条件
   */
  const hasActiveFilters = computed(() => {
    return !!(
      filter.value.projectId ||
      filter.value.tags?.length ||
      filter.value.priority?.length ||
      filter.value.completed !== undefined ||
      filter.value.dueDateRange
    )
  })

  /**
   * 是否在搜索模式
   */
  const isSearching = computed(() => {
    return searchQuery.value.trim().length > 0
  })

  /**
   * 是否为暗色主题
   */
  const isDarkTheme = computed(() => {
    return activeTheme.value === 'dark'
  })

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 切换视图
   */
  function setView(view: ViewType): void {
    currentView.value = view
    // 切换视图时清除过滤条件
    clearFilters()
  }

  /**
   * 设置过滤条件
   */
  function setFilter(newFilter: Partial<TaskFilter>): void {
    filter.value = {
      ...filter.value,
      ...newFilter,
    }
  }

  /**
   * 清除过滤条件
   */
  function clearFilters(): void {
    filter.value = {}
  }

  /**
   * 设置排序方式
   */
  function setSortBy(sort: SortOption): void {
    // 如果点击相同的排序选项，切换排序方向
    if (sortBy.value === sort) {
      sortAscending.value = !sortAscending.value
    } else {
      sortBy.value = sort
      sortAscending.value = true
    }
  }

  /**
   * 设置搜索关键词
   */
  function setSearchQuery(query: string): void {
    searchQuery.value = query
  }

  /**
   * 清除搜索
   */
  function clearSearch(): void {
    searchQuery.value = ''
  }

  /**
   * 设置主题模式
   */
  function setThemeMode(mode: 'auto' | 'light' | 'dark'): void {
    themeMode.value = mode
    updateActiveTheme()
  }

  /**
   * 切换主题（在 light 和 dark 之间切换）
   */
  function toggleTheme(): void {
    if (themeMode.value === 'auto') {
      // 如果当前是 auto，切换到相反的主题
      themeMode.value = activeTheme.value === 'light' ? 'dark' : 'light'
    } else {
      // 如果已经是固定主题，切换到另一个
      themeMode.value = themeMode.value === 'light' ? 'dark' : 'light'
    }
    updateActiveTheme()
  }

  /**
   * 更新实际应用的主题
   * 处理 auto 模式，根据系统主题设置
   */
  function updateActiveTheme(): void {
    if (themeMode.value === 'auto') {
      // 检测系统主题
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      activeTheme.value = prefersDark ? 'dark' : 'light'
    } else {
      activeTheme.value = themeMode.value
    }

    // 应用主题到 DOM
    applyTheme()
  }

  /**
   * 应用主题到 DOM
   */
  function applyTheme(): void {
    const html = document.documentElement
    if (activeTheme.value === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  /**
   * 初始化主题
   * 监听系统主题变化
   */
  function initializeTheme(): void {
    // 初始化主题
    updateActiveTheme()

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (themeMode.value === 'auto') {
        updateActiveTheme()
      }
    })
  }

  /**
   * 切换侧边栏显示
   */
  function toggleSidebar(): void {
    showSidebar.value = !showSidebar.value
  }

  /**
   * 切换统计面板显示
   */
  function toggleStatsPanel(): void {
    showStatsPanel.value = !showStatsPanel.value
  }

  /**
   * 打开设置面板
   */
  function openSettingsPanel(): void {
    showSettingsPanel.value = true
  }

  /**
   * 关闭设置面板
   */
  function closeSettingsPanel(): void {
    showSettingsPanel.value = false
  }

  /**
   * 打开任务编辑器
   */
  function openTaskEditor(taskId?: string): void {
    editingTaskId.value = taskId || null
    showTaskEditor.value = true
  }

  /**
   * 关闭任务编辑器
   */
  function closeTaskEditor(): void {
    showTaskEditor.value = false
    editingTaskId.value = null
  }

  /**
   * 按项目过滤
   */
  function filterByProject(projectId: string): void {
    setFilter({ projectId })
  }

  /**
   * 按标签过滤
   */
  function filterByTag(tag: string): void {
    const currentTags = filter.value.tags || []
    if (currentTags.includes(tag)) {
      // 如果已经包含该标签，移除它
      setFilter({
        tags: currentTags.filter(t => t !== tag),
      })
    } else {
      // 否则添加该标签
      setFilter({
        tags: [...currentTags, tag],
      })
    }
  }

  /**
   * 按优先级过滤
   */
  function filterByPriority(priority: Priority): void {
    const currentPriorities = filter.value.priority || []
    if (currentPriorities.includes(priority)) {
      // 如果已经包含该优先级，移除它
      setFilter({
        priority: currentPriorities.filter(p => p !== priority),
      })
    } else {
      // 否则添加该优先级
      setFilter({
        priority: [...currentPriorities, priority],
      })
    }
  }

  /**
   * 按完成状态过滤
   */
  function filterByCompleted(completed: boolean): void {
    setFilter({ completed })
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    currentView,
    filter,
    sortBy,
    sortAscending,
    searchQuery,
    themeMode,
    activeTheme,
    showSidebar,
    showStatsPanel,
    showSettingsPanel,
    showTaskEditor,
    editingTaskId,

    // Getters
    hasActiveFilters,
    isSearching,
    isDarkTheme,

    // Actions
    setView,
    setFilter,
    clearFilters,
    setSortBy,
    setSearchQuery,
    clearSearch,
    setThemeMode,
    toggleTheme,
    updateActiveTheme,
    initializeTheme,
    toggleSidebar,
    toggleStatsPanel,
    openSettingsPanel,
    closeSettingsPanel,
    openTaskEditor,
    closeTaskEditor,
    filterByProject,
    filterByTag,
    filterByPriority,
    filterByCompleted,
  }
})
