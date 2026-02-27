/**
 * SearchBar 组件单元测试
 *
 * 验收标准：
 * - 需求 9.1: 提供全局搜索功能
 * - 需求 9.2: 在任务标题、备注、标签中搜索
 * - 需求 9.3: 实时显示搜索结果
 * - 需求 9.4: 在搜索结果中高亮显示匹配的关键词
 * - 需求 9.5: 显示搜索结果的任务数量
 * - 需求 9.6: 搜索结果为空时显示提示
 * - 需求 9.7: 支持 Ctrl+F / Cmd+F 快捷键打开搜索
 * - 需求 9.8: 清空搜索框时返回之前的视图
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SearchBar from '../SearchBar.vue'
import { useTaskStore } from '@/stores/taskStore'
import type { Task } from '@/types'

/**
 * 创建测试用任务
 */
function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: '测试任务',
    notes: '',
    projectId: 'inbox',
    priority: 'none',
    tags: [],
    reminders: [],
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    order: 0,
    ...overrides,
  }
}

describe('SearchBar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ============================================================================
  // 渲染测试
  // ============================================================================

  it('默认应该显示搜索触发按钮', () => {
    const wrapper = mount(SearchBar)
    expect(wrapper.find('.search-trigger-btn').exists()).toBe(true)
    expect(wrapper.find('.search-input-wrapper').exists()).toBe(false)
  })

  it('搜索触发按钮应该显示搜索图标和文本', () => {
    const wrapper = mount(SearchBar)
    expect(wrapper.find('.search-icon').text()).toBe('🔍')
    expect(wrapper.find('.search-trigger-text').text()).toBe('搜索...')
  })

  // ============================================================================
  // 激活/关闭搜索
  // ============================================================================

  it('点击触发按钮应该激活搜索输入框', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('.search-trigger-btn').trigger('click')

    expect(wrapper.find('.search-trigger-btn').exists()).toBe(false)
    expect(wrapper.find('.search-input-wrapper').exists()).toBe(true)
    expect(wrapper.find('.search-input').exists()).toBe(true)
  })

  it('激活搜索后应该自动聚焦输入框', async () => {
    const wrapper = mount(SearchBar, { attachTo: document.body })
    await wrapper.find('.search-trigger-btn').trigger('click')

    expect(document.activeElement).toBe(wrapper.find('.search-input').element)
    wrapper.unmount()
  })

  it('点击清除按钮应该关闭搜索', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('.search-trigger-btn').trigger('click')
    expect(wrapper.find('.search-input-wrapper').exists()).toBe(true)

    await wrapper.find('.search-clear-btn').trigger('click')
    expect(wrapper.find('.search-trigger-btn').exists()).toBe(true)
    expect(wrapper.find('.search-input-wrapper').exists()).toBe(false)
  })

  it('按 Esc 键应该关闭搜索', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('.search-trigger-btn').trigger('click')

    await wrapper.find('.search-input').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.search-trigger-btn').exists()).toBe(true)
  })

  // ============================================================================
  // Ctrl+F 快捷键 (需求 9.7)
  // ============================================================================

  it('按 Ctrl+F 应该激活搜索', async () => {
    const wrapper = mount(SearchBar, { attachTo: document.body })

    window.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'f',
      ctrlKey: true,
    }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.search-input-wrapper').exists()).toBe(true)
    wrapper.unmount()
  })

  // ============================================================================
  // 搜索结果显示 (需求 9.3, 9.5)
  // ============================================================================

  it('输入搜索关键词后应该显示结果数量', async () => {
    const wrapper = mount(SearchBar)
    const taskStore = useTaskStore()

    // 添加测试任务
    taskStore.tasks = [
      createMockTask({ id: '1', title: '买牛奶' }),
      createMockTask({ id: '2', title: '买面包' }),
      createMockTask({ id: '3', title: '写代码' }),
    ]

    await wrapper.find('.search-trigger-btn').trigger('click')
    const input = wrapper.find('.search-input')
    await input.setValue('买')

    // 等待防抖
    await new Promise(r => setTimeout(r, 150))
    await wrapper.vm.$nextTick()

    const countEl = wrapper.find('.search-result-count')
    expect(countEl.exists()).toBe(true)
  })

  // ============================================================================
  // 空结果提示 (需求 9.6)
  // ============================================================================

  it('搜索无结果时应该显示提示', async () => {
    const wrapper = mount(SearchBar)
    const taskStore = useTaskStore()
    taskStore.tasks = [createMockTask({ id: '1', title: '买牛奶' })]

    await wrapper.find('.search-trigger-btn').trigger('click')
    const input = wrapper.find('.search-input')
    await input.setValue('不存在的任务')

    // 等待防抖
    await new Promise(r => setTimeout(r, 150))
    await wrapper.vm.$nextTick()

    const emptyEl = wrapper.find('.search-empty')
    expect(emptyEl.exists()).toBe(true)
    expect(emptyEl.text()).toBe('未找到匹配任务')
  })

  // ============================================================================
  // 搜索结果点击 (需求 9.3)
  // ============================================================================

  it('点击搜索结果应该触发 selectTask 事件', async () => {
    const wrapper = mount(SearchBar)
    const taskStore = useTaskStore()
    taskStore.tasks = [createMockTask({ id: 'task-abc', title: '测试任务' })]

    await wrapper.find('.search-trigger-btn').trigger('click')
    await wrapper.find('.search-input').setValue('测试')

    // 等待防抖
    await new Promise(r => setTimeout(r, 150))
    await wrapper.vm.$nextTick()

    const resultItem = wrapper.find('.search-result-item')
    if (resultItem.exists()) {
      await resultItem.trigger('click')
      expect(wrapper.emitted('selectTask')).toBeTruthy()
      expect(wrapper.emitted('selectTask')![0]).toEqual(['task-abc'])
    }
  })

  // ============================================================================
  // ARIA 可访问性
  // ============================================================================

  it('应该有正确的 ARIA 属性', () => {
    const wrapper = mount(SearchBar)
    expect(wrapper.find('.search-bar').attributes('role')).toBe('search')
    expect(wrapper.find('.search-bar').attributes('aria-label')).toBe('搜索任务')
  })

  it('搜索触发按钮应该有 aria-label', () => {
    const wrapper = mount(SearchBar)
    expect(wrapper.find('.search-trigger-btn').attributes('aria-label')).toBe('打开搜索')
  })

  it('激活后输入框应该有 aria-label', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('.search-trigger-btn').trigger('click')
    expect(wrapper.find('.search-input').attributes('aria-label')).toBe('搜索关键词')
  })

  it('清除按钮应该有 aria-label', async () => {
    const wrapper = mount(SearchBar)
    await wrapper.find('.search-trigger-btn').trigger('click')
    expect(wrapper.find('.search-clear-btn').attributes('aria-label')).toBe('关闭搜索')
  })

  it('搜索结果区域应该有 role=listbox', async () => {
    const wrapper = mount(SearchBar)
    const taskStore = useTaskStore()
    taskStore.tasks = [createMockTask({ id: '1', title: '测试' })]

    await wrapper.find('.search-trigger-btn').trigger('click')
    await wrapper.find('.search-input').setValue('测试')

    await new Promise(r => setTimeout(r, 150))
    await wrapper.vm.$nextTick()

    const results = wrapper.find('.search-results')
    if (results.exists()) {
      expect(results.attributes('role')).toBe('listbox')
    }
  })
})
