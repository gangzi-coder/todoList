/**
 * Modal 组件单元测试
 * 
 * 验证 Modal 组件的核心功能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../Modal.vue'

describe('Modal 组件', () => {
  const globalStubs = {
    global: {
      stubs: {
        Teleport: true,
      },
    },
  }

  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = ''
  })

  it('应该正确渲染模态框', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        content: '测试内容',
      },
      ...globalStubs,
    })

    expect(wrapper.find('.modal-title').text()).toBe('测试标题')
    expect(wrapper.find('.modal-body').text()).toContain('测试内容')
  })

  it('当 modelValue 为 false 时不应该显示', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: false,
        title: '测试标题',
      },
      ...globalStubs,
    })

    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('点击确认按钮应该触发 confirm 事件', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
      },
      ...globalStubs,
    })

    await wrapper.find('.modal-button-confirm').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('点击取消按钮应该触发 cancel 事件和关闭模态框', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
      },
      ...globalStubs,
    })

    await wrapper.find('.modal-button-cancel').trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
  })

  it('点击关闭按钮应该关闭模态框', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
      },
      ...globalStubs,
    })

    await wrapper.find('.modal-close').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('点击遮罩应该关闭模态框（当 closeOnClickOverlay 为 true）', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        closeOnClickOverlay: true,
      },
      ...globalStubs,
    })

    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('点击遮罩不应该关闭模态框（当 closeOnClickOverlay 为 false）', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        closeOnClickOverlay: false,
      },
      ...globalStubs,
    })

    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('按 Esc 键应该关闭模态框（当 closeOnEscape 为 true）', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        closeOnEscape: true,
      },
      ...globalStubs,
    })

    await wrapper.find('.modal-overlay').trigger('keydown.esc')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('按 Esc 键不应该关闭模态框（当 closeOnEscape 为 false）', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        closeOnEscape: false,
      },
      ...globalStubs,
    })

    await wrapper.find('.modal-overlay').trigger('keydown.esc')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('应该支持自定义按钮文本', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        confirmText: '保存',
        cancelText: '放弃',
      },
      ...globalStubs,
    })

    expect(wrapper.find('.modal-button-confirm').text()).toBe('保存')
    expect(wrapper.find('.modal-button-cancel').text()).toBe('放弃')
  })

  it('应该支持隐藏取消按钮', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        showCancel: false,
      },
      ...globalStubs,
    })

    expect(wrapper.find('.modal-button-cancel').exists()).toBe(false)
    expect(wrapper.find('.modal-button-confirm').exists()).toBe(true)
  })

  it('应该支持隐藏确认按钮', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        showConfirm: false,
      },
      ...globalStubs,
    })

    expect(wrapper.find('.modal-button-confirm').exists()).toBe(false)
    expect(wrapper.find('.modal-button-cancel').exists()).toBe(true)
  })

  it('应该支持危险样式的确认按钮', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        confirmDanger: true,
      },
      ...globalStubs,
    })

    expect(wrapper.find('.modal-button-confirm').classes()).toContain('modal-button-danger')
  })

  it('应该支持不同尺寸', () => {
    const smallWrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        size: 'small',
      },
      ...globalStubs,
    })

    const largeWrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        size: 'large',
      },
      ...globalStubs,
    })

    expect(smallWrapper.find('.modal-container').classes()).toContain('modal-small')
    expect(largeWrapper.find('.modal-container').classes()).toContain('modal-large')
  })

  it('应该支持自定义内容插槽', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
      },
      slots: {
        default: '<div class="custom-content">自定义内容</div>',
      },
      ...globalStubs,
    })

    expect(wrapper.find('.custom-content').exists()).toBe(true)
    expect(wrapper.find('.custom-content').text()).toBe('自定义内容')
  })

  it('应该支持自定义底部插槽', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
      },
      slots: {
        footer: '<button class="custom-button">自定义按钮</button>',
      },
      ...globalStubs,
    })

    expect(wrapper.find('.custom-button').exists()).toBe(true)
  })

  it('应该包含正确的 ARIA 属性', () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
      },
      ...globalStubs,
    })

    const overlay = wrapper.find('.modal-overlay')
    expect(overlay.attributes('role')).toBe('dialog')
    expect(overlay.attributes('aria-modal')).toBe('true')
    expect(overlay.attributes('aria-labelledby')).toBeTruthy()

    const closeButton = wrapper.find('.modal-close')
    expect(closeButton.attributes('aria-label')).toBe('关闭对话框')
  })

  it('点击模态框内容区域不应该关闭模态框', async () => {
    const wrapper = mount(Modal, {
      props: {
        modelValue: true,
        title: '测试标题',
        closeOnClickOverlay: true,
      },
      ...globalStubs,
    })

    await wrapper.find('.modal-container').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })
})
