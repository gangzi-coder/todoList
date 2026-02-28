<template>
  <Modal
    :model-value="modelValue"
    :title="isEditMode ? '编辑任务' : '创建任务'"
    size="large"
    :show-footer="false"
    @update:model-value="handleClose"
  >
    <form class="task-editor" @submit.prevent="handleSubmit">
      <!-- 任务标题 -->
      <div class="task-editor-field">
        <label for="task-title" class="task-editor-label">
          任务标题 <span class="task-editor-required">*</span>
        </label>
        <input
          id="task-title"
          v-model="formData.title"
          type="text"
          class="task-editor-input"
          :class="{ 'task-editor-input-error': errors.title }"
          placeholder="输入任务标题..."
          maxlength="200"
          aria-required="true"
          :aria-invalid="!!errors.title"
          :aria-describedby="errors.title ? 'title-error' : undefined"
          @input="validateTitleOnInput"
        />
        <div class="task-editor-field-footer">
          <span v-if="errors.title" id="title-error" class="task-editor-error" role="alert">
            {{ errors.title }}
          </span>
          <span
            class="task-editor-counter"
            :class="{
              'task-editor-counter-warning': isTitleNearLimit,
              'task-editor-counter-error': isTitleOverLimit
            }"
          >
            {{ titleCharCountText }}
          </span>
        </div>
      </div>

      <!-- 项目选择 -->
      <div class="task-editor-field">
        <label for="task-project" class="task-editor-label">项目</label>
        <Dropdown
          v-model="formData.projectId"
          :options="projectOptions"
          placeholder="选择项目"
          aria-label="选择项目"
        />
      </div>

      <!-- 优先级选择 -->
      <div class="task-editor-field">
        <label for="task-priority" class="task-editor-label">优先级</label>
        <Dropdown
          v-model="formData.priority"
          :options="priorityOptions"
          placeholder="选择优先级"
          aria-label="选择优先级"
        >
          <template #option="{ option }">
            <span class="priority-option">
              <span
                class="priority-indicator"
                :class="`priority-${(option as any).value}`"
              ></span>
              {{ (option as any).label }}
            </span>
          </template>
        </Dropdown>
      </div>

      <!-- 标签输入 -->
      <div class="task-editor-field">
        <label for="task-tags" class="task-editor-label">标签</label>
        <TagInput
          v-model="formData.tags"
          :suggestions="availableTags"
          placeholder="添加标签..."
          aria-label="任务标签"
        />
      </div>

      <!-- 开始时间 -->
      <div class="task-editor-field">
        <label for="task-start-date" class="task-editor-label">开始时间</label>
        <DatePicker
          v-model="formData.startDate"
          :enable-time="true"
          placeholder="选择开始时间"
          aria-label="开始时间"
        />
        <span v-if="startDateWarning" class="task-editor-warning" role="alert">
          ⚠️ {{ startDateWarning }}
        </span>
      </div>

      <!-- 截止日期 -->
      <div class="task-editor-field">
        <label for="task-due-date" class="task-editor-label">截止日期</label>
        <DatePicker
          v-model="formData.dueDate"
          :enable-time="true"
          placeholder="选择截止日期"
          aria-label="截止日期"
        />
        <span v-if="dueDateWarning" class="task-editor-warning" role="alert">
          ⚠️ {{ dueDateWarning }}
        </span>
      </div>

      <!-- 备注 -->
      <div class="task-editor-field">
        <label for="task-notes" class="task-editor-label">备注</label>
        <textarea
          id="task-notes"
          v-model="formData.notes"
          class="task-editor-textarea"
          :class="{ 'task-editor-input-error': errors.notes }"
          placeholder="添加备注..."
          maxlength="500"
          rows="4"
          :aria-invalid="!!errors.notes"
          :aria-describedby="errors.notes ? 'notes-error' : undefined"
          @input="validateNotesOnInput"
        ></textarea>
        <div class="task-editor-field-footer">
          <span v-if="errors.notes" id="notes-error" class="task-editor-error" role="alert">
            {{ errors.notes }}
          </span>
          <span
            class="task-editor-counter"
            :class="{
              'task-editor-counter-warning': isNotesNearLimit,
              'task-editor-counter-error': isNotesOverLimit
            }"
          >
            {{ notesCharCountText }}
          </span>
        </div>
      </div>

      <!-- 重复任务 -->
      <div class="task-editor-field">
        <label class="task-editor-label">重复</label>
        <Dropdown
          v-model="formData.recurrenceFrequency"
          :options="recurrenceOptions"
          placeholder="不重复"
          aria-label="重复频率"
        />
        <!-- 重复间隔 -->
        <div v-if="formData.recurrenceFrequency !== 'none'" class="task-editor-recurrence-detail">
          <label class="task-editor-sublabel">每</label>
          <input
            v-model.number="formData.recurrenceInterval"
            type="number"
            min="1"
            max="99"
            class="task-editor-number-input"
            aria-label="重复间隔"
          />
          <span class="task-editor-sublabel">{{ recurrenceIntervalUnit }}</span>
        </div>
        <!-- 每周重复：选择星期几 -->
        <div v-if="formData.recurrenceFrequency === 'weekly'" class="task-editor-weekdays">
          <button
            v-for="(label, index) in weekdayLabels"
            :key="index"
            type="button"
            class="task-editor-weekday-btn"
            :class="{ 'task-editor-weekday-btn-active': formData.recurrenceDaysOfWeek.includes(index) }"
            @click="toggleWeekday(index)"
          >
            {{ label }}
          </button>
        </div>
        <!-- 重复结束日期 -->
        <div v-if="formData.recurrenceFrequency !== 'none'" class="task-editor-recurrence-detail">
          <label class="task-editor-sublabel">结束日期</label>
          <DatePicker
            v-model="formData.recurrenceEndDate"
            placeholder="永不结束"
            aria-label="重复结束日期"
          />
        </div>
      </div>

      <!-- 子任务列表（仅编辑模式） -->
      <div v-if="isEditMode && task" class="task-editor-field">
        <label class="task-editor-label">子任务</label>
        <SubtaskList
          :parent-id="task.id"
          :project-id="formData.projectId"
        />
      </div>

      <!-- 底部按钮 -->
      <div class="task-editor-actions">
        <button
          v-if="isEditMode"
          type="button"
          class="task-editor-button task-editor-button-delete"
          title="删除任务"
          @click="handleDelete"
        >
          🗑️ 删除
        </button>
        <div class="task-editor-actions-right">
          <button
            type="button"
            class="task-editor-button task-editor-button-cancel"
            title="取消编辑"
            @click="handleCancel"
          >
            取消
          </button>
          <button
            type="submit"
            class="task-editor-button task-editor-button-submit"
            :disabled="!isFormValid || isSubmitting"
            :title="isEditMode ? '保存修改' : '创建任务'"
          >
            {{ isSubmitting ? '保存中...' : (isEditMode ? '保存' : '创建') }}
          </button>
        </div>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '../common/Modal.vue'
import Dropdown from '../common/Dropdown.vue'
import DatePicker from '../common/DatePicker.vue'
import TagInput from '../common/TagInput.vue'
import SubtaskList from './SubtaskList.vue'
import type { Task, Priority, CreateTaskDTO, RecurrenceFrequency, RecurrenceRule } from '../../types'
import { validateTaskTitle, validateTaskNotes, getRemainingCharsText } from '../../utils/validation'

/**
 * TaskEditor 组件
 * 
 * 任务编辑器组件，用于创建和编辑任务
 * 
 * 验收标准：
 * - 需求 1.3: 允许用户修改任务的所有属性
 * - 需求 4.1: 支持四个优先级等级
 * - 需求 4.3: 允许为任务添加多个标签
 * - 需求 4.5: 允许为任务设置截止日期和时间
 * - 需求 4.8: 允许为任务添加文本备注
 * - 需求 18.1: 提交空任务标题时显示验证错误
 * - 需求 18.2: 限制任务标题最多 200 个字符
 * - 需求 18.3: 限制任务备注最多 500 个字符
 * - 需求 18.4: 限制项目名称最多 50 个字符
 * - 需求 18.6: 输入超过长度限制时显示剩余字符数提示
 * - 需求 18.7: 设置截止日期早于当前日期时显示警告提示
 */

interface Props {
  /** 是否显示编辑器 */
  modelValue: boolean
  /** 要编辑的任务（如果是编辑模式） */
  task?: Task | null
  /** 可用的项目列表 */
  projects?: Array<{ id: string; name: string; color: string }>
  /** 可用的标签列表 */
  availableTags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  projects: () => [],
  availableTags: () => [],
})

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'submit', data: CreateTaskDTO | Partial<Task>): void
  (e: 'cancel'): void
  (e: 'delete', taskId: string): void
}

const emit = defineEmits<Emits>()

// 表单数据
const formData = ref({
  title: '',
  notes: '',
  projectId: '',
  priority: 'none' as Priority,
  tags: [] as string[],
  startDate: null as Date | null,
  dueDate: null as Date | null,
  recurrenceFrequency: 'none' as RecurrenceFrequency | 'none',
  recurrenceInterval: 1,
  recurrenceDaysOfWeek: [] as number[],
  recurrenceEndDate: null as Date | null,
})

// 表单错误
const errors = ref({
  title: '',
  notes: '',
})

// 提交状态
const isSubmitting = ref(false)

/**
 * 是否为编辑模式
 */
const isEditMode = computed(() => !!props.task)

/**
 * 项目选项
 */
const projectOptions = computed(() => {
  return props.projects.map(project => ({
    label: project.name,
    value: project.id,
  }))
})

/**
 * 优先级选项
 */
const priorityOptions = computed(() => [
  { label: '无', value: 'none' },
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
])

/**
 * 开始时间警告
 */
const startDateWarning = computed(() => {
  if (!formData.value.startDate || !formData.value.dueDate) {
    return ''
  }
  
  const startDate = new Date(formData.value.startDate)
  const dueDate = new Date(formData.value.dueDate)
  
  if (startDate > dueDate) {
    return '开始时间晚于截止日期'
  }
  
  return ''
})

/**
 * 重复选项
 */
const recurrenceOptions = computed(() => [
  { label: '不重复', value: 'none' },
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
  { label: '每年', value: 'yearly' },
])

/**
 * 重复间隔单位文本
 */
const recurrenceIntervalUnit = computed(() => {
  const map: Record<string, string> = {
    daily: '天重复一次',
    weekly: '周重复一次',
    monthly: '月重复一次',
    yearly: '年重复一次',
  }
  return map[formData.value.recurrenceFrequency] || ''
})

/**
 * 星期标签
 */
const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 切换星期几选择
 */
const toggleWeekday = (day: number) => {
  const idx = formData.value.recurrenceDaysOfWeek.indexOf(day)
  if (idx >= 0) {
    formData.value.recurrenceDaysOfWeek.splice(idx, 1)
  } else {
    formData.value.recurrenceDaysOfWeek.push(day)
  }
}

/**
 * 截止日期警告
 */
const dueDateWarning = computed(() => {
  if (!formData.value.dueDate) {
    return ''
  }
  
  const now = new Date()
  const dueDate = new Date(formData.value.dueDate)
  
  // 移除时间部分进行比较
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
  
  if (dueDateOnly < today) {
    return '截止日期早于今天'
  }
  
  return ''
})

/**
 * 标题字符计数文本
 */
const titleCharCountText = computed(() => {
  return getRemainingCharsText(formData.value.title.length, 200)
})

/**
 * 标题是否接近字符限制
 */
const isTitleNearLimit = computed(() => {
  const remaining = 200 - formData.value.title.length
  return remaining <= 20 && remaining >= 0
})

/**
 * 标题是否超出字符限制
 */
const isTitleOverLimit = computed(() => {
  return formData.value.title.length > 200
})

/**
 * 备注字符计数文本
 */
const notesCharCountText = computed(() => {
  return getRemainingCharsText((formData.value.notes || '').length, 500)
})

/**
 * 备注是否接近字符限制
 */
const isNotesNearLimit = computed(() => {
  const remaining = 500 - (formData.value.notes || '').length
  return remaining <= 20 && remaining >= 0
})

/**
 * 备注是否超出字符限制
 */
const isNotesOverLimit = computed(() => {
  return (formData.value.notes || '').length > 500
})

/**
 * 表单是否有效
 */
const isFormValid = computed(() => {
  return formData.value.title.trim().length > 0 && 
         !errors.value.title && 
         !errors.value.notes
})

/**
 * 验证表单
 */
const validateForm = (): boolean => {
  errors.value = {
    title: '',
    notes: '',
  }
  
  // 验证标题
  const titleResult = validateTaskTitle(formData.value.title)
  if (!titleResult.valid && titleResult.error) {
    errors.value.title = titleResult.error
  }
  
  // 验证备注
  if (formData.value.notes) {
    const notesResult = validateTaskNotes(formData.value.notes)
    if (!notesResult.valid && notesResult.error) {
      errors.value.notes = notesResult.error
    }
  }
  
  return !errors.value.title && !errors.value.notes
}

/**
 * 实时验证标题
 */
const validateTitleOnInput = () => {
  if (!formData.value.title) {
    // 输入过程中不显示"不能为空"错误，只在提交时显示
    errors.value.title = ''
    return
  }
  const result = validateTaskTitle(formData.value.title)
  errors.value.title = result.valid ? '' : (result.error || '')
}

/**
 * 实时验证备注
 */
const validateNotesOnInput = () => {
  if (!formData.value.notes) {
    errors.value.notes = ''
    return
  }
  const result = validateTaskNotes(formData.value.notes)
  errors.value.notes = result.valid ? '' : (result.error || '')
}

/**
 * 初始化表单数据
 */
const initFormData = () => {
  if (props.task) {
    // 编辑模式：填充现有任务数据
    const recurrence = props.task.recurrence
    formData.value = {
      title: props.task.title,
      notes: props.task.notes || '',
      projectId: props.task.projectId,
      priority: props.task.priority,
      tags: [...props.task.tags],
      startDate: props.task.startDate ? new Date(props.task.startDate) : null,
      dueDate: props.task.dueDate ? new Date(props.task.dueDate) : null,
      recurrenceFrequency: recurrence ? recurrence.frequency : 'none',
      recurrenceInterval: recurrence ? recurrence.interval : 1,
      recurrenceDaysOfWeek: recurrence?.daysOfWeek ? [...recurrence.daysOfWeek] : [],
      recurrenceEndDate: recurrence?.endDate ? new Date(recurrence.endDate) : null,
    }
  } else {
    // 创建模式：重置表单
    formData.value = {
      title: '',
      notes: '',
      projectId: props.projects.find(p => p.name === '收件箱')?.id || '',
      priority: 'none',
      tags: [],
      startDate: null,
      dueDate: null,
      recurrenceFrequency: 'none',
      recurrenceInterval: 1,
      recurrenceDaysOfWeek: [],
      recurrenceEndDate: null,
    }
  }
  
  // 清除错误
  errors.value = {
    title: '',
    notes: '',
  }
}

/**
 * 处理提交
 */
const handleSubmit = async () => {
  // 验证表单
  if (!validateForm()) {
    return
  }
  
  isSubmitting.value = true
  
  try {
    // 构建重复规则
    let recurrence: RecurrenceRule | undefined = undefined
    if (formData.value.recurrenceFrequency !== 'none') {
      recurrence = {
        frequency: formData.value.recurrenceFrequency as RecurrenceFrequency,
        interval: formData.value.recurrenceInterval || 1,
      }
      if (formData.value.recurrenceFrequency === 'weekly' && formData.value.recurrenceDaysOfWeek.length > 0) {
        recurrence.daysOfWeek = [...formData.value.recurrenceDaysOfWeek]
      }
      if (formData.value.recurrenceEndDate) {
        recurrence.endDate = formData.value.recurrenceEndDate
      }
    }

    if (isEditMode.value) {
      // 编辑模式：提交更新数据
      const updates: Partial<Task> = {
        title: formData.value.title.trim(),
        notes: formData.value.notes.trim() || undefined,
        projectId: formData.value.projectId,
        priority: formData.value.priority,
        tags: formData.value.tags,
        startDate: formData.value.startDate || undefined,
        dueDate: formData.value.dueDate || undefined,
        recurrence,
      }
      emit('submit', updates)
    } else {
      // 创建模式：提交新任务数据
      const taskData: CreateTaskDTO = {
        title: formData.value.title.trim(),
        notes: formData.value.notes.trim() || undefined,
        projectId: formData.value.projectId,
        priority: formData.value.priority,
        tags: formData.value.tags,
        startDate: formData.value.startDate || undefined,
        dueDate: formData.value.dueDate || undefined,
        recurrence,
      }
      emit('submit', taskData)
    }
  } finally {
    isSubmitting.value = false
  }
  
  // 关闭编辑器
  handleClose()
}

/**
 * 处理删除
 */
const handleDelete = () => {
  if (props.task) {
    emit('delete', props.task.id)
    handleClose()
  }
}

/**
 * 处理取消
 */
const handleCancel = () => {
  emit('cancel')
  handleClose()
}

/**
 * 处理关闭
 */
const handleClose = () => {
  emit('update:modelValue', false)
}

// 监听 modelValue 变化，初始化表单
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initFormData()
  }
}, { immediate: true })

// 监听 task 变化，更新表单
watch(() => props.task, () => {
  if (props.modelValue) {
    initFormData()
  }
})
</script>

<style scoped>
/* 任务编辑器 */
.task-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 表单字段 */
.task-editor-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-editor-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #1f2937);
}

.task-editor-required {
  color: var(--danger-color, #ef4444);
}

/* 输入框 */
.task-editor-input {
  width: 100%;
  padding: 10px 12px;
  background-color: var(--input-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  transition: all 0.2s;
}

.task-editor-input:hover {
  border-color: var(--primary-color, #3b82f6);
}

.task-editor-input:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
  border-color: var(--primary-color, #3b82f6);
}

.task-editor-input-error {
  border-color: var(--danger-color, #ef4444);
}

.task-editor-input-error:focus {
  outline-color: var(--danger-color, #ef4444);
}

/* 文本域 */
.task-editor-textarea {
  width: 100%;
  padding: 10px 12px;
  background-color: var(--input-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;
}

.task-editor-textarea:hover {
  border-color: var(--primary-color, #3b82f6);
}

.task-editor-textarea:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
  border-color: var(--primary-color, #3b82f6);
}

/* 字段底部 */
.task-editor-field-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

/* 错误提示 */
.task-editor-error {
  font-size: 13px;
  color: var(--danger-color, #ef4444);
}

/* 警告提示 */
.task-editor-warning {
  font-size: 13px;
  color: var(--warning-color, #f59e0b);
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 字符计数 */
.task-editor-counter {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  margin-left: auto;
  transition: color 0.2s;
}

.task-editor-counter-warning {
  color: var(--warning-color, #f59e0b);
  font-weight: 500;
}

.task-editor-counter-error {
  color: var(--danger-color, #ef4444);
  font-weight: 500;
}

/* 优先级选项 */
.priority-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-indicator {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.priority-high {
  background-color: var(--priority-high, #ef4444);
}

.priority-medium {
  background-color: var(--priority-medium, #f59e0b);
}

.priority-low {
  background-color: var(--priority-low, #3b82f6);
}

.priority-none {
  background-color: var(--priority-none, #9ca3af);
}

/* 操作按钮 */
.task-editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.task-editor-actions-right {
  display: flex;
  gap: 12px;
}

.task-editor-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.task-editor-button:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.task-editor-button-delete {
  background-color: transparent;
  color: var(--danger-color, #ef4444);
  border-color: var(--danger-color, #ef4444);
}

.task-editor-button-delete:hover {
  background-color: var(--danger-color, #ef4444);
  color: white;
}

.task-editor-button-cancel {
  background-color: var(--button-secondary-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
  border-color: var(--border-color, #e5e7eb);
}

.task-editor-button-cancel:hover {
  background-color: var(--button-secondary-hover, #e5e7eb);
}

.task-editor-button-submit {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.task-editor-button-submit:hover:not(:disabled) {
  background-color: var(--primary-hover, #2563eb);
}

.task-editor-button-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 重复任务详情 */
.task-editor-recurrence-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.task-editor-sublabel {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  white-space: nowrap;
}

.task-editor-number-input {
  width: 60px;
  padding: 6px 8px;
  background-color: var(--input-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  text-align: center;
}

.task-editor-number-input:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
  border-color: var(--primary-color, #3b82f6);
}

.task-editor-weekdays {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.task-editor-weekday-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border-color, #e5e7eb);
  background-color: var(--input-bg, #ffffff);
  color: var(--text-primary, #1f2937);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.task-editor-weekday-btn:hover {
  border-color: var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
}

.task-editor-weekday-btn-active {
  background-color: var(--primary-color, #3b82f6);
  border-color: var(--primary-color, #3b82f6);
  color: white;
}

.task-editor-weekday-btn-active:hover {
  background-color: var(--primary-hover, #2563eb);
  color: white;
}

/* 暗色主题 */
:global(.dark) .task-editor-input,
:global(.dark) .task-editor-textarea {
  --input-bg: #1f2937;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --button-secondary-bg: #374151;
  --button-secondary-hover: #4b5563;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .task-editor {
    gap: 16px;
  }

  .task-editor-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .task-editor-actions-right {
    flex-direction: column-reverse;
    width: 100%;
  }

  .task-editor-button {
    width: 100%;
  }

  .task-editor-button-delete {
    width: 100%;
    order: 1;
  }
}
</style>
