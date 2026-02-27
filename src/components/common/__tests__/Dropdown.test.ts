/**
 * Dropdown 组件单元测试
 * 
 * 测试 Dropdown 组件的核心功能：
 * - 单选和多选模式
 * - 搜索过滤
 * - 键盘导航
 * - 可访问性
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Dropdown from '../Dropdown.vue'

describe('Dropdown 组件', () => {
  let wrapper: VueWrapper<any>

  const options = [
    { label: '选项一', value: 'option-1' },
    { label: '选项二', value: 'option-2' },
    { label: '选项三', value: 'option-3' },
  ]

  beforeEach(() => {
    // 清理之前的测试
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('基础功能', () => {
    it('应该正确渲染', () => {
      wrapper = mount(Dropdown, {
        props: {
          options,
          placeholder: '请选择',
        },
      })

      expect(wrapper.find('.dropdown').exists()).toBe(true)
      expect(wrapper.find('.dropdown-trigger').exists()).toBe(true)
      expect(wrapper.find('.dropdown-trigger-text').text()).toBe('请选择')
    })

    it('应该显示选中的值', () => {
      wrapper = mount(Dropdown, {
        props: {
          modelValue: 'option-2',
          options,
        },
      })

      expect(wrapper.find('.dropdown-trigger-text').text()).toBe('选项二')
    })

    it('点击触发按钮应该打开/关闭下拉菜单', async () => {
      wrapper = mount(Dropdown, {
        props: { options },
        attachTo: document.body,
      })

      const trigger = wrapper.find('.dropdown-trigger')
      
      // 初始状态应该是关闭的
      expect(wrapper.vm.isOpen).toBe(false)

      // 点击打开
      await trigger.trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      // 再次点击关闭
      await trigger.trigger('click')
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('单选模式', () => {
    it('应该正确选择选项', async () => {
      wrapper = mount(Dropdown, {
        props: {
          modelValue: '',
          options,
        },
        attachTo: document.body,
      })

      // 打开下拉菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      // 选择第二个选项
      const dropdownOptions = document.querySelectorAll('.dropdown-option')
      expect(dropdownOptions.length).toBe(3)

      // 模拟点击
      ;(dropdownOptions[1] as HTMLElement).click()
      await wrapper.vm.$nextTick()

      // 检查是否触发了 update:modelValue 事件
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option-2'])
      expect(wrapper.emitted('change')?.[0]).toEqual(['option-2'])
    })

    it('选择后应该关闭下拉菜单', async () => {
      wrapper = mount(Dropdown, {
        props: {
          modelValue: '',
          options,
        },
        attachTo: document.body,
      })

      // 打开下拉菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      // 选择选项
      const dropdownOptions = document.querySelectorAll('.dropdown-option')
      ;(dropdownOptions[0] as HTMLElement).click()
      await wrapper.vm.$nextTick()

      // 应该关闭
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('多选模式', () => {
    it('应该支持多选', async () => {
      wrapper = mount(Dropdown, {
        props: {
          modelValue: [],
          options,
          multiple: true,
          'onUpdate:modelValue': (value: any) => {
            wrapper.setProps({ modelValue: value })
          },
        },
        attachTo: document.body,
      })

      // 打开下拉菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      // 选择第一个选项
      const dropdownOptions = document.querySelectorAll('.dropdown-option')
      ;(dropdownOptions[0] as HTMLElement).click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['option-1']])

      // 选择第二个选项
      ;(dropdownOptions[1] as HTMLElement).click()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([['option-1', 'option-2']])
    })

    it('多选模式下点击选项不应该关闭菜单', async () => {
      wrapper = mount(Dropdown, {
        props: {
          modelValue: [],
          options,
          multiple: true,
        },
        attachTo: document.body,
      })

      // 打开下拉菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      // 选择选项
      const dropdownOptions = document.querySelectorAll('.dropdown-option')
      ;(dropdownOptions[0] as HTMLElement).click()
      await wrapper.vm.$nextTick()

      // 应该仍然打开
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('应该显示多个选中项', () => {
      wrapper = mount(Dropdown, {
        props: {
          modelValue: ['option-1', 'option-2'],
          options,
          multiple: true,
        },
      })

      expect(wrapper.find('.dropdown-trigger-text').text()).toBe('选项一, 选项二')
    })
  })

  describe('搜索功能', () => {
    it('应该显示搜索框', async () => {
      wrapper = mount(Dropdown, {
        props: {
          options,
          searchable: true,
        },
        attachTo: document.body,
      })

      // 打开下拉菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      expect(document.querySelector('.dropdown-search')).toBeTruthy()
      expect(document.querySelector('.dropdown-search-input')).toBeTruthy()
    })

    it('应该根据搜索词过滤选项', async () => {
      wrapper = mount(Dropdown, {
        props: {
          options,
          searchable: true,
        },
        attachTo: document.body,
      })

      // 打开下拉菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      // 输入搜索词
      wrapper.vm.searchQuery = '二'
      await wrapper.vm.$nextTick()

      // 应该只显示匹配的选项
      expect(wrapper.vm.filteredOptions.length).toBe(1)
      expect(wrapper.vm.filteredOptions[0].value).toBe('option-2')
    })

    it('搜索无结果时应该显示空状态', async () => {
      wrapper = mount(Dropdown, {
        props: {
          options,
          searchable: true,
          emptyText: '无匹配选项',
        },
        attachTo: document.body,
      })

      // 打开下拉菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      // 输入不匹配的搜索词
      wrapper.vm.searchQuery = 'xyz'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.filteredOptions.length).toBe(0)
      expect(document.querySelector('.dropdown-empty')?.textContent).toContain('无匹配选项')
    })
  })

  describe('键盘导航', () => {
    it('按 Enter 键应该打开下拉菜单', async () => {
      wrapper = mount(Dropdown, {
        props: { options },
        attachTo: document.body,
      })

      const trigger = wrapper.find('.dropdown-trigger')
      await trigger.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('按 Escape 键应该关闭下拉菜单', async () => {
      wrapper = mount(Dropdown, {
        props: { options },
        attachTo: document.body,
      })

      // 打开菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.isOpen).toBe(true)

      // 按 Escape
      await wrapper.vm.handleMenuKeydown({ key: 'Escape', preventDefault: vi.fn() })
      
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('按上下箭头应该移动焦点', async () => {
      wrapper = mount(Dropdown, {
        props: { options },
        attachTo: document.body,
      })

      // 打开菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.focusedIndex).toBe(0)

      // 按下箭头
      await wrapper.vm.handleMenuKeydown({ key: 'ArrowDown', preventDefault: vi.fn() })
      expect(wrapper.vm.focusedIndex).toBe(1)

      // 按上箭头
      await wrapper.vm.handleMenuKeydown({ key: 'ArrowUp', preventDefault: vi.fn() })
      expect(wrapper.vm.focusedIndex).toBe(0)
    })

    it('按 Enter 键应该选择聚焦的选项', async () => {
      wrapper = mount(Dropdown, {
        props: {
          modelValue: '',
          options,
        },
        attachTo: document.body,
      })

      // 打开菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      
      // 移动到第二个选项
      wrapper.vm.focusedIndex = 1

      // 按 Enter
      await wrapper.vm.handleMenuKeydown({ key: 'Enter', preventDefault: vi.fn() })
      
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['option-2'])
    })
  })

  describe('禁用状态', () => {
    it('禁用时不应该打开下拉菜单', async () => {
      wrapper = mount(Dropdown, {
        props: {
          options,
          disabled: true,
        },
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('应该跳过禁用的选项', async () => {
      const optionsWithDisabled = [
        { label: '选项一', value: 'option-1', disabled: false },
        { label: '选项二', value: 'option-2', disabled: true },
        { label: '选项三', value: 'option-3', disabled: false },
      ]

      wrapper = mount(Dropdown, {
        props: {
          options: optionsWithDisabled,
        },
        attachTo: document.body,
      })

      // 打开菜单
      await wrapper.find('.dropdown-trigger').trigger('click')
      wrapper.vm.focusedIndex = 0

      // 按下箭头应该跳过禁用的选项
      await wrapper.vm.handleMenuKeydown({ key: 'ArrowDown', preventDefault: vi.fn() })
      expect(wrapper.vm.focusedIndex).toBe(2) // 跳过索引 1（禁用）
    })
  })

  describe('可访问性', () => {
    it('应该有正确的 ARIA 属性', () => {
      wrapper = mount(Dropdown, {
        props: {
          options,
          ariaLabel: '选择选项',
        },
      })

      const trigger = wrapper.find('.dropdown-trigger')
      expect(trigger.attributes('aria-haspopup')).toBe('true')
      expect(trigger.attributes('aria-expanded')).toBe('false')
      expect(trigger.attributes('aria-label')).toBe('选择选项')
    })

    it('打开时 aria-expanded 应该为 true', async () => {
      wrapper = mount(Dropdown, {
        props: { options },
        attachTo: document.body,
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      
      const trigger = wrapper.find('.dropdown-trigger')
      expect(trigger.attributes('aria-expanded')).toBe('true')
    })

    it('选项应该有正确的 role 和 aria-selected', async () => {
      wrapper = mount(Dropdown, {
        props: {
          modelValue: 'option-2',
          options,
        },
        attachTo: document.body,
      })

      await wrapper.find('.dropdown-trigger').trigger('click')
      await wrapper.vm.$nextTick()

      const dropdownOptions = document.querySelectorAll('.dropdown-option')
      expect(dropdownOptions[0].getAttribute('role')).toBe('option')
      expect(dropdownOptions[1].getAttribute('aria-selected')).toBe('true')
    })
  })

  describe('简单数组', () => {
    it('应该支持字符串数组', () => {
      const simpleOptions = ['苹果', '香蕉', '橙子']
      
      wrapper = mount(Dropdown, {
        props: {
          modelValue: '香蕉',
          options: simpleOptions,
        },
      })

      expect(wrapper.find('.dropdown-trigger-text').text()).toBe('香蕉')
    })

    it('应该支持数字数组', () => {
      const numberOptions = [1, 2, 3, 4, 5]
      
      wrapper = mount(Dropdown, {
        props: {
          modelValue: 3,
          options: numberOptions,
        },
      })

      expect(wrapper.find('.dropdown-trigger-text').text()).toBe('3')
    })
  })
})
