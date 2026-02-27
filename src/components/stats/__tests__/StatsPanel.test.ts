/**
 * StatsPanel 组件单元测试
 *
 * 验收标准：
 * - 需求 10.1: 显示总任务数、已完成任务数、未完成任务数
 * - 需求 10.2: 显示任务完成率百分比
 * - 需求 10.3: 显示各优先级任务的数量分布
 * - 需求 10.4: 显示今天完成的任务数量
 * - 需求 10.5: 显示本周完成的任务数量
 * - 需求 10.6: 显示过期任务数量
 * - 需求 10.7: 用户选择特定项目时显示该项目的统计信息
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import StatsPanel from '../StatsPanel.vue'
import type { Task } from '@/types'

/**
 * 创建测试用任务
 */
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

describe('StatsPanel', () => {
  // 固定当前时间为 2024-01-15 周一
  const NOW = new Date('2024-01-15T10:00:00')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const sampleTasks: Task[] = [
    createTask({ id: '1', priority: 'high', completed: true, completedAt: new Date('2024-01-15T08:00:00'), projectId: 'p1' }),
    createTask({ id: '2', priority: 'medium', completed: true, completedAt: new Date('2024-01-14T08:00:00'), projectId: 'p1' }),
    createTask({ id: '3', priority: 'low', completed: false, dueDate: new Date('2024-01-10'), projectId: 'p2' }),
    createTask({ id: '4', priority: 'none', completed: false, dueDate: new Date('2024-01-20'), projectId: 'p2' }),
    createTask({ id: '5', priority: 'high', completed: false, projectId: 'p1' }),
  ]

  describe('基础统计（需求 10.1）', () => {
    it('应该显示总任务数', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const values = wrapper.findAll('.stat-value')
      expect(values[0].text()).toBe('5')
    })

    it('应该显示已完成任务数', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const values = wrapper.findAll('.stat-value')
      expect(values[1].text()).toBe('2')
    })

    it('应该显示未完成任务数', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const values = wrapper.findAll('.stat-value')
      expect(values[2].text()).toBe('3')
    })

    it('空任务列表应该显示全部为 0', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: [] } })
      const values = wrapper.findAll('.stat-value')
      expect(values[0].text()).toBe('0')
      expect(values[1].text()).toBe('0')
      expect(values[2].text()).toBe('0')
    })
  })

  describe('完成率（需求 10.2）', () => {
    it('应该显示正确的完成率百分比', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const rateValue = wrapper.find('.completion-rate-value')
      // 2/5 = 40%
      expect(rateValue.text()).toBe('40%')
    })

    it('空任务列表完成率应该为 0%', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: [] } })
      const rateValue = wrapper.find('.completion-rate-value')
      expect(rateValue.text()).toBe('0%')
    })

    it('全部完成时完成率应该为 100%', () => {
      const allCompleted = [
        createTask({ completed: true, completedAt: new Date() }),
        createTask({ completed: true, completedAt: new Date() }),
      ]
      const wrapper = mount(StatsPanel, { props: { tasks: allCompleted } })
      expect(wrapper.find('.completion-rate-value').text()).toBe('100%')
    })

    it('进度条应该有正确的 ARIA 属性', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const progressBar = wrapper.find('.progress-bar')
      expect(progressBar.attributes('role')).toBe('progressbar')
      expect(progressBar.attributes('aria-valuenow')).toBe('40')
      expect(progressBar.attributes('aria-valuemin')).toBe('0')
      expect(progressBar.attributes('aria-valuemax')).toBe('100')
    })
  })

  describe('优先级分布（需求 10.3）', () => {
    it('应该显示 4 个优先级项', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const items = wrapper.findAll('.priority-item')
      expect(items.length).toBe(4)
    })

    it('应该显示正确的优先级数量', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const counts = wrapper.findAll('.priority-count')
      // high: 2, medium: 1, low: 1, none: 1
      expect(counts[0].text()).toBe('2')
      expect(counts[1].text()).toBe('1')
      expect(counts[2].text()).toBe('1')
      expect(counts[3].text()).toBe('1')
    })

    it('应该显示正确的优先级标签', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const badges = wrapper.findAll('.priority-badge')
      expect(badges[0].text()).toBe('高')
      expect(badges[1].text()).toBe('中')
      expect(badges[2].text()).toBe('低')
      expect(badges[3].text()).toBe('无')
    })
  })

  describe('今天完成数量（需求 10.4）', () => {
    it('应该显示今天完成的任务数量', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const timeValues = wrapper.findAll('.time-stat-value')
      // 只有 task 1 是今天完成的
      expect(timeValues[0].text()).toBe('1')
    })

    it('没有今天完成的任务时应该显示 0', () => {
      const tasks = [createTask({ completed: false })]
      const wrapper = mount(StatsPanel, { props: { tasks } })
      const timeValues = wrapper.findAll('.time-stat-value')
      expect(timeValues[0].text()).toBe('0')
    })
  })

  describe('本周完成数量（需求 10.5）', () => {
    it('应该显示本周完成的任务数量', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const timeValues = wrapper.findAll('.time-stat-value')
      // 2024-01-15 是周一，本周从 01-15 开始
      // task 1 完成于 01-15（本周一），task 2 完成于 01-14（上周日）
      expect(timeValues[1].text()).toBe('1')
    })
  })

  describe('过期任务数量（需求 10.6）', () => {
    it('应该显示过期任务数量', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const timeValues = wrapper.findAll('.time-stat-value')
      // task 3 截止日期 01-10 已过期且未完成
      expect(timeValues[2].text()).toBe('1')
    })

    it('已完成的过期任务不应计入', () => {
      const tasks = [
        createTask({ completed: true, completedAt: new Date(), dueDate: new Date('2024-01-01') }),
      ]
      const wrapper = mount(StatsPanel, { props: { tasks } })
      const timeValues = wrapper.findAll('.time-stat-value')
      expect(timeValues[2].text()).toBe('0')
    })
  })

  describe('按项目过滤（需求 10.7）', () => {
    it('传入 projectId 时应该只统计该项目的任务', () => {
      const wrapper = mount(StatsPanel, {
        props: { tasks: sampleTasks, projectId: 'p1' },
      })
      const values = wrapper.findAll('.stat-value')
      // p1 项目有 task 1, 2, 5 共 3 个
      expect(values[0].text()).toBe('3')
      // 已完成 2 个
      expect(values[1].text()).toBe('2')
      // 未完成 1 个
      expect(values[2].text()).toBe('1')
    })

    it('不传 projectId 时应该统计所有任务', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: sampleTasks } })
      const values = wrapper.findAll('.stat-value')
      expect(values[0].text()).toBe('5')
    })

    it('过滤后的完成率应该正确', () => {
      const wrapper = mount(StatsPanel, {
        props: { tasks: sampleTasks, projectId: 'p1' },
      })
      // p1: 2 completed / 3 total = 67%
      expect(wrapper.find('.completion-rate-value').text()).toBe('67%')
    })
  })

  describe('ARIA 可访问性', () => {
    it('应该有正确的 region 角色和标签', () => {
      const wrapper = mount(StatsPanel, { props: { tasks: [] } })
      expect(wrapper.find('.stats-panel').attributes('role')).toBe('region')
      expect(wrapper.find('.stats-panel').attributes('aria-label')).toBe('任务统计')
    })
  })
})
