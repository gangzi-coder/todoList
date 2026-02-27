/**
 * SortSelector 组件单元测试
 *
 * 验收标准：
 * - 需求 8.9: 支持按创建时间、截止日期、优先级、标题字母顺序排序
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SortSelector from '../SortSelector.vue'

describe('SortSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const defaultProps = {
    currentSort: 'createdAt' as const,
    sortAscending: true,
  }

  // ============================================================================
  // 渲染测试
  // ============================================================================

  it('应该渲染 4 个排序选项', () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const options = wrapper.findAll('.sort-option-btn')
    expect(options.length).toBe(4)
  })

  it('应该显示正确的排序选项标签', () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const labels = wrapper.findAll('.sort-option-label')
    expect(labels[0].text()).toBe('创建时间')
    expect(labels[1].text()).toBe('截止日期')
    expect(labels[2].text()).toBe('优先级')
    expect(labels[3].text()).toBe('标题')
  })

  it('应该显示排序选项图标', () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const icons = wrapper.findAll('.sort-option-icon')
    expect(icons[0].text()).toBe('🕐')
    expect(icons[1].text()).toBe('📅')
    expect(icons[2].text()).toBe('🔥')
    expect(icons[3].text()).toBe('🔤')
  })

  // ============================================================================
  // 高亮当前排序选项
  // ============================================================================

  it('应该高亮当前选中的排序选项', () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const options = wrapper.findAll('.sort-option-btn')
    expect(options[0].classes()).toContain('sort-option-btn-active')
    expect(options[1].classes()).not.toContain('sort-option-btn-active')
  })

  it('应该高亮不同的排序选项', () => {
    const wrapper = mount(SortSelector, {
      props: { ...defaultProps, currentSort: 'priority' },
    })
    const options = wrapper.findAll('.sort-option-btn')
    expect(options[0].classes()).not.toContain('sort-option-btn-active')
    expect(options[2].classes()).toContain('sort-option-btn-active')
  })

  // ============================================================================
  // 排序方向
  // ============================================================================

  it('升序时应该显示升序标识', () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const dirBtn = wrapper.find('.sort-direction-btn')
    expect(dirBtn.text()).toContain('升序')
    expect(dirBtn.text()).toContain('↑')
  })

  it('降序时应该显示降序标识', () => {
    const wrapper = mount(SortSelector, {
      props: { ...defaultProps, sortAscending: false },
    })
    const dirBtn = wrapper.find('.sort-direction-btn')
    expect(dirBtn.text()).toContain('降序')
    expect(dirBtn.text()).toContain('↓')
  })

  // ============================================================================
  // 交互测试
  // ============================================================================

  it('点击不同排序选项应该触发 change 事件（默认升序）', async () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const options = wrapper.findAll('.sort-option-btn')
    await options[1].trigger('click')

    const emitted = wrapper.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ sortBy: 'dueDate', direction: 'asc' })
  })

  it('点击当前排序选项应该切换方向', async () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const options = wrapper.findAll('.sort-option-btn')
    await options[0].trigger('click')

    const emitted = wrapper.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ sortBy: 'createdAt', direction: 'desc' })
  })

  it('降序状态下点击当前排序选项应该切换为升序', async () => {
    const wrapper = mount(SortSelector, {
      props: { ...defaultProps, sortAscending: false },
    })
    const options = wrapper.findAll('.sort-option-btn')
    await options[0].trigger('click')

    const emitted = wrapper.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ sortBy: 'createdAt', direction: 'asc' })
  })

  it('点击方向按钮应该切换排序方向', async () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    await wrapper.find('.sort-direction-btn').trigger('click')

    const emitted = wrapper.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ sortBy: 'createdAt', direction: 'desc' })
  })

  it('降序状态下点击方向按钮应该切换为升序', async () => {
    const wrapper = mount(SortSelector, {
      props: { ...defaultProps, sortAscending: false },
    })
    await wrapper.find('.sort-direction-btn').trigger('click')

    const emitted = wrapper.emitted('change')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ sortBy: 'createdAt', direction: 'asc' })
  })

  // ============================================================================
  // ARIA 可访问性
  // ============================================================================

  it('应该有正确的 ARIA 属性', () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    expect(wrapper.find('.sort-selector').attributes('role')).toBe('group')
    expect(wrapper.find('.sort-selector').attributes('aria-label')).toBe('排序选择器')
  })

  it('排序选项应该有 aria-pressed 属性', () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const options = wrapper.findAll('.sort-option-btn')
    expect(options[0].attributes('aria-pressed')).toBe('true')
    expect(options[1].attributes('aria-pressed')).toBe('false')
  })

  it('方向按钮应该有正确的 aria-label', () => {
    const wrapper = mount(SortSelector, { props: defaultProps })
    const dirBtn = wrapper.find('.sort-direction-btn')
    expect(dirBtn.attributes('aria-label')).toContain('升序')
  })

  it('降序时方向按钮应该有正确的 aria-label', () => {
    const wrapper = mount(SortSelector, {
      props: { ...defaultProps, sortAscending: false },
    })
    const dirBtn = wrapper.find('.sort-direction-btn')
    expect(dirBtn.attributes('aria-label')).toContain('降序')
  })
})
