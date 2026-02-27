import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DatePicker from '../DatePicker.vue'
import { formatDate, addDays } from '../../../utils/date'

describe('DatePicker 组件', () => {
  beforeEach(() => {
    // 清理 DOM
    document.body.innerHTML = ''
  })

  it('应该正确渲染', () => {
    const wrapper = mount(DatePicker, {
      props: {
        placeholder: '选择日期'
      }
    })

    expect(wrapper.find('.date-picker').exists()).toBe(true)
    expect(wrapper.find('.date-picker-input').exists()).toBe(true)
    expect(wrapper.find('input').attributes('placeholder')).toBe('选择日期')
  })

  it('应该显示选中的日期', () => {
    const testDate = new Date(2024, 0, 15) // 2024-01-15
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: testDate
      }
    })

    const input = wrapper.find<HTMLInputElement>('.date-picker-input')
    expect(input.element.value).toBe(formatDate(testDate, 'date'))
  })

  it('应该在启用时间时显示完整日期时间', () => {
    const testDate = new Date(2024, 0, 15, 14, 30) // 2024-01-15 14:30
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: testDate,
        enableTime: true
      }
    })

    const input = wrapper.find<HTMLInputElement>('.date-picker-input')
    expect(input.element.value).toBe(formatDate(testDate, 'full'))
  })

  it('应该在点击输入框时打开选择器', async () => {
    const wrapper = mount(DatePicker, {
      attachTo: document.body
    })

    const input = wrapper.find('.date-picker-input')
    await input.trigger('focus')

    // 等待 nextTick
    await wrapper.vm.$nextTick()

    // 面板应该通过 Teleport 渲染到 body
    expect(document.querySelector('.date-picker-panel')).toBeTruthy()
  })

  it('应该在禁用时不可交互', () => {
    const wrapper = mount(DatePicker, {
      props: {
        disabled: true
      }
    })

    const input = wrapper.find<HTMLInputElement>('.date-picker-input')
    expect(input.element.disabled).toBe(true)

    const icon = wrapper.find<HTMLButtonElement>('.date-picker-icon')
    expect(icon.element.disabled).toBe(true)
  })

  it('应该触发 update:modelValue 事件', async () => {
    const wrapper = mount(DatePicker, {
      attachTo: document.body
    })

    // 打开选择器
    await wrapper.find('.date-picker-input').trigger('focus')
    await wrapper.vm.$nextTick()

    // 点击确定按钮
    const confirmButton = document.querySelector('.date-picker-button-confirm') as HTMLElement
    if (confirmButton) {
      confirmButton.click()
      await wrapper.vm.$nextTick()
    }

    // 应该触发事件
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
  })

  it('应该支持清除日期', async () => {
    const testDate = new Date(2024, 0, 15)
    const wrapper = mount(DatePicker, {
      props: {
        modelValue: testDate
      },
      attachTo: document.body
    })

    // 打开选择器
    await wrapper.find('.date-picker-input').trigger('focus')
    await wrapper.vm.$nextTick()

    // 点击清除按钮
    const clearButton = document.querySelector('.date-picker-button-clear') as HTMLElement
    if (clearButton) {
      clearButton.click()
      await wrapper.vm.$nextTick()
    }

    // 应该触发 null 值
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[emitted.length - 1]).toEqual([null])
    }
  })

  it('应该显示快捷选项', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        showShortcuts: true
      },
      attachTo: document.body
    })

    // 打开选择器
    await wrapper.find('.date-picker-input').trigger('focus')
    await wrapper.vm.$nextTick()

    // 应该显示快捷选项
    const shortcuts = document.querySelectorAll('.date-picker-shortcut')
    expect(shortcuts.length).toBeGreaterThan(0)
  })

  it('应该隐藏快捷选项', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        showShortcuts: false
      },
      attachTo: document.body
    })

    // 打开选择器
    await wrapper.find('.date-picker-input').trigger('focus')
    await wrapper.vm.$nextTick()

    // 不应该显示快捷选项
    const shortcuts = document.querySelector('.date-picker-shortcuts')
    expect(shortcuts).toBeFalsy()
  })

  it('应该在启用时间时显示时间输入', async () => {
    const wrapper = mount(DatePicker, {
      props: {
        enableTime: true
      },
      attachTo: document.body
    })

    // 打开选择器
    await wrapper.find('.date-picker-input').trigger('focus')
    await wrapper.vm.$nextTick()

    // 应该显示时间输入
    const timeInputs = document.querySelectorAll('.date-picker-time-input')
    expect(timeInputs.length).toBe(2) // 小时和分钟
  })

  it('应该支持 Escape 键关闭', async () => {
    const wrapper = mount(DatePicker, {
      attachTo: document.body
    })

    // 打开选择器
    await wrapper.find('.date-picker-input').trigger('focus')
    await wrapper.vm.$nextTick()

    expect(document.querySelector('.date-picker-panel')).toBeTruthy()

    // 按 Escape 键
    await wrapper.find('.date-picker-input').trigger('keydown', { key: 'Escape' })
    await wrapper.vm.$nextTick()

    // 面板应该关闭
    expect(document.querySelector('.date-picker-panel')).toBeFalsy()
  })

  it('应该正确处理日期范围限制', async () => {
    const minDate = new Date(2024, 0, 10)
    const maxDate = new Date(2024, 0, 20)
    
    const wrapper = mount(DatePicker, {
      props: {
        minDate,
        maxDate
      },
      attachTo: document.body
    })

    // 打开选择器
    await wrapper.find('.date-picker-input').trigger('focus')
    await wrapper.vm.$nextTick()

    // 检查是否有禁用的日期
    const disabledDays = document.querySelectorAll('.date-picker-day-disabled')
    expect(disabledDays.length).toBeGreaterThan(0)
  })
})
