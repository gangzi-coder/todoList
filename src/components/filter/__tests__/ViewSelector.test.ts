/**
 * ViewSelector 组件单元测试
 *
 * 验收标准：
 * - 需求 8.1: 提供内置视图（今天、即将到来、收件箱、所有任务）
 * - 需求 8.2: "今天"视图
 * - 需求 8.3: "即将到来"视图
 * - 需求 8.4: "收件箱"视图
 * - 需求 14.6: 支持使用数字键 1-4 快速切换视图
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ViewSelector from '../ViewSelector.vue'

describe('ViewSelector', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const defaultProps = {
    currentView: 'today' as const,
    viewCounts: { today: 3, upcoming: 5, inbox: 10, all: 20 },
  }

  it('应该渲染 4 个视图选项', () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const items = wrapper.findAll('.view-selector-item')
    expect(items.length).toBe(4)
  })

  it('应该显示正确的视图标签', () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const labels = wrapper.findAll('.view-selector-label')
    expect(labels[0].text()).toBe('今天')
    expect(labels[1].text()).toBe('即将到来')
    expect(labels[2].text()).toBe('收件箱')
    expect(labels[3].text()).toBe('所有任务')
  })

  it('应该显示各视图的图标', () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const icons = wrapper.findAll('.view-selector-icon')
    expect(icons[0].text()).toBe('📅')
    expect(icons[1].text()).toBe('📆')
    expect(icons[2].text()).toBe('📥')
    expect(icons[3].text()).toBe('📋')
  })

  it('应该高亮当前选中的视图', () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const items = wrapper.findAll('.view-selector-item')
    expect(items[0].classes()).toContain('view-selector-item-active')
    expect(items[1].classes()).not.toContain('view-selector-item-active')
  })

  it('应该高亮不同的当前视图', () => {
    const wrapper = mount(ViewSelector, {
      props: { ...defaultProps, currentView: 'inbox' },
    })
    const items = wrapper.findAll('.view-selector-item')
    expect(items[0].classes()).not.toContain('view-selector-item-active')
    expect(items[2].classes()).toContain('view-selector-item-active')
  })

  it('应该显示任务数量徽章', () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const counts = wrapper.findAll('.view-selector-count')
    // 所有视图都有 > 0 的数量，所以应该有 4 个徽章
    expect(counts.length).toBe(4)
    expect(counts[0].text()).toBe('3')
    expect(counts[1].text()).toBe('5')
    expect(counts[2].text()).toBe('10')
    expect(counts[3].text()).toBe('20')
  })

  it('任务数量为 0 时不应显示徽章', () => {
    const wrapper = mount(ViewSelector, {
      props: {
        currentView: 'today',
        viewCounts: { today: 0, upcoming: 0, inbox: 0, all: 0 },
      },
    })
    const counts = wrapper.findAll('.view-selector-count')
    expect(counts.length).toBe(0)
  })

  it('点击视图应该触发 change 事件', async () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const items = wrapper.findAll('.view-selector-item')
    await items[1].trigger('click')

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['upcoming'])
  })

  it('点击不同视图应该触发对应的 change 事件', async () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const items = wrapper.findAll('.view-selector-item')

    await items[2].trigger('click')
    expect(wrapper.emitted('change')?.[0]).toEqual(['inbox'])

    await items[3].trigger('click')
    expect(wrapper.emitted('change')?.[1]).toEqual(['all'])
  })

  it('按数字键 1 应该触发切换到 today 视图', async () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }))

    expect(wrapper.emitted('change')).toBeTruthy()
    expect(wrapper.emitted('change')?.[0]).toEqual(['today'])
  })

  it('按数字键 2 应该触发切换到 upcoming 视图', async () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }))

    expect(wrapper.emitted('change')?.[0]).toEqual(['upcoming'])
  })

  it('按数字键 3 应该触发切换到 inbox 视图', async () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }))

    expect(wrapper.emitted('change')?.[0]).toEqual(['inbox'])
  })

  it('按数字键 4 应该触发切换到 all 视图', async () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: '4' }))

    expect(wrapper.emitted('change')?.[0]).toEqual(['all'])
  })

  it('在输入框中按数字键不应触发视图切换', async () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()

    const event = new KeyboardEvent('keydown', { key: '1' })
    Object.defineProperty(event, 'target', { value: input })
    window.dispatchEvent(event)

    expect(wrapper.emitted('change')).toBeFalsy()
    document.body.removeChild(input)
  })

  it('按非数字键不应触发视图切换', async () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    await window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))

    expect(wrapper.emitted('change')).toBeFalsy()
  })

  it('应该有正确的 ARIA 属性', () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    expect(wrapper.find('.view-selector').attributes('role')).toBe('tablist')
    expect(wrapper.find('.view-selector').attributes('aria-label')).toBe('视图选择器')

    const items = wrapper.findAll('.view-selector-item')
    items.forEach((item) => {
      expect(item.attributes('role')).toBe('tab')
    })

    // 当前选中的视图 aria-selected 应该为 true
    expect(items[0].attributes('aria-selected')).toBe('true')
    expect(items[1].attributes('aria-selected')).toBe('false')
  })

  it('应该显示快捷键提示', () => {
    const wrapper = mount(ViewSelector, { props: defaultProps })
    const shortcuts = wrapper.findAll('.view-selector-shortcut')
    expect(shortcuts.length).toBe(4)
    expect(shortcuts[0].text()).toBe('1')
    expect(shortcuts[1].text()).toBe('2')
    expect(shortcuts[2].text()).toBe('3')
    expect(shortcuts[3].text()).toBe('4')
  })
})
