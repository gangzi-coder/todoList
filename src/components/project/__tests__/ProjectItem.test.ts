/**
 * ProjectItem 组件单元测试
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectItem from '../ProjectItem.vue'
import type { Project } from '@/types'

describe('ProjectItem', () => {
  const mockProject: Project = {
    id: 'project-1',
    name: '工作项目',
    color: '#3b82f6',
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    order: 0,
  }

  const mockDefaultProject: Project = {
    id: 'inbox',
    name: '收件箱',
    color: '#6b7280',
    isDefault: true,
    createdAt: new Date('2024-01-01'),
    order: 0,
  }

  it('应该正确渲染项目信息', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 5,
      },
    })

    // 检查项目名称
    expect(wrapper.text()).toContain('工作项目')
    
    // 检查任务数量
    expect(wrapper.text()).toContain('5')
    
    // 检查颜色标识
    const colorIndicator = wrapper.find('.project-item-color')
    expect(colorIndicator.exists()).toBe(true)
    expect(colorIndicator.attributes('style')).toContain('background-color: rgb(59, 130, 246)')
  })

  it('当任务数量为 0 时不显示任务数量', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 0,
      },
    })

    const countElement = wrapper.find('.project-item-count')
    expect(countElement.exists()).toBe(false)
  })

  it('激活状态应该添加正确的类名', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
        isActive: true,
      },
    })

    expect(wrapper.classes()).toContain('project-item-active')
  })

  it('点击项目应该触发 click 事件', async () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
      },
    })

    await wrapper.trigger('click')
    
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual(['project-1'])
  })

  it('按 Enter 键应该触发 click 事件', async () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
      },
    })

    await wrapper.trigger('keydown.enter')
    
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual(['project-1'])
  })

  it('按 Space 键应该触发 click 事件', async () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
      },
    })

    await wrapper.trigger('keydown.space')
    
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual(['project-1'])
  })

  it('点击编辑按钮应该触发 edit 事件并阻止冒泡', async () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
      },
    })

    const editBtn = wrapper.find('.project-item-action-btn')
    await editBtn.trigger('click')
    
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual(['project-1'])
    
    // 确保没有触发项目的 click 事件
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('点击删除按钮应该触发 delete 事件并阻止冒泡', async () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
      },
    })

    const deleteBtn = wrapper.find('.project-item-action-btn-delete')
    await deleteBtn.trigger('click')
    
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual(['project-1'])
    
    // 确保没有触发项目的 click 事件
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('默认项目不应该显示编辑和删除按钮', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockDefaultProject,
        taskCount: 10,
      },
    })

    const actionButtons = wrapper.findAll('.project-item-action-btn')
    expect(actionButtons.length).toBe(0)
  })

  it('应该有正确的 ARIA 属性', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 5,
        isActive: true,
      },
    })

    const projectItem = wrapper.find('.project-item')
    
    // 检查 role
    expect(projectItem.attributes('role')).toBe('button')
    
    // 检查 aria-label
    expect(projectItem.attributes('aria-label')).toContain('工作项目')
    expect(projectItem.attributes('aria-label')).toContain('5 个任务')
    
    // 检查 aria-pressed
    expect(projectItem.attributes('aria-pressed')).toBe('true')
    
    // 检查 tabindex
    expect(projectItem.attributes('tabindex')).toBe('0')
  })

  it('编辑按钮应该有正确的 ARIA 标签', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
      },
    })

    const editBtn = wrapper.find('.project-item-action-btn')
    expect(editBtn.attributes('aria-label')).toContain('编辑项目')
    expect(editBtn.attributes('aria-label')).toContain('工作项目')
    expect(editBtn.attributes('title')).toBe('编辑项目')
  })

  it('删除按钮应该有正确的 ARIA 标签', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
      },
    })

    const deleteBtn = wrapper.find('.project-item-action-btn-delete')
    expect(deleteBtn.attributes('aria-label')).toContain('删除项目')
    expect(deleteBtn.attributes('aria-label')).toContain('工作项目')
    expect(deleteBtn.attributes('title')).toBe('删除项目')
  })

  it('任务数量应该有正确的 ARIA 标签', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 7,
      },
    })

    const countElement = wrapper.find('.project-item-count')
    expect(countElement.attributes('aria-label')).toBe('7 个未完成任务')
  })

  it('颜色标识应该设置 aria-hidden', () => {
    const wrapper = mount(ProjectItem, {
      props: {
        project: mockProject,
        taskCount: 3,
      },
    })

    const colorIndicator = wrapper.find('.project-item-color')
    expect(colorIndicator.attributes('aria-hidden')).toBe('true')
  })
})
