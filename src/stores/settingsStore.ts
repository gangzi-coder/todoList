/**
 * 设置状态管理 Store
 * 
 * 管理应用的用户设置和偏好
 * 
 * 验收标准：
 * - 需求 15.1: 提供设置面板
 * - 需求 15.2: 允许选择默认视图
 * - 需求 15.3: 允许选择默认任务排序方式
 * - 需求 15.4: 允许设置是否自动删除已完成任务
 * - 需求 15.5: 允许设置删除延迟天数
 * - 需求 15.6: 允许设置任务完成时是否播放音效
 * - 需求 15.7: 允许选择主题模式
 * - 需求 15.8: 允许设置每周的第一天
 * - 需求 15.9: 将所有设置保存到本地存储
 */

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { AppSettings, ViewType, SortOption } from '@/types'
import { dataStore } from '@/services/DataStore'

/**
 * 默认设置
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

export const useSettingsStore = defineStore('settings', () => {
  // ============================================================================
  // State
  // ============================================================================

  /** 应用设置 */
  const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })

  /** 加载状态 */
  const loading = ref(false)

  /** 错误信息 */
  const error = ref<string | null>(null)

  /** 是否已初始化 */
  const initialized = ref(false)

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * 初始化设置 store
   * 从数据存储加载设置
   */
  async function initialize(): Promise<void> {
    if (initialized.value) {
      return
    }

    loading.value = true
    error.value = null

    try {
      // 初始化数据存储
      await dataStore.initialize()
      
      // 加载设置
      const loadedSettings = await dataStore.loadSettings()
      settings.value = { ...DEFAULT_SETTINGS, ...loadedSettings }
      
      initialized.value = true

      // 监听设置变化，自动保存
      watch(
        settings,
        async () => {
          if (initialized.value) {
            await saveSettings()
          }
        },
        { deep: true }
      )
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败'
      console.error('[SettingsStore] Initialize failed:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新设置
   */
  function updateSettings(updates: Partial<AppSettings>): void {
    settings.value = {
      ...settings.value,
      ...updates,
    }
  }

  /**
   * 设置默认视图
   */
  function setDefaultView(view: ViewType): void {
    settings.value.defaultView = view
  }

  /**
   * 设置默认排序方式
   */
  function setDefaultSort(sort: SortOption): void {
    settings.value.defaultSort = sort
  }

  /**
   * 设置主题模式
   */
  function setThemeMode(mode: 'auto' | 'light' | 'dark'): void {
    settings.value.themeMode = mode
  }

  /**
   * 设置是否启用提醒
   */
  function setEnableReminders(enabled: boolean): void {
    settings.value.enableReminders = enabled
  }

  /**
   * 设置是否自动删除已完成任务
   */
  function setAutoDeleteCompleted(enabled: boolean): void {
    settings.value.autoDeleteCompleted = enabled
  }

  /**
   * 设置自动删除延迟天数
   */
  function setAutoDeleteDelay(days: number): void {
    // 验证天数范围（1-30 天）
    if (days < 1 || days > 30) {
      throw new Error('自动删除延迟天数必须在 1-30 之间')
    }
    settings.value.autoDeleteDelay = days
  }

  /**
   * 设置是否播放完成音效
   */
  function setPlayCompletionSound(enabled: boolean): void {
    settings.value.playCompletionSound = enabled
  }

  /**
   * 设置每周的第一天
   */
  function setWeekStartsOn(day: 0 | 1): void {
    settings.value.weekStartsOn = day
  }

  /**
   * 设置是否启用动画
   */
  function setEnableAnimations(enabled: boolean): void {
    settings.value.enableAnimations = enabled
  }

  /**
   * 保存设置到数据存储
   */
  async function saveSettings(): Promise<void> {
    try {
      await dataStore.saveSettings(settings.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存设置失败'
      console.error('[SettingsStore] Save settings failed:', err)
      throw err
    }
  }

  /**
   * 重置设置为默认值
   */
  async function resetSettings(): Promise<void> {
    settings.value = { ...DEFAULT_SETTINGS }
    await saveSettings()
  }

  /**
   * 清除错误信息
   */
  function clearError(): void {
    error.value = null
  }

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // State
    settings,
    loading,
    error,
    initialized,

    // Actions
    initialize,
    updateSettings,
    setDefaultView,
    setDefaultSort,
    setThemeMode,
    setEnableReminders,
    setAutoDeleteCompleted,
    setAutoDeleteDelay,
    setPlayCompletionSound,
    setWeekStartsOn,
    setEnableAnimations,
    saveSettings,
    resetSettings,
    clearError,
  }
})
