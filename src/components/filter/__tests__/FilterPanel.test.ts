/**
 * FilterPanel 组件单元测试
 *
 * 验收标准：
 * - 需求 8.5: 允许用户按优先级过滤任务
 * - 需求 8.6: 允许用户按标签过滤任务
 * - 需求 8.7: 允许用户按完成状态过滤任务
 * - 需求 8.8: 支持多条件组合过滤
 * - 需求 8.10: 允许用户保存自定义过滤条件为智能列表
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FilterPanel from '../FilterPanel.vue'
import type { TaskFilter } from '@/types'

describe('FilterPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  const defaultProps = {
    filter: {} as TaskFilter,
    availableTags: ['工作', '学习', '生活'],
  }

  // ============================================================================
  // 渲染测试
  // ============================================================================

  it('应该渲染面板标题', () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    expect(wrapper.find('.filter-panel-title').text()).toBe('过滤条件')
  })

  it('应该渲染完成状态过滤区域', () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    const statusBtns = wrapper.findAll('.filter-status-btn')
    expect(statusBtns.length).toBe(3)
    expect(statusBtns[0].text()).toBe('全部')
    expect(statusBtns[1].text()).toBe('未完成')
    expect(statusBtns[2].text()).toBe('已完成')
  })

  it('应该渲染优先级过滤区域', () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    const priorityBtns = wrapper.findAll('.filter-priority-btn')
    expect(priorityBtns.length).toBe(4)
    expect(priorityBtns[0].text()).toBe('高')
    expect(priorityBtns[1].text()).toBe('中')
    expect(priorityBtns[2].text()).toBe('低')
    expect(priorityBtns[3].text()).toBe('无')
  })

  it('应该渲染标签过滤区域', () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    const tagBtns = wrapper.findAll('.filter-tag-btn')
    expect(tagBtns.length).toBe(3)
    expect(tagBtns[0].text()).toBe('#工作')
    expect(tagBtns[1].text()).toBe('#学习')
    expect(tagBtns[2].text()).toBe('#生活')
  })

  it('没有标签时应该显示空提示', () => {
    const wrapper = mount(FilterPanel, {
      props: { filter: {}, availableTags: [] },
    })
    expect(wrapper.find('.filter-empty-hint').text()).toBe('暂无标签')
  })

  // ============================================================================
  // 完成状态过滤 (需求 8.7)
  // ============================================================================

  it('默认应该选中"全部"状态', () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    const statusBtns = wrapper.findAll('.filter-status-btn')
    expect(statusBtns[0].classes()).toContain('filter-status-btn-active')
  })

  it('点击"未完成"应该触发过滤更新', async () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    const statusBtns = wrapper.findAll('.filter-status-btn')
    await statusBtns[1].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ completed: false })
  })

  it('点击"已完成"应该触发过滤更新', async () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    const statusBtns = wrapper.findAll('.filter-status-btn')
    await statusBtns[2].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual({ completed: true })
  })

  it('点击"全部"应该清除完成状态过滤', async () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { completed: false } },
    })
    const statusBtns = wrapper.findAll('.filter-status-btn')
    await statusBtns[0].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    const filterResult = emitted![0][0] as TaskFilter
    expect(filterResult.completed).toBeUndefined()
  })

  it('应该正确高亮当前完成状态', () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { completed: true } },
    })
    const statusBtns = wrapper.findAll('.filter-status-btn')
    expect(statusBtns[0].classes()).not.toContain('filter-status-btn-active')
    expect(statusBtns[2].classes()).toContain('filter-status-btn-active')
  })

  // ============================================================================
  // 优先级过滤 (需求 8.5)
  // ============================================================================

  it('点击优先级应该触发过滤更新', async () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    const priorityBtns = wrapper.findAll('.filter-priority-btn')
    await priorityBtns[0].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as TaskFilter).priority).toEqual(['high'])
  })

  it('应该支持选择多个优先级 (需求 8.8)', async () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { priority: ['high'] } },
    })
    const priorityBtns = wrapper.findAll('.filter-priority-btn')
    await priorityBtns[1].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as TaskFilter).priority).toEqual(['high', 'medium'])
  })

  it('再次点击已选优先级应该取消选择', async () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { priority: ['high', 'medium'] } },
    })
    const priorityBtns = wrapper.findAll('.filter-priority-btn')
    await priorityBtns[0].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as TaskFilter).priority).toEqual(['medium'])
  })

  it('取消所有优先级应该清除优先级过滤', async () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { priority: ['high'] } },
    })
    const priorityBtns = wrapper.findAll('.filter-priority-btn')
    await priorityBtns[0].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as TaskFilter).priority).toBeUndefined()
  })

  it('应该正确高亮已选优先级', () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { priority: ['high', 'low'] } },
    })
    const priorityBtns = wrapper.findAll('.filter-priority-btn')
    expect(priorityBtns[0].classes()).toContain('filter-priority-btn-active')
    expect(priorityBtns[1].classes()).not.toContain('filter-priority-btn-active')
    expect(priorityBtns[2].classes()).toContain('filter-priority-btn-active')
    expect(priorityBtns[3].classes()).not.toContain('filter-priority-btn-active')
  })

  // ============================================================================
  // 标签过滤 (需求 8.6)
  // ============================================================================

  it('点击标签应该触发过滤更新', async () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    const tagBtns = wrapper.findAll('.filter-tag-btn')
    await tagBtns[0].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as TaskFilter).tags).toEqual(['工作'])
  })

  it('应该支持选择多个标签 (需求 8.8)', async () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { tags: ['工作'] } },
    })
    const tagBtns = wrapper.findAll('.filter-tag-btn')
    await tagBtns[1].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as TaskFilter).tags).toEqual(['工作', '学习'])
  })

  it('再次点击已选标签应该取消选择', async () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { tags: ['工作', '学习'] } },
    })
    const tagBtns = wrapper.findAll('.filter-tag-btn')
    await tagBtns[0].trigger('click')

    const emitted = wrapper.emitted('update:filter')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as TaskFilter).tags).toEqual(['学习'])
  })

  it('应该正确高亮已选标签', () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { tags: ['学习'] } },
    })
    const tagBtns = wrapper.findAll('.filter-tag-btn')
    expect(tagBtns[0].classes()).not.toContain('filter-tag-btn-active')
    expect(tagBtns[1].classes()).toContain('filter-tag-btn-active')
    expect(tagBtns[2].classes()).not.toContain('filter-tag-btn-active')
  })

  // ============================================================================
  // 活动过滤条件计数和清除
  // ============================================================================

  it('没有过滤条件时不应显示徽章和清除按钮', () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    expect(wrapper.find('.filter-badge').exists()).toBe(false)
    expect(wrapper.find('.filter-clear-btn').exists()).toBe(false)
  })

  it('有过滤条件时应该显示活动数量徽章', () => {
    const wrapper = mount(FilterPanel, {
      props: {
        ...defaultProps,
        filter: { priority: ['high'], tags: ['工作'], completed: false },
      },
    })
    expect(wrapper.find('.filter-badge').text()).toBe('3')
  })

  it('点击清除按钮应该触发 clear 事件', async () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { priority: ['high'] } },
    })
    await wrapper.find('.filter-clear-btn').trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  // ============================================================================
  // 保存为智能列表 (需求 8.10)
  // ============================================================================

  it('没有过滤条件时不应显示保存按钮', () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    expect(wrapper.find('.filter-save-btn').exists()).toBe(false)
  })

  it('有过滤条件时应该显示保存按钮', () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { priority: ['high'] } },
    })
    expect(wrapper.find('.filter-save-btn').exists()).toBe(true)
  })

  it('点击保存按钮应该触发 saveSmartList 事件', async () => {
    const filter: TaskFilter = { priority: ['high'], tags: ['工作'] }
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter },
    })
    await wrapper.find('.filter-save-btn').trigger('click')

    const emitted = wrapper.emitted('saveSmartList')
    expect(emitted).toBeTruthy()
    expect(emitted![0][0]).toEqual(filter)
  })

  // ============================================================================
  // ARIA 可访问性
  // ============================================================================

  it('应该有正确的 ARIA 属性', () => {
    const wrapper = mount(FilterPanel, { props: defaultProps })
    expect(wrapper.find('.filter-panel').attributes('role')).toBe('region')
    expect(wrapper.find('.filter-panel').attributes('aria-label')).toBe('过滤面板')
  })

  it('优先级按钮应该有 aria-pressed 属性', () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { priority: ['high'] } },
    })
    const priorityBtns = wrapper.findAll('.filter-priority-btn')
    expect(priorityBtns[0].attributes('aria-pressed')).toBe('true')
    expect(priorityBtns[1].attributes('aria-pressed')).toBe('false')
  })

  it('标签按钮应该有 aria-pressed 属性', () => {
    const wrapper = mount(FilterPanel, {
      props: { ...defaultProps, filter: { tags: ['工作'] } },
    })
    const tagBtns = wrapper.findAll('.filter-tag-btn')
    expect(tagBtns[0].attributes('aria-pressed')).toBe('true')
    expect(tagBtns[1].attributes('aria-pressed')).toBe('false')
  })
})
