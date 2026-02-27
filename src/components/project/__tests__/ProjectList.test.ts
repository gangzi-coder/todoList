/**
 * ProjectList 组件单元测试
 *
 * 验收标准：
 * - 需求 2.1: 支持创建、编辑、删除项目
 * - 需求 2.9: 点击项目显示该项目的所有任务
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref, computed } from 'vue'
import ProjectList from '../ProjectList.vue'
import type { Project } from '@/types'

const mockDefaultProject: Project = {
  id: 'inbox',
  name: '收件箱',
  color: '#6b7280',
  isDefault: true,
  createdAt: new Date('2024-01-01'),
  order: -1,
}

const mockCustomProjects: Project[] = [
  {
    id: 'project-1',
    name: '工作项目',
    color: '#3b82f6',
    isDefault: false,
    createdAt: new Date('2024-01-01'),
    order: 0,
  },
  {
    id: 'project-2',
    name: '个人项目',
    color: '#10b981',
    isDefault: false,
    createdAt: new Date('2024-01-02'),
    order: 1,
  },
]

const mockSelectProject = vi.fn()
const mockCreateProject = vi.fn().mockResolvedValue({
  id: 'project-new',
  name: '新项目',
  color: '#ef4444',
  isDefault: false,
  createdAt: new Date(),
  order: 2,
})
const mockCurrentProjectId = ref<string | null>('inbox')

vi.mock('@/composables/useProjects', () => ({
  useProjects: () => ({
    defaultProject: computed(() => mockDefaultProject),
    customProjects: computed(() => mockCustomProjects),
    currentProjectId: mockCurrentProjectId,
    selectProject: mockSelectProject,
    createProject: mockCreateProject,
    projects: ref([mockDefaultProject, ...mockCustomProjects]),
    loading: ref(false),
    error: ref(null),
    initialized: ref(true),
    currentProject: computed(() => mockDefaultProject),
    getProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
    getProjectTaskCount: vi.fn(),
    moveTaskToProject: vi.fn(),
    refreshProjects: vi.fn(),
    initialize: vi.fn(),
    clearError: vi.fn(),
  }),
}))

describe('ProjectList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockCurrentProjectId.value = 'inbox'
  })

  it('应该渲染项目列表容器', () => {
    const wrapper = mount(ProjectList)
    expect(wrapper.find('.project-list').exists()).toBe(true)
    expect(wrapper.find('.project-list-title').text()).toBe('项目')
  })

  it('应该在顶部显示默认项目（收件箱）', () => {
    const wrapper = mount(ProjectList)
    const items = wrapper.findAll('.project-item')
    expect(items.length).toBe(3) // 1 默认 + 2 自定义
    expect(items[0].text()).toContain('收件箱')
  })

  it('应该显示所有自定义项目', () => {
    const wrapper = mount(ProjectList)
    const items = wrapper.findAll('.project-item')
    expect(items[1].text()).toContain('工作项目')
    expect(items[2].text()).toContain('个人项目')
  })

  it('应该高亮当前选中的项目', () => {
    mockCurrentProjectId.value = 'project-1'
    const wrapper = mount(ProjectList)
    const items = wrapper.findAll('.project-item')
    // 收件箱不应该高亮
    expect(items[0].classes()).not.toContain('project-item-active')
    // 工作项目应该高亮
    expect(items[1].classes()).toContain('project-item-active')
  })

  it('点击项目应该触发 select 事件并调用 selectProject', async () => {
    const wrapper = mount(ProjectList)
    const items = wrapper.findAll('.project-item')
    await items[1].trigger('click')

    expect(mockSelectProject).toHaveBeenCalledWith('project-1')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')?.[0]).toEqual(['project-1'])
  })

  it('应该正确传递任务数量', () => {
    const wrapper = mount(ProjectList, {
      props: {
        taskCounts: { inbox: 5, 'project-1': 3, 'project-2': 0 },
      },
    })
    const items = wrapper.findAll('.project-item')
    expect(items[0].text()).toContain('5')
    expect(items[1].text()).toContain('3')
    // project-2 任务数量为 0，不应显示数字
    expect(items[2].find('.project-item-count').exists()).toBe(false)
  })

  it('应该显示添加项目按钮', () => {
    const wrapper = mount(ProjectList)
    const addBtn = wrapper.find('.project-list-add-btn')
    expect(addBtn.exists()).toBe(true)
    expect(addBtn.text()).toContain('添加项目')
  })

  it('点击添加按钮应该显示输入表单', async () => {
    const wrapper = mount(ProjectList)
    await wrapper.find('.project-list-add-btn').trigger('click')

    expect(wrapper.find('.project-list-add-form').exists()).toBe(true)
    expect(wrapper.find('.project-list-add-input').exists()).toBe(true)
    expect(wrapper.find('.project-list-add-btn').exists()).toBe(false)
  })

  it('提交表单应该创建新项目', async () => {
    const wrapper = mount(ProjectList)
    // 打开添加表单
    await wrapper.find('.project-list-add-btn').trigger('click')

    // 输入项目名称
    const input = wrapper.find('.project-list-add-input')
    await input.setValue('新项目')

    // 提交表单
    await wrapper.find('.project-list-add-form').trigger('submit')

    expect(mockCreateProject).toHaveBeenCalledWith({ name: '新项目' })
  })

  it('空名称不应该创建项目', async () => {
    const wrapper = mount(ProjectList)
    await wrapper.find('.project-list-add-btn').trigger('click')

    // 不输入名称直接提交
    await wrapper.find('.project-list-add-form').trigger('submit')

    expect(mockCreateProject).not.toHaveBeenCalled()
  })

  it('取消按钮应该关闭添加表单', async () => {
    const wrapper = mount(ProjectList)
    await wrapper.find('.project-list-add-btn').trigger('click')
    expect(wrapper.find('.project-list-add-form').exists()).toBe(true)

    await wrapper.find('.project-list-btn-cancel').trigger('click')
    expect(wrapper.find('.project-list-add-form').exists()).toBe(false)
    expect(wrapper.find('.project-list-add-btn').exists()).toBe(true)
  })

  it('按 Escape 键应该关闭添加表单', async () => {
    const wrapper = mount(ProjectList)
    await wrapper.find('.project-list-add-btn').trigger('click')

    await wrapper.find('.project-list-add-input').trigger('keydown.escape')
    expect(wrapper.find('.project-list-add-form').exists()).toBe(false)
  })

  it('确认按钮在名称为空时应该禁用', async () => {
    const wrapper = mount(ProjectList)
    await wrapper.find('.project-list-add-btn').trigger('click')

    const confirmBtn = wrapper.find('.project-list-btn-confirm')
    expect((confirmBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('点击编辑应该触发 edit 事件', async () => {
    const wrapper = mount(ProjectList)
    // 自定义项目有编辑按钮
    const editBtns = wrapper.findAll('.project-item-action-btn:not(.project-item-action-btn-delete)')
    // 第一个编辑按钮属于 project-1
    await editBtns[0].trigger('click')

    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual(['project-1'])
  })

  it('点击删除应该触发 delete 事件', async () => {
    const wrapper = mount(ProjectList)
    const deleteBtns = wrapper.findAll('.project-item-action-btn-delete')
    await deleteBtns[0].trigger('click')

    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')?.[0]).toEqual(['project-1'])
  })

  it('应该有正确的 ARIA 属性', () => {
    const wrapper = mount(ProjectList)
    expect(wrapper.find('.project-list').attributes('role')).toBe('navigation')
    expect(wrapper.find('.project-list').attributes('aria-label')).toBe('项目列表')
    expect(wrapper.find('.project-list-items').attributes('role')).toBe('list')
  })
})
