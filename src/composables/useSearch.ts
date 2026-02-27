/**
 * useSearch Composable
 * 
 * 实现搜索逻辑、关键词高亮、防抖处理
 * 
 * 验收标准：
 * - 需求 9.1: 提供全局搜索功能
 * - 需求 9.2: 在任务标题、备注、标签中搜索
 * - 需求 9.3: 实时显示搜索结果
 * - 需求 9.4: 在搜索结果中高亮显示匹配的关键词
 * - 需求 16.7: 对频繁的用户输入进行防抖处理
 */

import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/uiStore'
import { useTaskStore } from '@/stores/taskStore'
import type { Task } from '@/types'

/**
 * 防抖延迟时间（毫秒）
 */
const DEBOUNCE_DELAY = 100

/**
 * 搜索 Composable
 * 
 * 提供任务搜索功能，支持关键词高亮和防抖处理
 */
export function useSearch() {
  const uiStore = useUIStore()
  const taskStore = useTaskStore()

  // 使用 storeToRefs 保持响应性
  const { searchQuery, isSearching } = storeToRefs(uiStore)
  const { tasks } = storeToRefs(taskStore)

  // 防抖定时器
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  // 实际用于搜索的查询（防抖后的）
  const debouncedQuery = ref('')

  /**
   * 搜索结果
   */
  const searchResults = computed((): Task[] => {
    const query = debouncedQuery.value.trim().toLowerCase()
    
    if (!query) {
      return []
    }

    return tasks.value.filter(task => {
      // 在标题中搜索
      if (task.title.toLowerCase().includes(query)) {
        return true
      }

      // 在备注中搜索
      if (task.notes && task.notes.toLowerCase().includes(query)) {
        return true
      }

      // 在标签中搜索
      if (task.tags.some(tag => tag.toLowerCase().includes(query))) {
        return true
      }

      return false
    })
  })

  /**
   * 搜索结果数量
   */
  const searchResultCount = computed(() => searchResults.value.length)

  /**
   * 是否有搜索结果
   */
  const hasResults = computed(() => searchResultCount.value > 0)

  /**
   * 设置搜索查询（带防抖）
   */
  const setSearchQuery = (query: string): void => {
    // 立即更新 UI 显示的查询
    uiStore.setSearchQuery(query)

    // 清除之前的定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // 设置新的防抖定时器
    debounceTimer = setTimeout(() => {
      debouncedQuery.value = query
    }, DEBOUNCE_DELAY)
  }

  /**
   * 清除搜索
   */
  const clearSearch = (): void => {
    uiStore.clearSearch()
    debouncedQuery.value = ''
    
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  /**
   * 高亮匹配的关键词
   * 
   * @param text 原始文本
   * @param query 搜索关键词
   * @returns 带高亮标记的 HTML 字符串
   */
  const highlightMatch = (text: string, query?: string): string => {
    const searchTerm = query || debouncedQuery.value.trim()
    
    if (!searchTerm || !text) {
      return text
    }

    // 转义特殊字符，避免正则表达式错误
    const escapedQuery = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // 创建不区分大小写的正则表达式
    const regex = new RegExp(`(${escapedQuery})`, 'gi')
    
    // 替换匹配的文本，添加高亮标记
    return text.replace(regex, '<mark>$1</mark>')
  }

  /**
   * 检查文本是否匹配搜索关键词
   */
  const isMatch = (text: string, query?: string): boolean => {
    const searchTerm = query || debouncedQuery.value.trim()
    
    if (!searchTerm || !text) {
      return false
    }

    return text.toLowerCase().includes(searchTerm.toLowerCase())
  }

  /**
   * 获取任务的匹配信息
   * 
   * @param task 任务
   * @returns 匹配信息对象
   */
  const getMatchInfo = (task: Task) => {
    const query = debouncedQuery.value.trim().toLowerCase()
    
    return {
      titleMatch: task.title.toLowerCase().includes(query),
      notesMatch: task.notes ? task.notes.toLowerCase().includes(query) : false,
      tagsMatch: task.tags.some(tag => tag.toLowerCase().includes(query)),
    }
  }

  // 监听 searchQuery 变化，同步到 debouncedQuery（用于初始化）
  watch(
    () => searchQuery.value,
    (newQuery) => {
      if (!newQuery) {
        debouncedQuery.value = ''
      }
    },
    { immediate: true }
  )

  return {
    // State
    searchQuery,
    debouncedQuery,
    isSearching,
    searchResults,
    searchResultCount,
    hasResults,

    // Methods
    setSearchQuery,
    clearSearch,
    highlightMatch,
    isMatch,
    getMatchInfo,
  }
}
