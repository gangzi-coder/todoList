/**
 * useTheme Composable
 * 
 * 实现主题切换逻辑、系统主题检测
 * 
 * 验收标准：
 * - 需求 13.2: 支持亮色和暗色两种主题模式
 * - 需求 13.3: 根据系统主题自动切换应用主题
 */

import { computed, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUIStore } from '@/stores/uiStore'
import { useSettingsStore } from '@/stores/settingsStore'

/**
 * 主题 Composable
 * 
 * 提供主题切换和系统主题检测功能
 */
export function useTheme() {
  const uiStore = useUIStore()
  const settingsStore = useSettingsStore()

  // 使用 storeToRefs 保持响应性
  const { themeMode, activeTheme, isDarkTheme } = storeToRefs(uiStore)
  const { settings } = storeToRefs(settingsStore)

  /**
   * 是否为自动模式
   */
  const isAutoMode = computed(() => themeMode.value === 'auto')

  /**
   * 是否为亮色主题
   */
  const isLightTheme = computed(() => activeTheme.value === 'light')

  /**
   * 检测系统主题偏好
   */
  const detectSystemTheme = (): 'light' | 'dark' => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  }

  /**
   * 设置主题模式
   */
  const setThemeMode = (mode: 'auto' | 'light' | 'dark'): void => {
    uiStore.setThemeMode(mode)
    settingsStore.setThemeMode(mode)
  }

  /**
   * 切换主题（在 light 和 dark 之间切换）
   */
  const toggleTheme = (): void => {
    uiStore.toggleTheme()
    
    // 同步到设置
    settingsStore.setThemeMode(themeMode.value)
  }

  /**
   * 切换到亮色主题
   */
  const setLightTheme = (): void => {
    setThemeMode('light')
  }

  /**
   * 切换到暗色主题
   */
  const setDarkTheme = (): void => {
    setThemeMode('dark')
  }

  /**
   * 切换到自动模式
   */
  const setAutoTheme = (): void => {
    setThemeMode('auto')
  }

  /**
   * 应用主题到 DOM
   */
  const applyTheme = (): void => {
    const html = document.documentElement
    
    if (activeTheme.value === 'dark') {
      html.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
    } else {
      html.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
    }
  }

  /**
   * 更新实际应用的主题
   */
  const updateActiveTheme = (): void => {
    uiStore.updateActiveTheme()
  }

  /**
   * 初始化主题
   */
  const initializeTheme = (): void => {
    // 从设置中加载主题模式
    if (settings.value.themeMode) {
      uiStore.setThemeMode(settings.value.themeMode)
    }

    // 初始化主题
    uiStore.initializeTheme()

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (themeMode.value === 'auto') {
        updateActiveTheme()
      }
    }

    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange)
    }
  }

  /**
   * 获取主题显示名称
   */
  const getThemeDisplayName = (mode: 'auto' | 'light' | 'dark'): string => {
    const names = {
      auto: '自动',
      light: '亮色',
      dark: '暗色',
    }
    return names[mode]
  }

  /**
   * 获取当前主题的图标
   */
  const getThemeIcon = (): string => {
    if (themeMode.value === 'auto') {
      return '🌓'
    }
    return activeTheme.value === 'dark' ? '🌙' : '☀️'
  }

  // 监听 activeTheme 变化，应用到 DOM
  watch(
    activeTheme,
    () => {
      applyTheme()
    },
    { immediate: true }
  )

  // 组件挂载时初始化主题
  onMounted(() => {
    initializeTheme()
  })

  return {
    // State
    themeMode,
    activeTheme,
    isDarkTheme,
    isLightTheme,
    isAutoMode,

    // Methods
    setThemeMode,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setAutoTheme,
    detectSystemTheme,
    initializeTheme,
    getThemeDisplayName,
    getThemeIcon,
  }
}
