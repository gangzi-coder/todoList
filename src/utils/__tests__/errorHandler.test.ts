import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import {
  getErrorMessage,
  handleError,
  registerErrorNotify,
  unregisterErrorNotify,
  setupGlobalErrorHandlers,
} from '../errorHandler'

describe('errorHandler 全局错误处理工具', () => {
  beforeEach(() => {
    unregisterErrorNotify()
  })

  afterEach(() => {
    unregisterErrorNotify()
    vi.restoreAllMocks()
  })

  describe('getErrorMessage', () => {
    it('应该将 Error 对象转换为消息字符串', () => {
      const error = new Error('测试错误')
      expect(getErrorMessage(error)).toBe('测试错误')
    })

    it('应该将字符串错误直接返回', () => {
      expect(getErrorMessage('字符串错误')).toBe('字符串错误')
    })

    it('应该对未知类型返回通用消息', () => {
      expect(getErrorMessage(null)).toBe('发生未知错误，请稍后重试')
      expect(getErrorMessage(undefined)).toBe('发生未知错误，请稍后重试')
      expect(getErrorMessage(42)).toBe('发生未知错误，请稍后重试')
    })

    it('应该识别网络错误并返回友好消息', () => {
      const error = new TypeError('Failed to fetch')
      expect(getErrorMessage(error)).toBe('网络连接失败，请检查网络设置')
    })

    it('应该识别超时错误', () => {
      const error = new Error('Request timeout')
      error.name = 'AbortError'
      expect(getErrorMessage(error)).toBe('操作超时，请稍后重试')
    })

    it('应该识别存储空间错误', () => {
      const error = new Error('quota exceeded in storage')
      expect(getErrorMessage(error)).toBe('存储空间不足，请清理数据后重试')
    })

    it('应该截断过长的错误消息', () => {
      const longMessage = 'a'.repeat(200)
      const error = new Error(longMessage)
      expect(getErrorMessage(error)).toBe('操作失败，请稍后重试')
    })

    it('应该截断过长的字符串错误', () => {
      const longString = 'b'.repeat(200)
      expect(getErrorMessage(longString)).toBe('操作失败，请稍后重试')
    })
  })

  describe('handleError', () => {
    it('应该将错误记录到控制台', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      handleError(new Error('测试'), '测试上下文')
      expect(consoleSpy).toHaveBeenCalledWith('[测试上下文]', expect.any(Error))
    })

    it('应该在没有上下文时使用默认前缀', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      handleError(new Error('测试'))
      expect(consoleSpy).toHaveBeenCalledWith('[错误]', expect.any(Error))
    })

    it('应该根据严重级别使用不同的 console 方法', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      handleError('警告', '测试', 'warning')
      expect(warnSpy).toHaveBeenCalled()

      handleError('信息', '测试', 'info')
      expect(infoSpy).toHaveBeenCalled()
    })

    it('应该调用已注册的通知回调', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const notifyFn = vi.fn()
      registerErrorNotify(notifyFn)

      handleError(new Error('测试错误'), '上下文')
      expect(notifyFn).toHaveBeenCalledWith('测试错误', 'error')
    })

    it('应该在没有注册回调时不抛出异常', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      expect(() => handleError(new Error('测试'))).not.toThrow()
    })
  })

  describe('registerErrorNotify / unregisterErrorNotify', () => {
    it('应该注册和取消注册通知回调', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const notifyFn = vi.fn()

      registerErrorNotify(notifyFn)
      handleError(new Error('测试'))
      expect(notifyFn).toHaveBeenCalledTimes(1)

      unregisterErrorNotify()
      handleError(new Error('测试2'))
      // 取消注册后不应再调用
      expect(notifyFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('setupGlobalErrorHandlers', () => {
    it('应该设置 Vue 错误处理器', () => {
      const app = createApp(defineComponent({ render: () => h('div') }))
      const cleanup = setupGlobalErrorHandlers(app)

      expect(app.config.errorHandler).toBeDefined()
      cleanup()
    })

    it('Vue 错误处理器应该调用 handleError', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const notifyFn = vi.fn()
      registerErrorNotify(notifyFn)

      const app = createApp(defineComponent({ render: () => h('div') }))
      const cleanup = setupGlobalErrorHandlers(app)

      // 模拟 Vue 错误
      const testError = new Error('组件错误')
      app.config.errorHandler!(testError, null, 'render function')

      expect(notifyFn).toHaveBeenCalledWith('组件错误', 'error')
      cleanup()
    })

    it('应该捕获未处理的 Promise 拒绝', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const notifyFn = vi.fn()
      registerErrorNotify(notifyFn)

      const app = createApp(defineComponent({ render: () => h('div') }))
      const cleanup = setupGlobalErrorHandlers(app)

      // 模拟 unhandledrejection 事件
      const event = new Event('unhandledrejection') as any
      event.reason = new Error('Promise 错误')
      event.preventDefault = vi.fn()
      window.dispatchEvent(event)

      expect(notifyFn).toHaveBeenCalledWith('Promise 错误', 'error')
      cleanup()
    })

    it('应该捕获全局 JS 错误', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const notifyFn = vi.fn()
      registerErrorNotify(notifyFn)

      const app = createApp(defineComponent({ render: () => h('div') }))
      const cleanup = setupGlobalErrorHandlers(app)

      // 模拟全局错误事件
      const event = new ErrorEvent('error', {
        error: new Error('全局 JS 错误'),
        message: '全局 JS 错误',
        filename: 'test.js',
      })
      window.dispatchEvent(event)

      expect(notifyFn).toHaveBeenCalledWith('全局 JS 错误', 'error')
      cleanup()
    })

    it('应该忽略跨域脚本错误', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const notifyFn = vi.fn()
      registerErrorNotify(notifyFn)

      const app = createApp(defineComponent({ render: () => h('div') }))
      const cleanup = setupGlobalErrorHandlers(app)

      // 模拟跨域脚本错误（无 filename）
      const event = new ErrorEvent('error', {
        message: 'Script error.',
        filename: '',
      })
      window.dispatchEvent(event)

      expect(notifyFn).not.toHaveBeenCalled()
      cleanup()
    })

    it('cleanup 函数应该移除事件监听器', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const notifyFn = vi.fn()
      registerErrorNotify(notifyFn)

      const app = createApp(defineComponent({ render: () => h('div') }))
      const cleanup = setupGlobalErrorHandlers(app)
      cleanup()

      // 清理后不应再触发通知
      const event = new Event('unhandledrejection') as any
      event.reason = new Error('清理后的错误')
      event.preventDefault = vi.fn()
      window.dispatchEvent(event)

      expect(notifyFn).not.toHaveBeenCalled()
    })
  })
})
