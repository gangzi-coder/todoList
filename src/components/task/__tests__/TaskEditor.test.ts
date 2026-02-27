import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskEditor from '../TaskEditor.vue'
import Modal from '../../common/Modal.vue'
import Dropdown from '../../common/Dropdown.vue'
import DatePicker from '../../common/DatePicker.vue'
import TagInput from '../../common/TagInput.vue'
import type { Task, Priority } from '../../../types'

describe('TaskEditor', () => {
  const mockProjects = [
    { id: '1', name: '收件箱', color: '#6b7280' },
    { id: '2', name: '工作', color: '#3b82f6' },
    { id: '3', name: '个人', color: '#10b981' },
  ]

  const mockTags = ['工作', '紧急', '重要']

  const createWrapper = (props = {}) => {
    return mount(TaskEditor, {
      props: {
        modelValue: true,
        projects: mockProjects,
        availableTags: mockTags,
        ...props,
      },
      global: {
        components: {
          Modal,
          Dropdown,
          DatePicker,
          TagInput,
        },
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  describe('创建模式', () => {
    it('应该渲染创建任务表单', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.find('.task-editor').exists()).toBe(true)
      expect(wrapper.find('#task-title').exists()).toBe(true)
      expect(wrapper.find('#task-notes').exists()).toBe(true)
    })

    it('应该显示"创建任务"标题', () => {
      const wrapper = createWrapper()
      const modal = wrapper.findComponent(Modal)
      
      expect(modal.props('title')).toBe('创建任务')
    })

    it('应该初始化空表单', () => {
      const wrapper = createWrapper()
      
      const titleInput = wrapper.find('#task-title')
      const notesInput = wrapper.find('#task-notes')
      
      expect((titleInput.element as HTMLInputElement).value).toBe('')
      expect((notesInput.element as HTMLTextAreaElement).value).toBe('')
    })

    it('应该默认选择收件箱项目', async () => {
      const wrapper = createWrapper()
      await wrapper.vm.$nextTick()
      
      // 检查 formData 中的 projectId
      expect(wrapper.vm.formData.projectId).toBe('1')
    })
  })

  describe('编辑模式', () => {
    const mockTask: Task = {
      id: 'task-1',
      title: '测试任务',
      notes: '这是一个测试任务',
      projectId: '2',
      priority: 'high' as Priority,
      tags: ['工作', '紧急'],
      dueDate: new Date('2024-12-31'),
      reminders: [],
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      order: 0,
    }

    it('应该显示"编辑任务"标题', () => {
      const wrapper = createWrapper({ task: mockTask })
      const modal = wrapper.findComponent(Modal)
      
      expect(modal.props('title')).toBe('编辑任务')
    })

    it('应该填充现有任务数据', async () => {
      const wrapper = createWrapper({ task: mockTask })
      await wrapper.vm.$nextTick()
      
      const titleInput = wrapper.find('#task-title')
      const notesInput = wrapper.find('#task-notes')
      
      expect((titleInput.element as HTMLInputElement).value).toBe('测试任务')
      expect((notesInput.element as HTMLTextAreaElement).value).toBe('这是一个测试任务')
      expect(wrapper.vm.formData.projectId).toBe('2')
      expect(wrapper.vm.formData.priority).toBe('high')
      expect(wrapper.vm.formData.tags).toEqual(['工作', '紧急'])
    })
  })

  describe('表单验证', () => {
    it('应该验证空标题', async () => {
      const wrapper = createWrapper()
      
      const submitButton = wrapper.find('.task-editor-button-submit')
      expect((submitButton.element as HTMLButtonElement).disabled).toBe(true)
    })

    it('应该显示标题验证错误', async () => {
      const wrapper = createWrapper()
      
      // 输入空格
      const titleInput = wrapper.find('#task-title')
      await titleInput.setValue('   ')
      
      // 尝试提交
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      await wrapper.vm.$nextTick()
      
      // 检查错误消息
      expect(wrapper.find('#title-error').exists()).toBe(true)
    })

    it('应该验证标题长度限制（200字符）', async () => {
      const wrapper = createWrapper()
      
      const longTitle = 'a'.repeat(201)
      const titleInput = wrapper.find('#task-title')
      await titleInput.setValue(longTitle)
      
      // 尝试提交
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      await wrapper.vm.$nextTick()
      
      // 应该有错误
      expect(wrapper.find('#title-error').exists()).toBe(true)
    })

    it('应该显示字符计数', async () => {
      const wrapper = createWrapper()
      
      const titleInput = wrapper.find('#task-title')
      await titleInput.setValue('测试任务')
      
      await wrapper.vm.$nextTick()
      
      const counter = wrapper.findAll('.task-editor-counter')[0]
      expect(counter.text()).toBe('4/200')
    })

    it('应该在标题接近字符限制时显示警告样式', async () => {
      const wrapper = createWrapper()
      
      const titleInput = wrapper.find('#task-title')
      await titleInput.setValue('a'.repeat(185))
      
      await wrapper.vm.$nextTick()
      
      const counter = wrapper.findAll('.task-editor-counter')[0]
      expect(counter.classes()).toContain('task-editor-counter-warning')
      expect(counter.text()).toBe('还可输入 15 个字符')
    })

    it('应该在输入标题时实时验证', async () => {
      const wrapper = createWrapper()
      
      const titleInput = wrapper.find('#task-title')
      
      // 输入有效标题 - 不应有错误
      await titleInput.setValue('有效标题')
      await titleInput.trigger('input')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('#title-error').exists()).toBe(false)
    })

    it('应该在输入备注时实时验证', async () => {
      const wrapper = createWrapper()
      
      // 先输入标题使表单可用
      await wrapper.find('#task-title').setValue('测试')
      
      const notesInput = wrapper.find('#task-notes')
      await notesInput.setValue('有效备注')
      await notesInput.trigger('input')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('#notes-error').exists()).toBe(false)
    })

    it('应该验证备注长度限制（500字符）', async () => {
      const wrapper = createWrapper()
      
      const longNotes = 'a'.repeat(501)
      const notesInput = wrapper.find('#task-notes')
      await notesInput.setValue(longNotes)
      
      // 尝试提交
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      await wrapper.vm.$nextTick()
      
      // 应该有错误
      expect(wrapper.find('#notes-error').exists()).toBe(true)
    })

    it('应该在截止日期早于今天时显示警告', async () => {
      const wrapper = createWrapper()
      
      // 设置过去的日期
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      wrapper.vm.formData.dueDate = pastDate
      await wrapper.vm.$nextTick()
      
      const warning = wrapper.find('.task-editor-warning')
      expect(warning.exists()).toBe(true)
      expect(warning.text()).toContain('截止日期早于今天')
      expect(warning.attributes('role')).toBe('alert')
    })
  })

  describe('表单提交', () => {
    it('应该在创建模式下提交新任务数据', async () => {
      const wrapper = createWrapper()
      
      // 填写表单
      await wrapper.find('#task-title').setValue('新任务')
      await wrapper.find('#task-notes').setValue('任务备注')
      
      await wrapper.vm.$nextTick()
      
      // 提交表单
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      // 检查 emit
      expect(wrapper.emitted('submit')).toBeTruthy()
      const submitData = wrapper.emitted('submit')![0][0]
      expect(submitData).toMatchObject({
        title: '新任务',
        notes: '任务备注',
      })
    })

    it('应该在编辑模式下提交更新数据', async () => {
      const mockTask: Task = {
        id: 'task-1',
        title: '原标题',
        notes: '原备注',
        projectId: '1',
        priority: 'none' as Priority,
        tags: [],
        reminders: [],
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: 0,
      }
      
      const wrapper = createWrapper({ task: mockTask })
      
      // 修改标题
      await wrapper.find('#task-title').setValue('新标题')
      
      await wrapper.vm.$nextTick()
      
      // 提交表单
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      // 检查 emit
      expect(wrapper.emitted('submit')).toBeTruthy()
      const submitData = wrapper.emitted('submit')![0][0]
      expect(submitData).toMatchObject({
        title: '新标题',
      })
    })

    it('应该在提交后关闭编辑器', async () => {
      const wrapper = createWrapper()
      
      // 填写表单
      await wrapper.find('#task-title').setValue('新任务')
      
      await wrapper.vm.$nextTick()
      
      // 提交表单
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      await wrapper.vm.$nextTick()
      
      // 检查关闭事件
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
    })
  })

  describe('取消操作', () => {
    it('应该在点击取消按钮时关闭编辑器', async () => {
      const wrapper = createWrapper()
      
      const cancelButton = wrapper.find('.task-editor-button-cancel')
      await cancelButton.trigger('click')
      
      expect(wrapper.emitted('cancel')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
    })
  })

  describe('可访问性', () => {
    it('应该为必填字段添加 aria-required', () => {
      const wrapper = createWrapper()
      
      const titleInput = wrapper.find('#task-title')
      expect(titleInput.attributes('aria-required')).toBe('true')
    })

    it('应该在有错误时设置 aria-invalid', async () => {
      const wrapper = createWrapper()
      
      // 尝试提交空表单
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      await wrapper.vm.$nextTick()
      
      const titleInput = wrapper.find('#task-title')
      expect(titleInput.attributes('aria-invalid')).toBe('true')
    })

    it('应该使用 aria-describedby 关联错误消息', async () => {
      const wrapper = createWrapper()
      
      // 尝试提交空表单
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      await wrapper.vm.$nextTick()
      
      const titleInput = wrapper.find('#task-title')
      expect(titleInput.attributes('aria-describedby')).toBe('title-error')
    })

    it('错误消息应该有 alert role', async () => {
      const wrapper = createWrapper()
      
      // 尝试提交空表单
      const form = wrapper.find('.task-editor')
      await form.trigger('submit')
      
      await wrapper.vm.$nextTick()
      
      const titleError = wrapper.find('#title-error')
      expect(titleError.exists()).toBe(true)
      expect(titleError.attributes('role')).toBe('alert')
    })
  })

  describe('组件集成', () => {
    it('应该渲染 Modal 组件', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.findComponent(Modal).exists()).toBe(true)
    })

    it('应该渲染 Dropdown 组件用于项目和优先级选择', () => {
      const wrapper = createWrapper()
      
      const dropdowns = wrapper.findAllComponents(Dropdown)
      expect(dropdowns.length).toBeGreaterThanOrEqual(2)
    })

    it('应该渲染 DatePicker 组件', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.findComponent(DatePicker).exists()).toBe(true)
    })

    it('应该渲染 TagInput 组件', () => {
      const wrapper = createWrapper()
      
      expect(wrapper.findComponent(TagInput).exists()).toBe(true)
    })
  })
})
