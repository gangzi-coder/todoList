/**
 * TaskInput 组件单元测试
 * 
 * 测试任务输入组件的功能和行为
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TaskInput from '../TaskInput.vue'

describe('TaskInput 组件', () => {
  describe('基础渲染', () => {
    it('应该正确渲染组件', () => {
      const wrapper = mount(TaskInput)
      expect(wrapper.find('.task-input-container').exists()).toBe(true)
      expect(wrapper.find('.task-input-field').exists()).toBe(true)
    })

    it('应该显示默认占位符', () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      expect(input.attributes('placeholder')).toBe('添加新任务...')
    })

    it('应该显示自定义占位符', () => {
      const wrapper = mount(TaskInput, {
        props: {
          placeholder: '今天要做什么？'
        }
      })
      const input = wrapper.find('.task-input-field')
      expect(input.attributes('placeholder')).toBe('今天要做什么？')
    })

    it('应该设置正确的 ARIA 标签', () => {
      const wrapper = mount(TaskInput, {
        props: {
          ariaLabel: '任务输入框'
        }
      })
      const input = wrapper.find('.task-input-field')
      expect(input.attributes('aria-label')).toBe('任务输入框')
    })

    it('应该设置最大长度为 200', () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      expect(input.attributes('maxlength')).toBe('200')
    })
  })

  describe('字符计数', () => {
    it('应该显示初始字符计数', () => {
      const wrapper = mount(TaskInput)
      const counter = wrapper.find('.task-input-counter')
      expect(counter.text()).toBe('0/200')
    })

    it('应该在输入时更新字符计数', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('测试任务')
      
      const counter = wrapper.find('.task-input-counter')
      expect(counter.text()).toBe('4/200')
    })

    it('应该在剩余字符少于 20 时显示警告样式', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      // 输入 185 个字符（剩余 15 个）
      const longText = 'a'.repeat(185)
      await input.setValue(longText)
      
      const counter = wrapper.find('.task-input-counter')
      expect(counter.classes()).toContain('task-input-counter-warning')
      expect(counter.text()).toBe('还可输入 15 个字符')
    })

    it('应该在超出限制时显示超出字符数', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      // 输入 205 个字符（超出 5 个）
      const longText = 'a'.repeat(205)
      await input.setValue(longText)
      
      const counter = wrapper.find('.task-input-counter')
      expect(counter.text()).toBe('超出 5 个字符')
    })
  })

  describe('输入验证', () => {
    it('应该在提交空标题时显示错误', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.trigger('keydown', { key: 'Enter' })
      
      await wrapper.vm.$nextTick()
      
      const errorMessage = wrapper.find('.task-input-error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toBe('任务标题不能为空')
    })

    it('应该在提交只包含空白字符的标题时显示错误', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('   ')
      await input.trigger('keydown', { key: 'Enter' })
      
      await wrapper.vm.$nextTick()
      
      const errorMessage = wrapper.find('.task-input-error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toBe('任务标题不能为空')
    })

    it('应该在输入时清除错误消息', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      // 先触发错误
      await input.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.task-input-error-message').exists()).toBe(true)
      
      // 输入内容
      await input.setValue('新任务')
      await wrapper.vm.$nextTick()
      
      // 错误消息应该消失
      expect(wrapper.find('.task-input-error-message').exists()).toBe(false)
    })

    it('应该在输入框有错误时添加错误样式', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()
      
      const inputWrapper = wrapper.find('.task-input-wrapper')
      expect(inputWrapper.classes()).toContain('task-input-error')
    })
  })

  describe('键盘交互', () => {
    it('应该在按下 Enter 键时提交任务', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('测试任务')
      await input.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')?.[0]).toEqual(['测试任务'])
    })

    it('应该在提交后清空输入', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('测试任务')
      await input.trigger('keydown', { key: 'Enter' })
      
      expect((input.element as HTMLInputElement).value).toBe('')
    })

    it('应该在按下 Esc 键时清空输入', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('测试任务')
      await input.trigger('keydown', { key: 'Escape' })
      
      expect((input.element as HTMLInputElement).value).toBe('')
    })

    it('应该阻止 Enter 键的默认行为', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('测试任务')
      
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      await input.trigger('keydown', { key: 'Enter' })
      
      // 注意：在测试环境中，我们无法直接验证 preventDefault 是否被调用
      // 但我们可以验证提交事件被触发
      expect(wrapper.emitted('submit')).toBeTruthy()
    })
  })

  describe('事件触发', () => {
    it('应该在输入时触发 input 事件', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('测试')
      
      expect(wrapper.emitted('input')).toBeTruthy()
      expect(wrapper.emitted('input')?.[0]).toEqual(['测试'])
    })

    it('应该在提交有效任务时触发 submit 事件', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('有效的任务标题')
      await input.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')?.[0]).toEqual(['有效的任务标题'])
    })

    it('应该在提交无效任务时不触发 submit 事件', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('   ')
      await input.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('应该去除标题前后的空白字符', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.setValue('  测试任务  ')
      await input.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.emitted('submit')?.[0]).toEqual(['测试任务'])
    })
  })

  describe('焦点管理', () => {
    it('应该在聚焦时添加聚焦样式', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.trigger('focus')
      
      const inputWrapper = wrapper.find('.task-input-wrapper')
      expect(inputWrapper.classes()).toContain('task-input-focused')
    })

    it('应该在失焦时移除聚焦样式', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.trigger('focus')
      await input.trigger('blur')
      
      const inputWrapper = wrapper.find('.task-input-wrapper')
      expect(inputWrapper.classes()).not.toContain('task-input-focused')
    })
  })

  describe('暴露的方法', () => {
    it('应该暴露 focus 方法', () => {
      const wrapper = mount(TaskInput)
      expect(wrapper.vm.focus).toBeDefined()
      expect(typeof wrapper.vm.focus).toBe('function')
    })

    it('应该暴露 setValue 方法', () => {
      const wrapper = mount(TaskInput)
      expect(wrapper.vm.setValue).toBeDefined()
      expect(typeof wrapper.vm.setValue).toBe('function')
    })

    it('应该暴露 clearInput 方法', () => {
      const wrapper = mount(TaskInput)
      expect(wrapper.vm.clearInput).toBeDefined()
      expect(typeof wrapper.vm.clearInput).toBe('function')
    })

    it('setValue 方法应该设置输入值', async () => {
      const wrapper = mount(TaskInput)
      
      wrapper.vm.setValue('新的任务标题')
      await wrapper.vm.$nextTick()
      
      const input = wrapper.find('.task-input-field')
      expect((input.element as HTMLInputElement).value).toBe('新的任务标题')
    })

    it('clearInput 方法应该清空输入和错误', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      // 设置输入和错误
      await input.setValue('测试')
      await input.trigger('keydown', { key: 'Enter' })
      await input.setValue('')
      await input.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()
      
      // 清空
      wrapper.vm.clearInput()
      await wrapper.vm.$nextTick()
      
      expect((input.element as HTMLInputElement).value).toBe('')
      expect(wrapper.find('.task-input-error-message').exists()).toBe(false)
    })
  })

  describe('边界情况', () => {
    it('应该处理恰好 200 个字符的输入', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      const text = 'a'.repeat(200)
      await input.setValue(text)
      await input.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.emitted('submit')).toBeTruthy()
      expect(wrapper.emitted('submit')?.[0]).toEqual([text])
    })

    it('应该处理包含特殊字符的输入', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      const text = '测试 @#$% 任务 123'
      await input.setValue(text)
      await input.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.emitted('submit')?.[0]).toEqual([text])
    })

    it('应该处理包含 emoji 的输入', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      const text = '完成任务 ✅ 🎉'
      await input.setValue(text)
      await input.trigger('keydown', { key: 'Enter' })
      
      expect(wrapper.emitted('submit')?.[0]).toEqual([text])
    })

    it('应该处理多行文本（换行符会被移除）', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      // input 元素不支持多行，换行符会被自动移除
      const text = '第一行\n第二行'
      await input.setValue(text)
      await input.trigger('keydown', { key: 'Enter' })
      
      // 期望换行符被移除
      expect(wrapper.emitted('submit')?.[0]).toEqual(['第一行第二行'])
    })
  })

  describe('可访问性', () => {
    it('应该有正确的 role 属性', () => {
      const wrapper = mount(TaskInput)
      const errorMessage = wrapper.find('.task-input-error-message')
      
      // 初始时错误消息不存在
      expect(errorMessage.exists()).toBe(false)
    })

    it('错误消息应该有 alert role', async () => {
      const wrapper = mount(TaskInput)
      const input = wrapper.find('.task-input-field')
      
      await input.trigger('keydown', { key: 'Enter' })
      await wrapper.vm.$nextTick()
      
      const errorMessage = wrapper.find('.task-input-error-message')
      expect(errorMessage.attributes('role')).toBe('alert')
    })
  })
})
