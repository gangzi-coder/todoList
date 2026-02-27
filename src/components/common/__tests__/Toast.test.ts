import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Toast from '../Toast.vue'

describe('Toast 组件', () => {
  let wrapper: any

  beforeEach(() => {
    // 创建一个 body 元素用于 Teleport
    const el = document.createElement('div')
    el.id = 'app'
    document.body.appendChild(el)

    wrapper = mount(Toast, {
      attachTo: el,
    })

    // 使用假定时器
    vi.useFakeTimers()
  })

  afterEach(() => {
    wrapper.unmount()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('基本功能', () => {
    it('应该正确渲染 Toast 容器', () => {
      const container = document.querySelector('.toast-container')
      expect(container).toBeTruthy()
    })

    it('应该显示成功消息', async () => {
      wrapper.vm.success('操作成功')
      await flushPromises()

      const toast = document.querySelector('.toast-success')
      expect(toast).toBeTruthy()
      expect(toast?.textContent).toContain('操作成功')
    })

    it('应该显示错误消息', async () => {
      wrapper.vm.error('操作失败')
      await flushPromises()

      const toast = document.querySelector('.toast-error')
      expect(toast).toBeTruthy()
      expect(toast?.textContent).toContain('操作失败')
    })

    it('应该显示警告消息', async () => {
      wrapper.vm.warning('警告信息')
      await flushPromises()

      const toast = document.querySelector('.toast-warning')
      expect(toast).toBeTruthy()
      expect(toast?.textContent).toContain('警告信息')
    })

    it('应该显示信息消息', async () => {
      wrapper.vm.info('提示信息')
      await flushPromises()

      const toast = document.querySelector('.toast-info')
      expect(toast).toBeTruthy()
      expect(toast?.textContent).toContain('提示信息')
    })
  })

  describe('标题功能', () => {
    it('应该显示带标题的消息', async () => {
      wrapper.vm.success('操作成功', '成功')
      await flushPromises()

      const title = document.querySelector('.toast-title')
      const message = document.querySelector('.toast-message')

      expect(title?.textContent).toBe('成功')
      expect(message?.textContent).toBe('操作成功')
    })

    it('应该在没有标题时只显示消息', async () => {
      wrapper.vm.success('操作成功')
      await flushPromises()

      const title = document.querySelector('.toast-title')
      const message = document.querySelector('.toast-message')

      expect(title).toBeFalsy()
      expect(message?.textContent).toBe('操作成功')
    })
  })

  describe('自动隐藏功能', () => {
    it('应该在默认 5 秒后自动隐藏', async () => {
      wrapper.vm.success('操作成功')
      await flushPromises()

      let toast = document.querySelector('.toast')
      expect(toast).toBeTruthy()

      // 快进 5 秒
      vi.advanceTimersByTime(5000)
      await flushPromises()

      // 等待动画完成
      vi.advanceTimersByTime(300)
      await flushPromises()

      toast = document.querySelector('.toast')
      expect(toast).toBeFalsy()
    })

    it('应该支持自定义持续时间', async () => {
      wrapper.vm.success('操作成功', undefined, 2000)
      await flushPromises()

      let toast = document.querySelector('.toast')
      expect(toast).toBeTruthy()

      // 快进 2 秒
      vi.advanceTimersByTime(2000)
      await flushPromises()

      // 等待动画完成
      vi.advanceTimersByTime(300)
      await flushPromises()

      toast = document.querySelector('.toast')
      expect(toast).toBeFalsy()
    })

    it('应该支持持久显示（duration = 0）', async () => {
      wrapper.vm.success('操作成功', undefined, 0)
      await flushPromises()

      let toast = document.querySelector('.toast')
      expect(toast).toBeTruthy()

      // 快进 10 秒
      vi.advanceTimersByTime(10000)
      await flushPromises()

      // Toast 应该仍然存在
      toast = document.querySelector('.toast')
      expect(toast).toBeTruthy()
    })
  })

  describe('手动关闭功能', () => {
    it('应该支持点击关闭按钮关闭 Toast', async () => {
      wrapper.vm.success('操作成功')
      await flushPromises()

      let toast = document.querySelector('.toast')
      expect(toast).toBeTruthy()

      const closeButton = document.querySelector('.toast-close') as HTMLButtonElement
      expect(closeButton).toBeTruthy()

      closeButton.click()
      await flushPromises()

      // 等待动画完成
      vi.advanceTimersByTime(300)
      await flushPromises()

      toast = document.querySelector('.toast')
      expect(toast).toBeFalsy()
    })

    it('应该支持通过 ID 关闭指定 Toast', async () => {
      const id = wrapper.vm.success('操作成功')
      await flushPromises()

      let toast = document.querySelector('.toast')
      expect(toast).toBeTruthy()

      wrapper.vm.dismissToast(id)
      await flushPromises()

      // 等待动画完成
      vi.advanceTimersByTime(300)
      await flushPromises()

      toast = document.querySelector('.toast')
      expect(toast).toBeFalsy()
    })
  })

  describe('多个 Toast', () => {
    it('应该支持同时显示多个 Toast', async () => {
      wrapper.vm.success('消息 1')
      wrapper.vm.error('消息 2')
      wrapper.vm.warning('消息 3')
      await flushPromises()

      const toasts = document.querySelectorAll('.toast')
      expect(toasts.length).toBe(3)
    })

    it('应该支持清除所有 Toast', async () => {
      wrapper.vm.success('消息 1')
      wrapper.vm.error('消息 2')
      wrapper.vm.warning('消息 3')
      await flushPromises()

      let toasts = document.querySelectorAll('.toast')
      expect(toasts.length).toBe(3)

      wrapper.vm.clearAll()
      await flushPromises()

      toasts = document.querySelectorAll('.toast')
      expect(toasts.length).toBe(0)
    })

    it('应该按照添加顺序堆叠显示', async () => {
      wrapper.vm.success('第一条')
      await flushPromises()
      wrapper.vm.error('第二条')
      await flushPromises()

      const toasts = document.querySelectorAll('.toast')
      expect(toasts.length).toBe(2)

      // 第一条应该在前面
      expect(toasts[0].textContent).toContain('第一条')
      expect(toasts[1].textContent).toContain('第二条')
    })
  })

  describe('图标显示', () => {
    it('应该为成功消息显示正确的图标', async () => {
      wrapper.vm.success('操作成功')
      await flushPromises()

      const icon = document.querySelector('.toast-success .toast-icon')
      expect(icon?.textContent).toBe('✓')
    })

    it('应该为错误消息显示正确的图标', async () => {
      wrapper.vm.error('操作失败')
      await flushPromises()

      const icon = document.querySelector('.toast-error .toast-icon')
      expect(icon?.textContent).toBe('✕')
    })

    it('应该为警告消息显示正确的图标', async () => {
      wrapper.vm.warning('警告')
      await flushPromises()

      const icon = document.querySelector('.toast-warning .toast-icon')
      expect(icon?.textContent).toBe('⚠')
    })

    it('应该为信息消息显示正确的图标', async () => {
      wrapper.vm.info('提示')
      await flushPromises()

      const icon = document.querySelector('.toast-info .toast-icon')
      expect(icon?.textContent).toBe('ℹ')
    })
  })

  describe('可访问性', () => {
    it('应该有正确的 ARIA 属性', async () => {
      wrapper.vm.success('操作成功')
      await flushPromises()

      const container = document.querySelector('.toast-container')
      expect(container?.getAttribute('aria-live')).toBe('polite')
      expect(container?.getAttribute('aria-atomic')).toBe('true')

      const toast = document.querySelector('.toast')
      expect(toast?.getAttribute('role')).toBe('alert')
      expect(toast?.getAttribute('aria-label')).toContain('success消息')
    })

    it('应该为关闭按钮提供 aria-label', async () => {
      wrapper.vm.success('操作成功')
      await flushPromises()

      const closeButton = document.querySelector('.toast-close')
      expect(closeButton?.getAttribute('aria-label')).toBe('关闭消息')
    })
  })

  describe('返回值', () => {
    it('应该返回唯一的 Toast ID', () => {
      const id1 = wrapper.vm.success('消息 1')
      const id2 = wrapper.vm.success('消息 2')

      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
      expect(id1).not.toBe(id2)
    })

    it('所有方法都应该返回 Toast ID', () => {
      const successId = wrapper.vm.success('成功')
      const errorId = wrapper.vm.error('错误')
      const warningId = wrapper.vm.warning('警告')
      const infoId = wrapper.vm.info('信息')

      expect(successId).toBeTruthy()
      expect(errorId).toBeTruthy()
      expect(warningId).toBeTruthy()
      expect(infoId).toBeTruthy()
    })
  })

  describe('通用 showToast 方法', () => {
    it('应该支持通过 showToast 显示不同类型的消息', async () => {
      wrapper.vm.showToast('成功消息', { type: 'success' })
      await flushPromises()

      const toast = document.querySelector('.toast-success')
      expect(toast).toBeTruthy()
    })

    it('应该支持完整的选项配置', async () => {
      wrapper.vm.showToast('测试消息', {
        type: 'warning',
        title: '测试标题',
        duration: 3000,
      })
      await flushPromises()

      const toast = document.querySelector('.toast-warning')
      const title = document.querySelector('.toast-title')
      const message = document.querySelector('.toast-message')

      expect(toast).toBeTruthy()
      expect(title?.textContent).toBe('测试标题')
      expect(message?.textContent).toBe('测试消息')
    })

    it('应该使用默认类型 info', async () => {
      wrapper.vm.showToast('默认消息')
      await flushPromises()

      const toast = document.querySelector('.toast-info')
      expect(toast).toBeTruthy()
    })
  })

  describe('操作按钮功能（重试等）- 需求 17.2', () => {
    it('应该显示操作按钮', async () => {
      wrapper.vm.showToast('保存失败', {
        type: 'error',
        actionLabel: '重试',
        actionCallback: vi.fn(),
      })
      await flushPromises()

      const actionBtn = document.querySelector('.toast-action')
      expect(actionBtn).toBeTruthy()
      expect(actionBtn?.textContent).toBe('重试')
    })

    it('点击操作按钮应该执行回调并关闭 Toast', async () => {
      const callback = vi.fn()
      wrapper.vm.showToast('保存失败', {
        type: 'error',
        actionLabel: '重试',
        actionCallback: callback,
        duration: 0,
      })
      await flushPromises()

      const actionBtn = document.querySelector('.toast-action') as HTMLButtonElement
      expect(actionBtn).toBeTruthy()

      actionBtn.click()
      await flushPromises()

      expect(callback).toHaveBeenCalledTimes(1)

      // 等待动画完成后 Toast 应该被移除
      vi.advanceTimersByTime(300)
      await flushPromises()

      const toast = document.querySelector('.toast')
      expect(toast).toBeFalsy()
    })

    it('没有 actionLabel 时不应该显示操作按钮', async () => {
      wrapper.vm.showToast('普通消息', { type: 'info' })
      await flushPromises()

      const actionBtn = document.querySelector('.toast-action')
      expect(actionBtn).toBeFalsy()
    })

    it('带重试的错误消息设置 duration=0 时不应自动隐藏', async () => {
      wrapper.vm.showToast('保存失败', {
        type: 'error',
        actionLabel: '重试',
        actionCallback: vi.fn(),
        duration: 0,
      })
      await flushPromises()

      // 快进 10 秒
      vi.advanceTimersByTime(10000)
      await flushPromises()

      // Toast 应该仍然存在
      const toast = document.querySelector('.toast')
      expect(toast).toBeTruthy()
    })
  })
})
