/**
 * TrendChart 组件单元测试
 *
 * 验收标准：
 * - 需求 10.8: 提供完成趋势图表，显示最近 7 天的任务完成情况
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TrendChart from '../TrendChart.vue'
import type { Task } from '@/types'

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: Math.random().toString(36).slice(2),
    title: '测试任务',
    projectId: 'project-1',
    priority: 'none',
    tags: [],
    reminders: [],
    completed: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    order: 0,
    ...overrides,
  }
}

describe('TrendChart', () => {
  // 固定当前时间为 2024-01-15
  const NOW = new Date('2024-01-15T10:00:00')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该渲染图表标题', () => {
    const wrapper = mount(TrendChart, { props: { tasks: [] } })
    expect(wrapper.find('.trend-chart-title').text()).toContain('完成趋势')
  })

  it('应该渲染 7 个数据点', () => {
    const wrapper = mount(TrendChart, { props: { tasks: [] } })
    const dots = wrapper.findAll('.trend-dot')
    expect(dots.length).toBe(7)
  })

  it('应该渲染 7 个日期标签', () => {
    const wrapper = mount(TrendChart, { props: { tasks: [] } })
    const labels = wrapper.findAll('.date-label')
    expect(labels.length).toBe(7)
    // 最后一个标签应该是今天 1/15
    expect(labels[6].text()).toBe('1/15')
    // 第一个标签应该是 7 天前 1/9
    expect(labels[0].text()).toBe('1/9')
  })

  it('应该正确计算每天的完成数量', () => {
    const tasks = [
      createTask({ completed: true, completedAt: new Date('2024-01-15T08:00:00') }),
      createTask({ completed: true, completedAt: new Date('2024-01-15T12:00:00') }),
      createTask({ completed: true, completedAt: new Date('2024-01-14T09:00:00') }),
      createTask({ completed: true, completedAt: new Date('2024-01-10T09:00:00') }),
    ]
    const wrapper = mount(TrendChart, { props: { tasks } })
    const valueLabels = wrapper.findAll('.value-label')
    // 7 天: 1/9, 1/10, 1/11, 1/12, 1/13, 1/14, 1/15
    // 数量:  0,    1,    0,    0,    0,    1,    2
    expect(valueLabels[0].text()).toBe('0')
    expect(valueLabels[1].text()).toBe('1')
    expect(valueLabels[2].text()).toBe('0')
    expect(valueLabels[3].text()).toBe('0')
    expect(valueLabels[4].text()).toBe('0')
    expect(valueLabels[5].text()).toBe('1')
    expect(valueLabels[6].text()).toBe('2')
  })

  it('未完成的任务不应计入', () => {
    const tasks = [
      createTask({ completed: false }),
      createTask({ completed: true, completedAt: new Date('2024-01-15T08:00:00') }),
    ]
    const wrapper = mount(TrendChart, { props: { tasks } })
    const valueLabels = wrapper.findAll('.value-label')
    // 只有今天有 1 个完成
    expect(valueLabels[6].text()).toBe('1')
    // 其余天为 0
    for (let i = 0; i < 6; i++) {
      expect(valueLabels[i].text()).toBe('0')
    }
  })

  it('超过 7 天前完成的任务不应计入', () => {
    const tasks = [
      createTask({ completed: true, completedAt: new Date('2024-01-01T08:00:00') }),
    ]
    const wrapper = mount(TrendChart, { props: { tasks } })
    const valueLabels = wrapper.findAll('.value-label')
    for (let i = 0; i < 7; i++) {
      expect(valueLabels[i].text()).toBe('0')
    }
  })

  it('空任务列表应该显示全部为 0', () => {
    const wrapper = mount(TrendChart, { props: { tasks: [] } })
    const valueLabels = wrapper.findAll('.value-label')
    expect(valueLabels.length).toBe(7)
    valueLabels.forEach((label) => {
      expect(label.text()).toBe('0')
    })
  })

  it('应该有正确的 ARIA 属性', () => {
    const wrapper = mount(TrendChart, { props: { tasks: [] } })
    const chart = wrapper.find('.trend-chart')
    expect(chart.attributes('role')).toBe('img')
    expect(chart.attributes('aria-label')).toContain('最近 7 天完成趋势')
  })

  it('有数据时应该渲染折线', () => {
    const tasks = [
      createTask({ completed: true, completedAt: new Date('2024-01-15T08:00:00') }),
    ]
    const wrapper = mount(TrendChart, { props: { tasks } })
    const polyline = wrapper.find('.trend-line')
    expect(polyline.exists()).toBe(true)
    expect(polyline.attributes('points')).toBeTruthy()
  })
})
