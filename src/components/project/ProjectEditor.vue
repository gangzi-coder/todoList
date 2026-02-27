<template>
  <div class="project-editor" role="form" aria-label="项目编辑表单">
    <!-- 表单标题 -->
    <h3 class="project-editor-title">
      {{ isEditing ? '编辑项目' : '新建项目' }}
    </h3>

    <!-- 项目名称 -->
    <div class="project-editor-field">
      <label for="project-name" class="project-editor-label">项目名称</label>
      <input
        id="project-name"
        ref="nameInputRef"
        v-model="formData.name"
        type="text"
        class="project-editor-input"
        :class="{ 'project-editor-input-error': nameError }"
        placeholder="输入项目名称..."
        maxlength="50"
        aria-required="true"
        :aria-invalid="!!nameError"
        :aria-describedby="nameError ? 'name-error' : undefined"
        @input="validateName"
      />
      <div class="project-editor-field-footer">
        <span
          v-if="nameError"
          id="name-error"
          class="project-editor-error"
          role="alert"
        >
          {{ nameError }}
        </span>
        <span class="project-editor-char-count" :class="{ 'project-editor-char-warning': nameRemaining <= 10 }">
          {{ formData.name.length }}/50
        </span>
      </div>
    </div>

    <!-- 颜色选择器 -->
    <div class="project-editor-field">
      <label class="project-editor-label">项目颜色</label>
      <div class="project-editor-colors" role="radiogroup" aria-label="选择项目颜色">
        <button
          v-for="color in predefinedColors"
          :key="color.value"
          type="button"
          class="project-editor-color-btn"
          :class="{ 'project-editor-color-btn-active': formData.color === color.value }"
          :style="{ backgroundColor: color.value }"
          :aria-label="`颜色: ${color.label}`"
          :aria-checked="formData.color === color.value"
          role="radio"
          @click="formData.color = color.value"
        >
          <span v-if="formData.color === color.value" class="project-editor-color-check">✓</span>
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="project-editor-actions">
      <button
        type="button"
        class="project-editor-btn project-editor-btn-cancel"
        @click="handleCancel"
      >
        取消
      </button>
      <button
        v-if="isEditing && !isDefault"
        type="button"
        class="project-editor-btn project-editor-btn-delete"
        @click="handleDeleteClick"
      >
        删除项目
      </button>
      <button
        type="button"
        class="project-editor-btn project-editor-btn-save"
        :disabled="!canSave"
        @click="handleSave"
      >
        {{ isEditing ? '保存' : '创建' }}
      </button>
    </div>

    <!-- 删除确认对话框 -->
    <Modal
      v-model="showDeleteConfirm"
      title="确认删除项目"
      confirm-text="确认删除"
      cancel-text="取消"
      :confirm-danger="true"
      size="small"
      @confirm="handleConfirmDelete"
      @cancel="showDeleteConfirm = false"
    >
      <p class="project-editor-delete-msg">
        确定要删除项目「<strong>{{ formData.name }}</strong>」吗？
      </p>
      <p class="project-editor-delete-info">
        该项目包含 <strong>{{ taskCount }}</strong> 个任务，删除后这些任务将被移动到「收件箱」。
      </p>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import Modal from '@/components/common/Modal.vue'
import { validateProjectName } from '@/utils/validation'
import type { Project } from '@/types'

/**
 * ProjectEditor 组件
 *
 * 项目编辑表单，支持创建和编辑项目
 *
 * 验收标准：
 * - 需求 2.1: 支持创建、编辑、删除项目
 * - 需求 2.2: 要求输入项目名称
 * - 需求 2.3: 允许为项目设置颜色标识
 * - 需求 2.5: 删除项目时显示确认对话框并说明项目内任务数量
 * - 需求 18.4: 限制项目名称最多 50 个字符
 */

interface Props {
  /** 要编辑的项目（null 表示新建） */
  project?: Project | null
  /** 项目内的任务数量（用于删除确认） */
  taskCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  project: null,
  taskCount: 0,
})

interface Emits {
  (e: 'save', data: { name: string; color: string }): void
  (e: 'cancel'): void
  (e: 'delete', projectId: string): void
}

const emit = defineEmits<Emits>()

/** 预定义颜色列表 */
const predefinedColors = [
  { value: '#3b82f6', label: '蓝色' },
  { value: '#ef4444', label: '红色' },
  { value: '#22c55e', label: '绿色' },
  { value: '#f59e0b', label: '橙色' },
  { value: '#8b5cf6', label: '紫色' },
  { value: '#ec4899', label: '粉色' },
  { value: '#14b8a6', label: '青色' },
  { value: '#6b7280', label: '灰色' },
]

const nameInputRef = ref<HTMLInputElement | null>(null)
const showDeleteConfirm = ref(false)
const nameError = ref('')

const formData = ref({
  name: '',
  color: predefinedColors[0].value,
})

/** 是否为编辑模式 */
const isEditing = computed(() => !!props.project)

/** 是否为默认项目 */
const isDefault = computed(() => props.project?.isDefault ?? false)

/** 名称剩余字符数 */
const nameRemaining = computed(() => 50 - formData.value.name.length)

/** 是否可以保存 */
const canSave = computed(() => {
  return formData.value.name.trim().length > 0 && !nameError.value
})

/**
 * 验证项目名称
 */
const validateName = () => {
  const result = validateProjectName(formData.value.name)
  nameError.value = result.valid ? '' : (result.error ?? '')
}

/**
 * 保存项目
 */
const handleSave = () => {
  validateName()
  if (!canSave.value) return

  emit('save', {
    name: formData.value.name.trim(),
    color: formData.value.color,
  })
}

/**
 * 取消编辑
 */
const handleCancel = () => {
  emit('cancel')
}

/**
 * 点击删除按钮
 */
const handleDeleteClick = () => {
  showDeleteConfirm.value = true
}

/**
 * 确认删除
 */
const handleConfirmDelete = () => {
  showDeleteConfirm.value = false
  if (props.project) {
    emit('delete', props.project.id)
  }
}

// 初始化表单数据
watch(
  () => props.project,
  (project) => {
    if (project) {
      formData.value.name = project.name
      formData.value.color = project.color
    } else {
      formData.value.name = ''
      formData.value.color = predefinedColors[0].value
    }
    nameError.value = ''
  },
  { immediate: true }
)

onMounted(() => {
  nextTick(() => {
    nameInputRef.value?.focus()
  })
})
</script>

<style scoped>
.project-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 4px 0;
}

.project-editor-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

/* 表单字段 */
.project-editor-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.project-editor-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #6b7280);
}

.project-editor-input {
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  background-color: var(--input-bg, #ffffff);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.project-editor-input:focus {
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.project-editor-input-error {
  border-color: var(--danger-color, #ef4444);
}

.project-editor-input-error:focus {
  border-color: var(--danger-color, #ef4444);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.project-editor-input::placeholder {
  color: var(--text-placeholder, #9ca3af);
}

.project-editor-field-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 18px;
}

.project-editor-error {
  font-size: 12px;
  color: var(--danger-color, #ef4444);
}

.project-editor-char-count {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  margin-left: auto;
}

.project-editor-char-warning {
  color: var(--danger-color, #ef4444);
}

/* 颜色选择器 */
.project-editor-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-editor-color-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, border-color 0.15s;
  padding: 0;
}

.project-editor-color-btn:hover {
  transform: scale(1.15);
}

.project-editor-color-btn:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.project-editor-color-btn-active {
  border-color: var(--text-primary, #1f2937);
  transform: scale(1.1);
}

.project-editor-color-check {
  color: white;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 操作按钮 */
.project-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.project-editor-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.project-editor-btn:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.project-editor-btn-cancel {
  background-color: var(--button-secondary-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
  border-color: var(--border-color, #e5e7eb);
}

.project-editor-btn-cancel:hover {
  background-color: var(--button-secondary-hover, #e5e7eb);
}

.project-editor-btn-save {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.project-editor-btn-save:hover:not(:disabled) {
  background-color: var(--primary-hover, #2563eb);
}

.project-editor-btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.project-editor-btn-delete {
  background-color: transparent;
  color: var(--danger-color, #ef4444);
  border-color: var(--danger-color, #ef4444);
  margin-right: auto;
}

.project-editor-btn-delete:hover {
  background-color: var(--danger-color, #ef4444);
  color: white;
}

/* 删除确认对话框内容 */
.project-editor-delete-msg {
  margin: 0 0 8px;
  color: var(--text-primary, #1f2937);
  font-size: 14px;
  line-height: 1.6;
}

.project-editor-delete-info {
  margin: 0;
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  line-height: 1.6;
}

/* 暗色主题 */
:global(.dark) .project-editor {
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-placeholder: #6b7280;
  --border-color: #374151;
  --input-bg: #1f2937;
  --button-secondary-bg: #374151;
  --button-secondary-hover: #4b5563;
}

/* 响应式 */
@media (max-width: 640px) {
  .project-editor {
    gap: 16px;
  }

  .project-editor-actions {
    flex-wrap: wrap;
  }

  .project-editor-btn-delete {
    margin-right: 0;
    width: 100%;
    order: 3;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .project-editor-input,
  .project-editor-color-btn,
  .project-editor-btn {
    transition: none;
  }

  .project-editor-color-btn:hover,
  .project-editor-color-btn-active {
    transform: none;
  }
}
</style>
