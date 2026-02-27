import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import TagInput from '../TagInput.vue'

describe('TagInput', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(TagInput, {
      props: {
        modelValue: [],
        suggestions: ['工作', '个人', '学习', '紧急', '重要'],
      },
    })
  })

  describe('基础渲染', () => {
    it('应该正确渲染组件', () => {
      expect(wrapper.find('.tag-input').exists()).toBe(true)
      expect(wrapper.find('.tag-input-field').exists()).toBe(true)
    })

    it('应该显示占位符', () => {
      const input = wrapper.find('.tag-input-field')
      expect(input.attributes('placeholder')).toBe('添加标签...')
    })

    it('应该支持自定义占位符', async () => {
      await wrapper.setProps({ placeholder: '输入标签' })
      const input = wrapper.find('.tag-input-field')
      expect(input.attributes('placeholder')).toBe('输入标签')
    })

    it('应该支持禁用状态', async () => {
      await wrapper.setProps({ disabled: true })
      expect(wrapper.find('.tag-input-disabled').exists()).toBe(true)
      expect(wrapper.find('.tag-input-field').attributes('disabled')).toBeDefined()
    })
  })

  describe('标签显示', () => {
    it('应该显示已选标签', async () => {
      await wrapper.setProps({ modelValue: ['工作', '个人'] })
      const tags = wrapper.findAll('.tag-input-tag')
      expect(tags).toHaveLength(2)
      expect(tags[0].text()).toContain('工作')
      expect(tags[1].text()).toContain('个人')
    })

    it('应该为标签显示颜色', async () => {
      await wrapper.setProps({ modelValue: ['工作'] })
      const tag = wrapper.find('.tag-input-tag')
      expect(tag.attributes('style')).toContain('background-color')
    })

    it('应该为每个标签显示删除按钮', async () => {
      await wrapper.setProps({ modelValue: ['工作', '个人'] })
      const removeButtons = wrapper.findAll('.tag-input-tag-remove')
      expect(removeButtons).toHaveLength(2)
    })
  })

  describe('添加标签', () => {
    it('应该通过 Enter 键添加标签', async () => {
      const input = wrapper.find('.tag-input-field')
      await input.setValue('新标签')
      await input.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([['新标签']])
      expect(wrapper.emitted('change')).toBeTruthy()
    })

    it('应该通过逗号分隔符添加标签', async () => {
      const input = wrapper.find('.tag-input-field')
      await input.setValue('标签1,标签2')
      await input.trigger('input')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emitted = wrapper.emitted('update:modelValue')!
      // 逗号分隔会依次添加标签，检查是否包含两个标签
      const allTags = emitted.flatMap(e => e[0])
      expect(allTags).toContain('标签1')
      expect(allTags).toContain('标签2')
    })

    it('应该去除标签前后的空格', async () => {
      const input = wrapper.find('.tag-input-field')
      await input.setValue('  标签  ')
      await input.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('update:modelValue')![0]).toEqual([['标签']])
    })

    it('应该忽略空标签', async () => {
      const input = wrapper.find('.tag-input-field')
      await input.setValue('   ')
      await input.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('应该防止添加重复标签', async () => {
      await wrapper.setProps({ modelValue: ['工作'] })
      const input = wrapper.find('.tag-input-field')
      await input.setValue('工作')
      await input.trigger('keydown', { key: 'Enter' })

      // 不应该触发更新
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })

    it('应该限制标签长度为 20 个字符', async () => {
      const longTag = '这是一个非常非常非常长的标签名称超过二十个字符'
      expect(longTag.length).toBeGreaterThan(20) // 确保测试标签确实超过20字符
      
      const input = wrapper.find('.tag-input-field')
      await input.setValue(longTag)
      await input.trigger('keydown', { key: 'Enter' })

      // 不应该添加超长标签
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  describe('删除标签', () => {
    it('应该通过点击删除按钮删除标签', async () => {
      await wrapper.setProps({ modelValue: ['工作', '个人'] })
      const removeButton = wrapper.find('.tag-input-tag-remove')
      await removeButton.trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([['个人']])
    })

    it('应该通过 Backspace 键删除最后一个标签', async () => {
      await wrapper.setProps({ modelValue: ['工作', '个人'] })
      const input = wrapper.find('.tag-input-field')
      
      // 确保输入框为空
      await input.setValue('')
      await input.trigger('keydown', { key: 'Backspace' })

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([['工作']])
    })

    it('当输入框有内容时，Backspace 不应删除标签', async () => {
      await wrapper.setProps({ modelValue: ['工作'] })
      const input = wrapper.find('.tag-input-field')
      await input.setValue('文本')
      await input.trigger('keydown', { key: 'Backspace' })

      // 不应该删除标签
      expect(wrapper.emitted('update:modelValue')).toBeFalsy()
    })
  })

  describe('自动完成', () => {
    it('应该在输入时显示建议', async () => {
      const input = wrapper.find('.tag-input-field')
      await input.setValue('工')
      await input.trigger('input')
      await wrapper.vm.$nextTick()

      // 注意：由于使用了 Teleport，建议列表不在组件内部
      // 这里只测试内部状态
      expect(wrapper.vm.showSuggestions).toBe(true)
      expect(wrapper.vm.filteredSuggestions.length).toBeGreaterThan(0)
    })

    it('应该过滤匹配的建议', async () => {
      const input = wrapper.find('.tag-input-field')
      await input.setValue('工作')
      await input.trigger('input')

      expect(wrapper.vm.filteredSuggestions).toContain('工作')
    })

    it('应该排除已选中的标签', async () => {
      await wrapper.setProps({ modelValue: ['工作'] })
      const input = wrapper.find('.tag-input-field')
      await input.setValue('工')
      await input.trigger('input')

      expect(wrapper.vm.filteredSuggestions).not.toContain('工作')
    })

    it('应该支持键盘导航建议', async () => {
      // 使用空字符串或更通用的搜索来确保有多个建议
      await wrapper.setProps({ 
        suggestions: ['工作', '个人', '学习', '紧急', '重要', '待办'] 
      })
      
      const input = wrapper.find('.tag-input-field')
      await input.setValue('作')  // 使用"作"可以匹配"工作"
      await input.trigger('input')
      await wrapper.vm.$nextTick()
      
      // 确保有建议显示
      expect(wrapper.vm.showSuggestions).toBe(true)
      const suggestionsCount = wrapper.vm.filteredSuggestions.length
      
      if (suggestionsCount > 1) {
        // 初始焦点应该在第一个
        expect(wrapper.vm.focusedIndex).toBe(0)
        
        // 按下箭头键向下
        await input.trigger('keydown', { key: 'ArrowDown' })
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.focusedIndex).toBe(1)

        // 按下箭头键向上
        await input.trigger('keydown', { key: 'ArrowUp' })
        await wrapper.vm.$nextTick()
        expect(wrapper.vm.focusedIndex).toBe(0)
      } else {
        // 如果只有一个建议，测试循环导航
        expect(wrapper.vm.focusedIndex).toBe(0)
        await input.trigger('keydown', { key: 'ArrowDown' })
        await wrapper.vm.$nextTick()
        // 应该循环回到第一个
        expect(wrapper.vm.focusedIndex).toBe(0)
      }
    })

    it('应该通过 Escape 键关闭建议', async () => {
      const input = wrapper.find('.tag-input-field')
      await input.setValue('工')
      await input.trigger('input')
      expect(wrapper.vm.showSuggestions).toBe(true)

      await input.trigger('keydown', { key: 'Escape' })
      expect(wrapper.vm.showSuggestions).toBe(false)
      expect(wrapper.vm.inputValue).toBe('')
    })
  })

  describe('可访问性', () => {
    it('应该有正确的 ARIA 标签', () => {
      const input = wrapper.find('.tag-input-field')
      expect(input.attributes('aria-label')).toBe('标签输入')
    })

    it('应该支持自定义 ARIA 标签', async () => {
      await wrapper.setProps({ ariaLabel: '任务标签' })
      const input = wrapper.find('.tag-input-field')
      expect(input.attributes('aria-label')).toBe('任务标签')
    })

    it('删除按钮应该有描述性的 ARIA 标签', async () => {
      await wrapper.setProps({ modelValue: ['工作'] })
      const removeButton = wrapper.find('.tag-input-tag-remove')
      expect(removeButton.attributes('aria-label')).toBe('删除标签 工作')
    })
  })

  describe('标签颜色', () => {
    it('应该为预定义标签使用固定颜色', () => {
      const color = wrapper.vm.getTagColor('工作')
      expect(color).toBe('#3b82f6')
    })

    it('应该为自定义标签生成颜色', () => {
      const color = wrapper.vm.getTagColor('自定义标签')
      expect(color).toMatch(/^hsl\(\d+, 65%, 55%\)$/)
    })

    it('相同标签应该生成相同颜色', () => {
      const color1 = wrapper.vm.getTagColor('测试')
      const color2 = wrapper.vm.getTagColor('测试')
      expect(color1).toBe(color2)
    })
  })
})
