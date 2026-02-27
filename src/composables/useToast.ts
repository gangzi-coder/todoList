import { ref, type Ref } from 'vue'

/** Toast 消息类型 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

/**
 * Toast 实例引用
 */
let toastInstance: Ref<any> | null = null

/**
 * 设置 Toast 实例
 */
export const setToastInstance = (instance: any) => {
  toastInstance = ref(instance)
}

/**
 * Toast 选项接口
 */
export interface ToastOptions {
  type?: ToastType
  title?: string
  duration?: number
  /** 操作按钮文本（如"重试"） */
  actionLabel?: string
  /** 操作按钮回调 */
  actionCallback?: () => void
}

/**
 * useToast Composable
 * 
 * 提供全局 Toast 消息功能
 */
export const useToast = () => {
  /**
   * 显示 Toast 消息
   */
  const showToast = (message: string, options?: ToastOptions): string => {
    if (!toastInstance?.value) {
      console.warn('Toast instance not initialized')
      return ''
    }
    return toastInstance.value.showToast(message, options)
  }

  /**
   * 显示成功消息
   */
  const success = (message: string, title?: string, duration?: number): string => {
    if (!toastInstance?.value) {
      console.warn('Toast instance not initialized')
      return ''
    }
    return toastInstance.value.success(message, title, duration)
  }

  /**
   * 显示错误消息
   */
  const error = (message: string, title?: string, duration?: number): string => {
    if (!toastInstance?.value) {
      console.warn('Toast instance not initialized')
      return ''
    }
    return toastInstance.value.error(message, title, duration)
  }

  /**
   * 显示警告消息
   */
  const warning = (message: string, title?: string, duration?: number): string => {
    if (!toastInstance?.value) {
      console.warn('Toast instance not initialized')
      return ''
    }
    return toastInstance.value.warning(message, title, duration)
  }

  /**
   * 显示信息消息
   */
  const info = (message: string, title?: string, duration?: number): string => {
    if (!toastInstance?.value) {
      console.warn('Toast instance not initialized')
      return ''
    }
    return toastInstance.value.info(message, title, duration)
  }

  /**
   * 显示带重试按钮的错误消息
   * 需求 17.2: 数据保存失败时显示错误提示并提供重试选项
   */
  const errorWithRetry = (message: string, retryFn: () => void, title?: string): string => {
    return showToast(message, {
      type: 'error',
      title,
      duration: 0, // 带重试的错误不自动隐藏
      actionLabel: '重试',
      actionCallback: retryFn,
    })
  }

  /**
   * 关闭指定 Toast
   */
  const dismissToast = (id: string): void => {
    if (!toastInstance?.value) {
      console.warn('Toast instance not initialized')
      return
    }
    toastInstance.value.dismissToast(id)
  }

  /**
   * 清除所有 Toast
   */
  const clearAll = (): void => {
    if (!toastInstance?.value) {
      console.warn('Toast instance not initialized')
      return
    }
    toastInstance.value.clearAll()
  }

  return {
    showToast,
    success,
    error,
    warning,
    info,
    errorWithRetry,
    dismissToast,
    clearAll,
  }
}
