/**
 * useKeyboard Composable
 * 
 * 注册全局快捷键监听器
 * 
 * 验收标准：
 * - 需求 14.1: 支持使用 Enter 键快速添加任务
 * - 需求 14.2: 支持使用 Ctrl+F（或 Cmd+F）打开搜索功能
 * - 需求 14.3: 支持使用 Esc 键关闭弹窗和搜索框
 * - 需求 14.4: 支持使用 Ctrl+N（或 Cmd+N）创建新任务
 * - 需求 14.5: 支持使用 Ctrl+D（或 Cmd+D）切换暗色模式
 * - 需求 14.6: 支持使用数字键 1-4 快速切换视图
 * - 需求 14.7: 支持使用 Space 键标记选中任务为完成
 */

import { onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/uiStore'
import type { ViewType } from '@/types'

/**
 * 快捷键配置
 */
export interface KeyboardShortcuts {
  /** 打开搜索 */
  onSearch?: () => void
  /** 创建新任务 */
  onNewTask?: () => void
  /** 切换主题 */
  onToggleTheme?: () => void
  /** 关闭弹窗/搜索 */
  onEscape?: () => void
  /** 切换任务完成状态 */
  onToggleComplete?: () => void
  /** 快速添加任务（Enter 键） */
  onQuickAdd?: () => void
  /** 打开设置 */
  onOpenSettings?: () => void
}

/**
 * 视图快捷键映射
 */
const VIEW_SHORTCUTS: Record<string, ViewType> = {
  '1': 'today',
  '2': 'upcoming',
  '3': 'inbox',
  '4': 'all',
}

/**
 * 键盘快捷键 Composable
 * 
 * 注册和管理全局键盘快捷键
 */
export function useKeyboard(shortcuts: KeyboardShortcuts = {}) {
  const uiStore = useUIStore()

  /**
   * 检查是否为 Mac 系统
   */
  const isMac = (): boolean => {
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  }

  /**
   * 检查是否按下了修饰键（Ctrl 或 Cmd）
   */
  const isModifierKey = (event: KeyboardEvent): boolean => {
    return isMac() ? event.metaKey : event.ctrlKey
  }

  /**
   * 键盘事件处理器
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    // 如果在输入框中，某些快捷键不生效
    const target = event.target as HTMLElement
    const isInputElement = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable

    // Ctrl/Cmd + F: 打开搜索
    if (isModifierKey(event) && event.key === 'f') {
      event.preventDefault()
      shortcuts.onSearch?.()
      return
    }

    // Ctrl/Cmd + N: 创建新任务
    if (isModifierKey(event) && event.key === 'n') {
      event.preventDefault()
      shortcuts.onNewTask?.()
      return
    }

    // Ctrl/Cmd + D: 切换主题
    if (isModifierKey(event) && event.key === 'd') {
      event.preventDefault()
      shortcuts.onToggleTheme?.()
      uiStore.toggleTheme()
      return
    }

    // Ctrl/Cmd + ,: 打开设置
    if (isModifierKey(event) && event.key === ',') {
      event.preventDefault()
      shortcuts.onOpenSettings?.()
      return
    }

    // Esc: 关闭弹窗/搜索
    if (event.key === 'Escape') {
      shortcuts.onEscape?.()
      
      // 如果有搜索，清除搜索
      if (uiStore.isSearching) {
        uiStore.clearSearch()
      }
      
      // 如果有打开的面板，关闭它们
      if (uiStore.showSettingsPanel) {
        uiStore.closeSettingsPanel()
      }
      if (uiStore.showTaskEditor) {
        uiStore.closeTaskEditor()
      }
      
      return
    }

    // 以下快捷键在输入框中不生效
    if (isInputElement) {
      return
    }

    // 数字键 1-4: 切换视图
    if (event.key in VIEW_SHORTCUTS) {
      event.preventDefault()
      const view = VIEW_SHORTCUTS[event.key]
      uiStore.setView(view)
      return
    }

    // Space: 切换任务完成状态（需要有选中的任务）
    if (event.key === ' ' || event.key === 'Space') {
      event.preventDefault()
      shortcuts.onToggleComplete?.()
      return
    }

    // Enter: 快速添加任务（在非输入框中）
    if (event.key === 'Enter') {
      shortcuts.onQuickAdd?.()
      return
    }
  }

  /**
   * 注册键盘事件监听器
   */
  const registerKeyboardListeners = (): void => {
    window.addEventListener('keydown', handleKeyDown)
  }

  /**
   * 移除键盘事件监听器
   */
  const unregisterKeyboardListeners = (): void => {
    window.removeEventListener('keydown', handleKeyDown)
  }

  /**
   * 获取快捷键显示文本
   */
  const getShortcutText = (key: string, modifier: boolean = false): string => {
    const modifierKey = isMac() ? '⌘' : 'Ctrl'
    
    if (modifier) {
      return `${modifierKey}+${key.toUpperCase()}`
    }
    
    return key.toUpperCase()
  }

  /**
   * 获取所有快捷键列表
   */
  const getAllShortcuts = () => {
    const modifierKey = isMac() ? '⌘' : 'Ctrl'
    
    return [
      { key: `${modifierKey}+F`, description: '打开搜索' },
      { key: `${modifierKey}+N`, description: '创建新任务' },
      { key: `${modifierKey}+D`, description: '切换暗色模式' },
      { key: `${modifierKey}+,`, description: '打开设置' },
      { key: 'Esc', description: '关闭弹窗/搜索' },
      { key: '1', description: '切换到"今天"视图' },
      { key: '2', description: '切换到"即将到来"视图' },
      { key: '3', description: '切换到"收件箱"视图' },
      { key: '4', description: '切换到"所有任务"视图' },
      { key: 'Space', description: '切换任务完成状态' },
      { key: 'Enter', description: '快速添加任务' },
      { key: '↑/↓', description: '在任务列表中导航' },
    ]
  }

  // 组件挂载时注册监听器
  onMounted(() => {
    registerKeyboardListeners()
  })

  // 组件卸载时移除监听器
  onUnmounted(() => {
    unregisterKeyboardListeners()
  })

  return {
    // Methods
    registerKeyboardListeners,
    unregisterKeyboardListeners,
    getShortcutText,
    getAllShortcuts,
    isMac,
  }
}
