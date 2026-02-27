/**
 * SubtaskList 组件单元测试
 *
 * 验收标准：
 * - 需求 3.1: 允许用户为任务添加子任务
 * - 需求 3.2: 在父任务下方缩进显示子任务
 * - 需求 3.3: 支持最多 3 层的子任务嵌套
 * - 需求 3.8: 允许用户折叠和展开子任务列表
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SubtaskList from '../SubtaskList.vue'
import type { Task } from '@/types'

// Mock useTasks composable
const mockGetSubtasks = vi.fn<(parentId: string) => Task[]>().mockReturnValue([])
const mockCreateTask = vi.fn().mockResolvedValue({})

vi.mock('@/composables/useTasks', () => ({
  useTasks: () => ({
    getSubtasks: mockGetSubtasks,
    createTask: mockCreateTask,
    tasks: { value: [] },
    loading: { value: false },
    error: { value: null },
    initialized: { value: true },
    stats: { value: {} },
    topLevelTasks: { value: [] },
    getTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    toggleComplete: vi.fn(),
    refreshTasks: vi.fn(),
    initialize: vi.fn(),
    clearError: vi.fn(),
  }),
}))

// Mock projectStore (needed by TaskItem)
vi.mock('@/stores/projectStore', () => ({
  useProjectStore: () => ({
    getProjectById: vi.fn().mockReturnValue(null),
    projects: [],
  }),
}))

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: '测试子任务',
    projectId: 'project-1',
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

describe('SubtaskList 组件', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetSubtasks.mockReturnValue([])
  })

  describe('基础渲染', () => {
    it('没有子任务时应该渲染空容器', () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })
      expect(wrapper.find('.subtask-list').exists()).toBe(true)
      expect(wrapper.find('.subtask-list-items').exists()).toBe(false)
    })

    it('有子任务时应该显示头部和列表', () => {
      const subtasks = [
        createMockTask({ id: 'sub-1', title: '子任务1', parentId: 'parent-1' }),
        createMockTask({ id: 'sub-2', title: '子任务2', parentId: 'parent-1' }),
      ]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      expect(wrapper.find('.subtask-list-header').exists()).toBe(true)
      expect(wrapper.find('.subtask-list-items').exists()).toBe(true)
      // 使用直接子元素选择，避免递归子组件的干扰
      const items = wrapper.find('.subtask-list-items')
      expect(items.findAll(':scope > .subtask-list-item')).toHaveLength(2)
    })
  })

  describe('子任务进度显示', () => {
    it('应该显示正确的完成进度', () => {
      const subtasks = [
        createMockTask({ id: 'sub-1', completed: true, parentId: 'p' }),
        createMockTask({ id: 'sub-2', completed: false, parentId: 'p' }),
        createMockTask({ id: 'sub-3', completed: true, parentId: 'p' }),
      ]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      const progress = wrapper.find('.subtask-list-progress')
      expect(progress.text()).toBe('子任务 2/3')
    })

    it('全部完成时应该显示全部完成进度', () => {
      const subtasks = [
        createMockTask({ id: 'sub-1', completed: true, parentId: 'p' }),
        createMockTask({ id: 'sub-2', completed: true, parentId: 'p' }),
      ]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      expect(wrapper.find('.subtask-list-progress').text()).toBe('子任务 2/2')
    })
  })

  describe('折叠和展开（需求 3.8）', () => {
    it('默认应该是展开状态', () => {
      const subtasks = [createMockTask({ id: 'sub-1', parentId: 'p' })]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      expect(wrapper.find('.subtask-list-items').exists()).toBe(true)
      expect(wrapper.find('.subtask-list-toggle-icon-expanded').exists()).toBe(true)
    })

    it('点击折叠按钮应该隐藏子任务列表', async () => {
      const subtasks = [createMockTask({ id: 'sub-1', parentId: 'p' })]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      await wrapper.find('.subtask-list-toggle').trigger('click')

      expect(wrapper.find('.subtask-list-items').exists()).toBe(false)
      expect(wrapper.find('.subtask-list-toggle-icon-expanded').exists()).toBe(false)
    })

    it('再次点击应该展开子任务列表', async () => {
      const subtasks = [createMockTask({ id: 'sub-1', parentId: 'p' })]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      // 折叠
      await wrapper.find('.subtask-list-toggle').trigger('click')
      expect(wrapper.find('.subtask-list-items').exists()).toBe(false)

      // 展开
      await wrapper.find('.subtask-list-toggle').trigger('click')
      expect(wrapper.find('.subtask-list-items').exists()).toBe(true)
    })

    it('折叠按钮应该有正确的 aria 属性', async () => {
      const subtasks = [createMockTask({ id: 'sub-1', parentId: 'p' })]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      const toggle = wrapper.find('.subtask-list-toggle')
      expect(toggle.attributes('aria-label')).toBe('折叠子任务')
      expect(toggle.attributes('aria-expanded')).toBe('true')

      await toggle.trigger('click')
      expect(toggle.attributes('aria-label')).toBe('展开子任务')
      expect(toggle.attributes('aria-expanded')).toBe('false')
    })
  })

  describe('添加子任务（需求 3.1）', () => {
    it('应该显示添加子任务按钮', () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 1, maxDepth: 3 },
      })

      expect(wrapper.find('.subtask-list-add-btn').exists()).toBe(true)
      expect(wrapper.find('.subtask-list-add-btn').text()).toContain('添加子任务')
    })

    it('点击添加按钮应该显示输入框', async () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 1, maxDepth: 3 },
      })

      await wrapper.find('.subtask-list-add-btn').trigger('click')

      expect(wrapper.find('.subtask-list-input').exists()).toBe(true)
      expect(wrapper.find('.subtask-list-add-btn').exists()).toBe(false)
    })

    it('点击取消按钮应该隐藏输入框', async () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 1, maxDepth: 3 },
      })

      await wrapper.find('.subtask-list-add-btn').trigger('click')
      expect(wrapper.find('.subtask-list-input').exists()).toBe(true)

      await wrapper.find('.subtask-list-cancel-btn').trigger('click')
      expect(wrapper.find('.subtask-list-input').exists()).toBe(false)
    })

    it('提交子任务时应该调用 createTask', async () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 1, maxDepth: 3 },
      })

      await wrapper.find('.subtask-list-add-btn').trigger('click')

      // 找到 TaskInput 并触发 submit
      const taskInput = wrapper.findComponent({ name: 'TaskInput' })
      await taskInput.vm.$emit('submit', '新子任务')

      expect(mockCreateTask).toHaveBeenCalledWith({
        title: '新子任务',
        parentId: 'parent-1',
      })
    })

    it('提交成功后应该隐藏输入框', async () => {
      mockCreateTask.mockResolvedValue(createMockTask({ id: 'new-sub' }))

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 1, maxDepth: 3 },
      })

      await wrapper.find('.subtask-list-add-btn').trigger('click')

      const taskInput = wrapper.findComponent({ name: 'TaskInput' })
      await taskInput.vm.$emit('submit', '新子任务')

      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      await new Promise(r => setTimeout(r, 0))
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.subtask-list-input').exists()).toBe(false)
    })
  })

  describe('嵌套层级限制（需求 3.3）', () => {
    it('深度为 1 时应该允许添加子任务', () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 1, maxDepth: 3 },
      })

      expect(wrapper.find('.subtask-list-add-btn').exists()).toBe(true)
    })

    it('深度为 2 时应该允许添加子任务', () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 2, maxDepth: 3 },
      })

      expect(wrapper.find('.subtask-list-add-btn').exists()).toBe(true)
    })

    it('深度达到最大值时不应该显示添加按钮', () => {
      const subtasks = [createMockTask({ id: 'sub-1', parentId: 'p' })]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 3, maxDepth: 3 },
      })

      expect(wrapper.find('.subtask-list-add-btn').exists()).toBe(false)
    })

    it('深度达到最大值时应该显示限制提示', () => {
      const subtasks = [createMockTask({ id: 'sub-1', parentId: 'p' })]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 3, maxDepth: 3 },
      })

      expect(wrapper.find('.subtask-list-limit-hint').exists()).toBe(true)
      expect(wrapper.find('.subtask-list-limit-hint').text()).toContain('已达到最大嵌套层级')
    })
  })

  describe('缩进显示（需求 3.2）', () => {
    it('深度为 1 时不应该有缩进', () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 1 },
      })

      expect(wrapper.find('.subtask-list').attributes('style')).toContain('padding-left: 0px')
    })

    it('深度大于 1 时应该有缩进', () => {
      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1', depth: 2 },
      })

      expect(wrapper.find('.subtask-list').attributes('style')).toContain('padding-left: 24px')
    })
  })

  describe('事件传递', () => {
    it('应该传递 toggle-complete 事件', async () => {
      const subtasks = [createMockTask({ id: 'sub-1', parentId: 'p' })]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      const taskItem = wrapper.findComponent({ name: 'TaskItem' })
      await taskItem.vm.$emit('toggle-complete', 'sub-1')

      expect(wrapper.emitted('toggle-complete')).toBeTruthy()
      expect(wrapper.emitted('toggle-complete')![0]).toEqual(['sub-1'])
    })

    it('应该传递 edit 事件', async () => {
      const subtasks = [createMockTask({ id: 'sub-1', parentId: 'p' })]
      mockGetSubtasks.mockReturnValue(subtasks)

      const wrapper = mount(SubtaskList, {
        props: { parentId: 'parent-1' },
      })

      const taskItem = wrapper.findComponent({ name: 'TaskItem' })
      await taskItem.vm.$emit('edit', 'sub-1')

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')![0]).toEqual(['sub-1'])
    })
  })
})
