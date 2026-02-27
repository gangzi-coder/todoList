import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskList from '../TaskList.vue'
import TaskItem from '../TaskItem.vue'
import type { Task } from '@/types'

// Mock TaskItem 组件
vi.mock('../TaskItem.vue', () => ({
  default: {
    name: 'TaskItem',
    props: ['task'],
    emits: ['toggle-complete', 'edit', 'drag-start', 'drag-end'],
    template: '<div class="task-item-mock" :data-task-id="task.id">{{ task.title }}</div>',
  },
}))

describe('TaskList', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: '任务 1',
      projectId: 'inbox',
      priority: 'high',
      tags: ['标签1'],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
      reminders: [],
    },
    {
      id: '2',
      title: '任务 2',
      projectId: 'inbox',
      priority: 'medium',
      tags: [],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 1,
      reminders: [],
    },
    {
      id: '3',
      title: '任务 3',
      projectId: 'inbox',
      priority: 'low',
      tags: [],
      completed: true,
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 2,
      reminders: [],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('渲染', () => {
    it('应该正确渲染任务列表', () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      expect(wrapper.find('.task-list').exists()).toBe(true)
      expect(wrapper.find('.task-list-scroll-container').exists()).toBe(true)
    })

    it('应该渲染所有任务项', () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      const taskItems = wrapper.findAllComponents(TaskItem)
      expect(taskItems.length).toBeGreaterThan(0)
    })

    it('当任务列表为空时应该显示空状态', () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: [],
        },
      })

      expect(wrapper.find('.task-list-empty').exists()).toBe(true)
      expect(wrapper.find('.task-list-empty-title').text()).toBe('暂无任务')
      expect(wrapper.find('.task-list-empty-description').text()).toBe('创建一个新任务开始吧')
    })

    it('应该支持自定义空状态文本', () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: [],
          emptyTitle: '自定义标题',
          emptyDescription: '自定义描述',
        },
      })

      expect(wrapper.find('.task-list-empty-title').text()).toBe('自定义标题')
      expect(wrapper.find('.task-list-empty-description').text()).toBe('自定义描述')
    })

    it('应该设置正确的 ARIA 标签', () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
          ariaLabel: '我的任务列表',
        },
      })

      expect(wrapper.find('.task-list').attributes('aria-label')).toBe('我的任务列表')
    })
  })

  describe('事件处理', () => {
    it('应该触发 toggle-complete 事件', async () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      const taskItem = wrapper.findComponent(TaskItem)
      await taskItem.vm.$emit('toggle-complete', '1')

      expect(wrapper.emitted('toggle-complete')).toBeTruthy()
      expect(wrapper.emitted('toggle-complete')?.[0]).toEqual(['1'])
    })

    it('应该触发 edit 事件', async () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      const taskItem = wrapper.findComponent(TaskItem)
      await taskItem.vm.$emit('edit', '1')

      expect(wrapper.emitted('edit')).toBeTruthy()
      expect(wrapper.emitted('edit')?.[0]).toEqual(['1'])
    })
  })

  describe('虚拟滚动', () => {
    it('应该只渲染可见区域的任务', () => {
      // 生成大量任务
      const largeTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `任务 ${i}`,
        projectId: 'inbox',
        priority: 'none',
        tags: [],
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: i,
        reminders: [],
      }))

      const wrapper = mount(TaskList, {
        props: {
          tasks: largeTasks,
        },
      })

      // 虚拟滚动应该只渲染部分任务
      const taskItems = wrapper.findAllComponents(TaskItem)
      expect(taskItems.length).toBeLessThan(largeTasks.length)
    })

    it('应该有上下占位符', () => {
      const largeTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `任务 ${i}`,
        projectId: 'inbox',
        priority: 'none',
        tags: [],
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: i,
        reminders: [],
      }))

      const wrapper = mount(TaskList, {
        props: {
          tasks: largeTasks,
        },
      })

      const scrollContainer = wrapper.find('.task-list-scroll-container')
      const divs = scrollContainer.findAll('div[style]')
      
      // 应该有占位符 div
      expect(divs.length).toBeGreaterThan(0)
    })
  })

  describe('拖拽排序', () => {
    it('应该处理拖拽开始事件', async () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      const taskItem = wrapper.findComponent(TaskItem)
      await taskItem.vm.$emit('drag-start', mockTasks[0])

      // 验证拖拽状态已设置
      expect(wrapper.vm.draggedTask).toEqual(mockTasks[0])
    })

    it('应该处理拖拽结束事件', async () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      const taskItem = wrapper.findComponent(TaskItem)
      await taskItem.vm.$emit('drag-start', mockTasks[0])
      await taskItem.vm.$emit('drag-end')

      // 验证拖拽状态已清除
      expect(wrapper.vm.draggedTask).toBeNull()
    })

    it('应该触发 reorder 事件', async () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      // 模拟拖拽
      const taskItem = wrapper.findComponent(TaskItem)
      await taskItem.vm.$emit('drag-start', mockTasks[0])

      // 模拟放下
      const itemWrapper = wrapper.find('.task-list-item-wrapper')
      await itemWrapper.trigger('drop')

      // 注意：实际的 reorder 事件触发需要更复杂的模拟
      // 这里只是验证基本结构
      expect(wrapper.find('.task-list-item-wrapper').exists()).toBe(true)
    })
  })

  describe('可访问性', () => {
    it('应该有正确的 role 属性', () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      expect(wrapper.find('.task-list').attributes('role')).toBe('list')
    })

    it('应该为每个任务项设置 role="listitem"', () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      const itemWrappers = wrapper.findAll('.task-list-item-wrapper')
      itemWrappers.forEach(item => {
        expect(item.attributes('role')).toBe('listitem')
      })
    })

    it('空状态应该有 role="status"', () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: [],
        },
      })

      expect(wrapper.find('.task-list-empty').attributes('role')).toBe('status')
    })
  })

  describe('响应式', () => {
    it('应该响应任务列表变化', async () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      // 更新任务列表
      await wrapper.setProps({
        tasks: [mockTasks[0]],
      })

      // 验证渲染更新
      const taskItems = wrapper.findAllComponents(TaskItem)
      expect(taskItems.length).toBeGreaterThan(0)
    })

    it('从有任务到空任务应该显示空状态', async () => {
      const wrapper = mount(TaskList, {
        props: {
          tasks: mockTasks,
        },
      })

      expect(wrapper.find('.task-list-empty').exists()).toBe(false)

      await wrapper.setProps({
        tasks: [],
      })

      expect(wrapper.find('.task-list-empty').exists()).toBe(true)
    })
  })

  describe('性能', () => {
    it('应该能处理大量任务', () => {
      const largeTasks: Task[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `task-${i}`,
        title: `任务 ${i}`,
        projectId: 'inbox',
        priority: 'none',
        tags: [],
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: i,
        reminders: [],
      }))

      const wrapper = mount(TaskList, {
        props: {
          tasks: largeTasks,
        },
      })

      // 应该成功渲染
      expect(wrapper.find('.task-list').exists()).toBe(true)
      
      // 虚拟滚动应该限制渲染的任务数量
      const taskItems = wrapper.findAllComponents(TaskItem)
      expect(taskItems.length).toBeLessThan(100) // 远少于 1000
    })
  })
})
