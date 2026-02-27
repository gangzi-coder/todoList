/**
 * ProjectEditor 组件单元测试
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectEditor from '../ProjectEditor.vue'
import type { Project } from '@/types'

// Mock Modal 组件
vi.mock('@/components/common/Modal.vue', () => ({
  default: {
    name: 'Modal',
    template: `
      <div v-if="modelValue" class="mock-modal">
        <slot />
        <button class="mock-confirm" @click="$emit('confirm')">确认</button>
        <button class="mock-cancel" @click="$emit('cancel')">取消</button>
      </div>
    `,
    props: ['modelValue', 'title', 'confirmText', 'cancelText', 'confirmDanger', 'size'],
    emits: ['update:modelValue', 'confirm', 'cancel', 'close'],
  },
}))

describe('ProjectEditor', () => {
  const mockProject: Project = {
    id: 'project-1',
    name: '工作项目',
    color: '#ef4444',
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

  it('新建模式应该显示"新建项目"标题', () => {
    const wrapper = mount(ProjectEditor)
    expect(wrapper.text()).toContain('新建项目')
  })

  it('编辑模式应该显示"编辑项目"标题', () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockProject },
    })
    expect(wrapper.text()).toContain('编辑项目')
  })

  it('编辑模式应该用项目数据填充表单', () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockProject },
    })

    const input = wrapper.find('#project-name')
    expect((input.element as HTMLInputElement).value).toBe('工作项目')

    // 检查颜色选中状态
    const activeColor = wrapper.find('.project-editor-color-btn-active')
    expect(activeColor.exists()).toBe(true)
    expect(activeColor.attributes('style')).toContain('background-color: rgb(239, 68, 68)')
  })

  it('新建模式应该默认选中第一个颜色', () => {
    const wrapper = mount(ProjectEditor)
    const activeColor = wrapper.find('.project-editor-color-btn-active')
    expect(activeColor.exists()).toBe(true)
    // 第一个颜色是蓝色 #3b82f6
    expect(activeColor.attributes('style')).toContain('background-color: rgb(59, 130, 246)')
  })

  it('应该显示 8 个预定义颜色', () => {
    const wrapper = mount(ProjectEditor)
    const colorBtns = wrapper.findAll('.project-editor-color-btn')
    expect(colorBtns.length).toBe(8)
  })

  it('点击颜色按钮应该切换选中颜色', async () => {
    const wrapper = mount(ProjectEditor)

    // 点击第二个颜色（红色）
    const colorBtns = wrapper.findAll('.project-editor-color-btn')
    await colorBtns[1].trigger('click')

    const activeColor = wrapper.find('.project-editor-color-btn-active')
    expect(activeColor.attributes('style')).toContain('background-color: rgb(239, 68, 68)')
  })

  it('空名称时保存按钮应该禁用', () => {
    const wrapper = mount(ProjectEditor)
    const saveBtn = wrapper.find('.project-editor-btn-save')
    expect((saveBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('输入有效名称后保存按钮应该启用', async () => {
    const wrapper = mount(ProjectEditor)
    const input = wrapper.find('#project-name')
    await input.setValue('测试项目')

    const saveBtn = wrapper.find('.project-editor-btn-save')
    expect((saveBtn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('名称超过 50 字符应该显示错误', async () => {
    const wrapper = mount(ProjectEditor)
    const input = wrapper.find('#project-name')
    const longName = 'a'.repeat(51)
    await input.setValue(longName)

    expect(wrapper.text()).toContain('项目名称不能超过 50 个字符')
  })

  it('应该显示字符计数', async () => {
    const wrapper = mount(ProjectEditor)
    const input = wrapper.find('#project-name')
    await input.setValue('测试')

    expect(wrapper.text()).toContain('2/50')
  })

  it('点击保存应该触发 save 事件', async () => {
    const wrapper = mount(ProjectEditor)
    const input = wrapper.find('#project-name')
    await input.setValue('新项目')

    // 点击第三个颜色（绿色）
    const colorBtns = wrapper.findAll('.project-editor-color-btn')
    await colorBtns[2].trigger('click')

    const saveBtn = wrapper.find('.project-editor-btn-save')
    await saveBtn.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
    expect(wrapper.emitted('save')?.[0]).toEqual([
      { name: '新项目', color: '#22c55e' },
    ])
  })

  it('点击取消应该触发 cancel 事件', async () => {
    const wrapper = mount(ProjectEditor)
    const cancelBtn = wrapper.find('.project-editor-btn-cancel')
    await cancelBtn.trigger('click')

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('编辑非默认项目应该显示删除按钮', () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockProject },
    })
    const deleteBtn = wrapper.find('.project-editor-btn-delete')
    expect(deleteBtn.exists()).toBe(true)
  })

  it('编辑默认项目不应该显示删除按钮', () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockDefaultProject },
    })
    const deleteBtn = wrapper.find('.project-editor-btn-delete')
    expect(deleteBtn.exists()).toBe(false)
  })

  it('新建模式不应该显示删除按钮', () => {
    const wrapper = mount(ProjectEditor)
    const deleteBtn = wrapper.find('.project-editor-btn-delete')
    expect(deleteBtn.exists()).toBe(false)
  })

  it('点击删除按钮应该显示确认对话框', async () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockProject, taskCount: 5 },
    })

    const deleteBtn = wrapper.find('.project-editor-btn-delete')
    await deleteBtn.trigger('click')

    // 确认对话框应该显示
    const modal = wrapper.find('.mock-modal')
    expect(modal.exists()).toBe(true)
    expect(wrapper.text()).toContain('工作项目')
    expect(wrapper.text()).toContain('5')
  })

  it('确认删除应该触发 delete 事件', async () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockProject, taskCount: 3 },
    })

    // 打开确认对话框
    const deleteBtn = wrapper.find('.project-editor-btn-delete')
    await deleteBtn.trigger('click')

    // 点击确认
    const confirmBtn = wrapper.find('.mock-confirm')
    await confirmBtn.trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual(['project-1'])
  })

  it('取消删除不应该触发 delete 事件', async () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockProject, taskCount: 3 },
    })

    // 打开确认对话框
    const deleteBtn = wrapper.find('.project-editor-btn-delete')
    await deleteBtn.trigger('click')

    // 点击取消
    const cancelModalBtn = wrapper.find('.mock-cancel')
    await cancelModalBtn.trigger('click')

    expect(wrapper.emitted('delete')).toBeFalsy()
  })

  it('名称输入应该有正确的 ARIA 属性', () => {
    const wrapper = mount(ProjectEditor)
    const input = wrapper.find('#project-name')

    expect(input.attributes('aria-required')).toBe('true')
  })

  it('颜色选择器应该有 radiogroup 角色', () => {
    const wrapper = mount(ProjectEditor)
    const colorGroup = wrapper.find('.project-editor-colors')
    expect(colorGroup.attributes('role')).toBe('radiogroup')
  })

  it('颜色按钮应该有 radio 角色和 aria-checked', () => {
    const wrapper = mount(ProjectEditor)
    const colorBtns = wrapper.findAll('.project-editor-color-btn')

    // 第一个应该被选中
    expect(colorBtns[0].attributes('role')).toBe('radio')
    expect(colorBtns[0].attributes('aria-checked')).toBe('true')

    // 第二个不应该被选中
    expect(colorBtns[1].attributes('aria-checked')).toBe('false')
  })

  it('保存时应该 trim 名称', async () => {
    const wrapper = mount(ProjectEditor)
    const input = wrapper.find('#project-name')
    await input.setValue('  带空格的名称  ')

    const saveBtn = wrapper.find('.project-editor-btn-save')
    await saveBtn.trigger('click')

    expect(wrapper.emitted('save')?.[0]).toEqual([
      { name: '带空格的名称', color: '#3b82f6' },
    ])
  })

  it('切换项目 prop 应该重置表单', async () => {
    const wrapper = mount(ProjectEditor, {
      props: { project: mockProject },
    })

    // 验证初始值
    const input = wrapper.find('#project-name')
    expect((input.element as HTMLInputElement).value).toBe('工作项目')

    // 切换到新建模式
    await wrapper.setProps({ project: null })
    expect((input.element as HTMLInputElement).value).toBe('')
  })
})
