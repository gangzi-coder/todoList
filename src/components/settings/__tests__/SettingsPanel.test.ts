/**
 * SettingsPanel 组件单元测试
 *
 * 验收标准：
 * - 需求 15.1: 提供设置面板
 * - 需求 15.2: 允许选择默认视图
 * - 需求 15.3: 允许选择默认任务排序方式
 * - 需求 15.4: 允许设置是否自动删除已完成任务
 * - 需求 15.5: 允许设置删除延迟天数（1-30 天）
 * - 需求 15.6: 允许设置任务完成时是否播放音效
 * - 需求 15.7: 允许选择主题模式
 * - 需求 15.8: 允许设置每周的第一天
 * - 需求 14.8: 在设置中显示所有可用快捷键的列表
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsPanel from '../SettingsPanel.vue'
import { useSettingsStore } from '@/stores/settingsStore'

// Mock useTheme composable
vi.mock('@/composables/useTheme', () => ({
  useTheme: () => ({
    setThemeMode: vi.fn(),
  }),
}))

describe('SettingsPanel', () => {
  let settingsStore: ReturnType<typeof useSettingsStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    settingsStore = useSettingsStore()
    // 手动设置初始状态，跳过 initialize 的异步逻辑
    settingsStore.settings = {
      defaultView: 'today',
      defaultSort: 'createdAt',
      themeMode: 'auto',
      enableReminders: true,
      autoDeleteCompleted: false,
      autoDeleteDelay: 7,
      playCompletionSound: false,
      weekStartsOn: 1,
      enableAnimations: true,
    }
  })

  function createWrapper() {
    return mount(SettingsPanel, {
      global: {
        plugins: [],
      },
    })
  }

  it('应该渲染设置面板标题', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.settings-title').text()).toContain('设置')
  })

  it('应该有关闭按钮并触发 close 事件', async () => {
    const wrapper = createWrapper()
    await wrapper.find('.settings-close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('应该显示默认视图选择器', () => {
    const wrapper = createWrapper()
    const select = wrapper.find('#default-view')
    expect(select.exists()).toBe(true)
    expect((select.element as HTMLSelectElement).value).toBe('today')
  })

  it('更改默认视图应该调用 store', async () => {
    const wrapper = createWrapper()
    const spy = vi.spyOn(settingsStore, 'setDefaultView')
    const select = wrapper.find('#default-view')
    await select.setValue('inbox')
    expect(spy).toHaveBeenCalledWith('inbox')
  })

  it('应该显示默认排序选择器', () => {
    const wrapper = createWrapper()
    const select = wrapper.find('#default-sort')
    expect(select.exists()).toBe(true)
    expect((select.element as HTMLSelectElement).value).toBe('createdAt')
  })

  it('更改默认排序应该调用 store', async () => {
    const wrapper = createWrapper()
    const spy = vi.spyOn(settingsStore, 'setDefaultSort')
    const select = wrapper.find('#default-sort')
    await select.setValue('priority')
    expect(spy).toHaveBeenCalledWith('priority')
  })

  it('应该显示每周第一天选择器', () => {
    const wrapper = createWrapper()
    const select = wrapper.find('#week-start')
    expect(select.exists()).toBe(true)
  })

  it('应该显示主题模式选择器', () => {
    const wrapper = createWrapper()
    const select = wrapper.find('#theme-mode')
    expect(select.exists()).toBe(true)
    expect((select.element as HTMLSelectElement).value).toBe('auto')
  })

  it('应该显示启用动画开关', () => {
    const wrapper = createWrapper()
    const toggle = wrapper.find('#toggle-animations')
    expect(toggle.exists()).toBe(true)
    expect((toggle.element as HTMLInputElement).checked).toBe(true)
  })

  it('切换动画开关应该调用 store', async () => {
    const wrapper = createWrapper()
    const spy = vi.spyOn(settingsStore, 'setEnableAnimations')
    const toggle = wrapper.find('#toggle-animations')
    await toggle.setValue(false)
    expect(spy).toHaveBeenCalledWith(false)
  })

  it('应该显示启用提醒开关', () => {
    const wrapper = createWrapper()
    const toggle = wrapper.find('#toggle-reminders')
    expect(toggle.exists()).toBe(true)
    expect((toggle.element as HTMLInputElement).checked).toBe(true)
  })

  it('切换提醒开关应该调用 store', async () => {
    const wrapper = createWrapper()
    const spy = vi.spyOn(settingsStore, 'setEnableReminders')
    const toggle = wrapper.find('#toggle-reminders')
    await toggle.setValue(false)
    expect(spy).toHaveBeenCalledWith(false)
  })

  it('应该显示完成音效开关', () => {
    const wrapper = createWrapper()
    const toggle = wrapper.find('#toggle-sound')
    expect(toggle.exists()).toBe(true)
    expect((toggle.element as HTMLInputElement).checked).toBe(false)
  })

  it('切换完成音效开关应该调用 store', async () => {
    const wrapper = createWrapper()
    const spy = vi.spyOn(settingsStore, 'setPlayCompletionSound')
    const toggle = wrapper.find('#toggle-sound')
    await toggle.setValue(true)
    expect(spy).toHaveBeenCalledWith(true)
  })

  it('应该显示自动删除开关', () => {
    const wrapper = createWrapper()
    const toggle = wrapper.find('#toggle-auto-delete')
    expect(toggle.exists()).toBe(true)
    expect((toggle.element as HTMLInputElement).checked).toBe(false)
  })

  it('自动删除关闭时不应显示延迟天数输入', () => {
    const wrapper = createWrapper()
    const delayInput = wrapper.find('#auto-delete-delay')
    expect(delayInput.exists()).toBe(false)
  })

  it('自动删除开启时应显示延迟天数输入', async () => {
    settingsStore.settings.autoDeleteCompleted = true
    const wrapper = createWrapper()
    const delayInput = wrapper.find('#auto-delete-delay')
    expect(delayInput.exists()).toBe(true)
    expect((delayInput.element as HTMLInputElement).value).toBe('7')
  })

  it('更改延迟天数应该调用 store', async () => {
    settingsStore.settings.autoDeleteCompleted = true
    const wrapper = createWrapper()
    const spy = vi.spyOn(settingsStore, 'setAutoDeleteDelay')
    const input = wrapper.find('#auto-delete-delay')
    await input.setValue(14)
    expect(spy).toHaveBeenCalledWith(14)
  })

  it('应该显示快捷键列表', () => {
    const wrapper = createWrapper()
    const items = wrapper.findAll('.shortcut-item')
    expect(items.length).toBe(12)
  })

  it('快捷键列表应包含搜索快捷键', () => {
    const wrapper = createWrapper()
    const descriptions = wrapper.findAll('.shortcut-desc').map(el => el.text())
    expect(descriptions).toContain('打开搜索')
    expect(descriptions).toContain('创建新任务')
    expect(descriptions).toContain('切换暗色模式')
  })

  it('应该有正确的 ARIA 属性', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.settings-panel').attributes('role')).toBe('dialog')
    expect(wrapper.find('.settings-panel').attributes('aria-label')).toBe('设置面板')
    expect(wrapper.find('.shortcuts-list').attributes('role')).toBe('list')
  })

  it('应该显示 5 个分组标题', () => {
    const wrapper = createWrapper()
    const titles = wrapper.findAll('.settings-section-title').map(el => el.text())
    expect(titles).toContain('常规')
    expect(titles).toContain('外观')
    expect(titles).toContain('行为')
    expect(titles).toContain('数据管理')
    expect(titles).toContain('快捷键')
  })

  // 数据管理相关测试
  it('应该显示导出按钮', () => {
    const wrapper = createWrapper()
    const btn = wrapper.find('[aria-label="导出数据为 JSON 文件"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('导出')
  })

  it('应该显示导入按钮', () => {
    const wrapper = createWrapper()
    const btn = wrapper.find('[aria-label="从 JSON 文件导入数据"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('导入')
  })

  it('应该有隐藏的文件输入框', () => {
    const wrapper = createWrapper()
    const input = wrapper.find('.file-input-hidden')
    expect(input.exists()).toBe(true)
    expect(input.attributes('type')).toBe('file')
    expect(input.attributes('accept')).toBe('.json')
  })
})
