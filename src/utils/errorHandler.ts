/**
 * 全局错误处理工具
 *
 * 提供统一的错误处理机制，将错误转换为用户友好的提示消息，
 * 并通过 Toast 系统显示给用户。
 *
 * 需求 17.1: 数据加载失败时显示友好的错误提示信息
 * 需求 17.2: 数据保存失败时显示错误提示
 * 需求 17.4: 未预期的错误显示通用错误提示并记录错误日志
 * 需求 17.8: 确保错误不会导致应用崩溃或数据丢失
 */

import type { App } from 'vue'

/** 错误严重级别 */
export type ErrorSeverity = 'error' | 'warning' | 'info'

/** 错误处理回调类型 */
export type ErrorNotifyFn = (message: string, type: 'error' | 'warning' | 'info') => void

/** 全局通知回调，由 App.vue 注册 */
let _notifyFn: ErrorNotifyFn | null = null

/**
 * 注册错误通知回调
 * 在 App.vue 挂载后调用，将 Toast 系统连接到错误处理器
 */
export function registerErrorNotify(fn: ErrorNotifyFn): void {
  _notifyFn = fn
}

/**
 * 取消注册错误通知回调
 */
export function unregisterErrorNotify(): void {
  _notifyFn = null
}

/**
 * 将错误对象转换为用户友好的消息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // 网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return '网络连接失败，请检查网络设置'
    }
    // 超时错误
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return '操作超时，请稍后重试'
    }
    // 数据存储相关错误
    if (error.message.includes('storage') || error.message.includes('quota')) {
      return '存储空间不足，请清理数据后重试'
    }
    // 有明确消息的错误直接返回
    if (error.message && error.message.length < 100) {
      return error.message
    }
    return '操作失败，请稍后重试'
  }
  if (typeof error === 'string') {
    return error.length < 100 ? error : '操作失败，请稍后重试'
  }
  return '发生未知错误，请稍后重试'
}

/**
 * 处理错误：记录日志并显示用户提示
 */
export function handleError(
  error: unknown,
  context?: string,
  severity: ErrorSeverity = 'error'
): void {
  // 记录错误日志到控制台
  const prefix = context ? `[${context}]` : '[错误]'
  if (severity === 'error') {
    console.error(prefix, error)
  } else if (severity === 'warning') {
    console.warn(prefix, error)
  } else {
    console.info(prefix, error)
  }

  // 显示用户友好的提示
  const message = getErrorMessage(error)
  if (_notifyFn) {
    _notifyFn(message, severity)
  }
}

/**
 * 安装全局错误处理器到 Vue 应用
 * - Vue 组件错误处理器 (app.config.errorHandler)
 * - 未处理的 Promise 拒绝 (unhandledrejection)
 * - 全局 JS 错误 (error 事件)
 */
export function setupGlobalErrorHandlers(app: App): () => void {
  // Vue 组件错误处理器：捕获组件渲染和生命周期中的错误
  app.config.errorHandler = (err, _instance, info) => {
    handleError(err, `Vue 组件错误 - ${info}`)
  }

  // 未处理的 Promise 拒绝
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.preventDefault()
    handleError(event.reason, '未处理的 Promise 错误')
  }

  // 全局 JS 错误
  const onGlobalError = (event: ErrorEvent) => {
    // 忽略跨域脚本错误（无法获取详细信息）
    if (event.message === 'Script error.' && !event.filename) {
      return
    }
    event.preventDefault()
    handleError(event.error || event.message, '全局错误')
  }

  window.addEventListener('unhandledrejection', onUnhandledRejection)
  window.addEventListener('error', onGlobalError)

  // 返回清理函数
  return () => {
    window.removeEventListener('unhandledrejection', onUnhandledRejection)
    window.removeEventListener('error', onGlobalError)
  }
}
