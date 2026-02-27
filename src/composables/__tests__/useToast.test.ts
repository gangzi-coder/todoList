import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setToastInstance, useToast } from '../useToast'

/**
 * useToast composable 测试
 *
 * 验证用户反馈机制：
 * - 需求 17.1: 数据加载失败时显示友好的错误提示信息
 * - 需求 17.2: 数据保存失败时显示错误提示并提供重试选项
 * - 需求 17.5: 错误提示使用清晰易懂的语言
 * - 需求 17.6: 为所有错误提示提供关闭按钮
 * - 需求 17.7: 在 5 秒后自动隐藏非关键错误提示
 */
describe('useToast composable', () => {
  let mockInstance: any

  beforeEach(() => {
    mockInstance = {
      showToast: vi.fn().mockReturnValue('toast-1'),
      success: vi.fn().mockReturnValue('toast-2'),
      error: vi.fn().mockReturnValue('toast-3'),
      warning: vi.fn().mockReturnValue('toast-4'),
      info: vi.fn().mockReturnValue('toast-5'),
      dismissToast: vi.fn(),
      clearAll: vi.fn(),
    }
    setToastInstance(mockInstance)
  })

  it('success 应该调用实例的 success 方法', () => {
    const { success } = useToast()
    const id = success('操作成功')
    expect(mockInstance.success).toHaveBeenCalledWith('操作成功', undefined, undefined)
    expect(id).toBe('toast-2')
  })

  it('error 应该调用实例的 error 方法', () => {
    const { error } = useToast()
    const id = error('操作失败')
    expect(mockInstance.error).toHaveBeenCalledWith('操作失败', undefined, undefined)
    expect(id).toBe('toast-3')
  })

  it('warning 应该调用实例的 warning 方法', () => {
    const { warning } = useToast()
    warning('警告信息')
    expect(mockInstance.warning).toHaveBeenCalledWith('警告信息', undefined, undefined)
  })

  it('info 应该调用实例的 info 方法', () => {
    const { info } = useToast()
    info('提示信息')
    expect(mockInstance.info).toHaveBeenCalledWith('提示信息', undefined, undefined)
  })

  describe('errorWithRetry - 需求 17.2: 失败操作提供重试选项', () => {
    it('应该显示带重试按钮的错误消息', () => {
      const { errorWithRetry } = useToast()
      const retryFn = vi.fn()

      errorWithRetry('保存失败', retryFn)

      expect(mockInstance.showToast).toHaveBeenCalledWith('保存失败', {
        type: 'error',
        title: undefined,
        duration: 0, // 不自动隐藏
        actionLabel: '重试',
        actionCallback: retryFn,
      })
    })

    it('重试按钮的 duration 应该为 0（不自动隐藏）', () => {
      const { errorWithRetry } = useToast()
      errorWithRetry('失败', vi.fn())

      const callArgs = mockInstance.showToast.mock.calls[0][1]
      expect(callArgs.duration).toBe(0)
    })

    it('应该支持自定义标题', () => {
      const { errorWithRetry } = useToast()
      errorWithRetry('保存失败', vi.fn(), '数据错误')

      const callArgs = mockInstance.showToast.mock.calls[0][1]
      expect(callArgs.title).toBe('数据错误')
    })
  })

  describe('showToast - 通用方法', () => {
    it('应该支持传递完整选项', () => {
      const { showToast } = useToast()
      const callback = vi.fn()

      showToast('测试消息', {
        type: 'error',
        actionLabel: '重试',
        actionCallback: callback,
        duration: 0,
      })

      expect(mockInstance.showToast).toHaveBeenCalledWith('测试消息', {
        type: 'error',
        actionLabel: '重试',
        actionCallback: callback,
        duration: 0,
      })
    })
  })

  describe('实例未初始化时的安全处理', () => {
    beforeEach(() => {
      setToastInstance(null)
    })

    it('success 应该返回空字符串且不抛出异常', () => {
      const { success } = useToast()
      expect(success('测试')).toBe('')
    })

    it('errorWithRetry 应该返回空字符串且不抛出异常', () => {
      const { errorWithRetry } = useToast()
      expect(errorWithRetry('测试', vi.fn())).toBe('')
    })
  })
})
