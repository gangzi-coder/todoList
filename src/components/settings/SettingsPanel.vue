<template>
  <div class="settings-panel" role="dialog" aria-label="设置面板">
    <div class="settings-header">
      <h2 class="settings-title">⚙️ 设置</h2>
      <button
        class="settings-close"
        aria-label="关闭设置"
        title="关闭设置 (Esc)"
        @click="emit('close')"
      >
        ✕
      </button>
    </div>

    <div class="settings-content">
      <!-- 默认视图 -->
      <div class="settings-section">
        <h3 class="settings-section-title">常规</h3>

        <div class="settings-item">
          <label class="settings-label" for="default-view">默认视图</label>
          <select
            id="default-view"
            class="settings-select"
            :value="settings.defaultView"
            @change="handleViewChange"
          >
            <option value="today">今天</option>
            <option value="upcoming">即将到来</option>
            <option value="inbox">收件箱</option>
            <option value="all">所有任务</option>
          </select>
        </div>

        <div class="settings-item">
          <label class="settings-label" for="default-sort">默认排序</label>
          <select
            id="default-sort"
            class="settings-select"
            :value="settings.defaultSort"
            @change="handleSortChange"
          >
            <option value="createdAt">创建时间</option>
            <option value="dueDate">截止日期</option>
            <option value="priority">优先级</option>
            <option value="title">标题</option>
          </select>
        </div>

        <div class="settings-item">
          <label class="settings-label" for="week-start">每周第一天</label>
          <select
            id="week-start"
            class="settings-select"
            :value="settings.weekStartsOn"
            @change="handleWeekStartChange"
          >
            <option :value="0">周日</option>
            <option :value="1">周一</option>
          </select>
        </div>
      </div>

      <!-- 外观 -->
      <div class="settings-section">
        <h3 class="settings-section-title">外观</h3>

        <div class="settings-item">
          <label class="settings-label" for="theme-mode">主题模式</label>
          <select
            id="theme-mode"
            class="settings-select"
            :value="settings.themeMode"
            @change="handleThemeChange"
          >
            <option value="auto">自动（跟随系统）</option>
            <option value="light">亮色</option>
            <option value="dark">暗色</option>
          </select>
        </div>

        <div class="settings-item">
          <span class="settings-label">启用动画</span>
          <label class="settings-toggle" :for="'toggle-animations'">
            <input
              :id="'toggle-animations'"
              type="checkbox"
              :checked="settings.enableAnimations"
              @change="handleAnimationsToggle"
            />
            <span class="toggle-slider" />
            <span class="sr-only">启用动画</span>
          </label>
        </div>
      </div>

      <!-- 行为 -->
      <div class="settings-section">
        <h3 class="settings-section-title">行为</h3>

        <div class="settings-item">
          <span class="settings-label">启用提醒</span>
          <label class="settings-toggle" :for="'toggle-reminders'">
            <input
              :id="'toggle-reminders'"
              type="checkbox"
              :checked="settings.enableReminders"
              @change="handleRemindersToggle"
            />
            <span class="toggle-slider" />
            <span class="sr-only">启用提醒</span>
          </label>
        </div>

        <div class="settings-item">
          <span class="settings-label">完成音效</span>
          <label class="settings-toggle" :for="'toggle-sound'">
            <input
              :id="'toggle-sound'"
              type="checkbox"
              :checked="settings.playCompletionSound"
              @change="handleSoundToggle"
            />
            <span class="toggle-slider" />
            <span class="sr-only">完成音效</span>
          </label>
        </div>

        <div class="settings-item">
          <span class="settings-label">自动删除已完成任务</span>
          <label class="settings-toggle" :for="'toggle-auto-delete'">
            <input
              :id="'toggle-auto-delete'"
              type="checkbox"
              :checked="settings.autoDeleteCompleted"
              @change="handleAutoDeleteToggle"
            />
            <span class="toggle-slider" />
            <span class="sr-only">自动删除已完成任务</span>
          </label>
        </div>

        <div v-if="settings.autoDeleteCompleted" class="settings-item settings-item-indent">
          <label class="settings-label" for="auto-delete-delay">删除延迟（天）</label>
          <input
            id="auto-delete-delay"
            type="number"
            class="settings-number"
            :value="settings.autoDeleteDelay"
            min="1"
            max="30"
            @change="handleAutoDeleteDelayChange"
          />
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="settings-section">
        <h3 class="settings-section-title">数据管理</h3>

        <div class="settings-item">
          <span class="settings-label">导出数据</span>
          <button class="settings-btn" @click="handleExportData" :disabled="exporting" aria-label="导出数据为 JSON 文件">
            {{ exporting ? '导出中...' : '📤 导出' }}
          </button>
        </div>

        <div class="settings-item">
          <span class="settings-label">导入数据</span>
          <button class="settings-btn" @click="triggerImportFile" :disabled="importing" aria-label="从 JSON 文件导入数据">
            {{ importing ? '导入中...' : '📥 导入' }}
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            class="file-input-hidden"
            aria-hidden="true"
            @change="handleImportFile"
          />
        </div>
      </div>

      <!-- 快捷键列表 -->
      <div class="settings-section">
        <h3 class="settings-section-title">快捷键</h3>
        <div class="shortcuts-list" role="list" aria-label="快捷键列表">
          <div
            v-for="shortcut in shortcuts"
            :key="shortcut.key"
            class="shortcut-item"
            role="listitem"
          >
            <span class="shortcut-desc">{{ shortcut.description }}</span>
            <kbd class="shortcut-key">{{ shortcut.key }}</kbd>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SettingsPanel 组件
 *
 * 显示所有设置选项，集成 settingsStore，实时保存设置更改，显示快捷键列表
 *
 * 验收标准：
 * - 需求 15.1: 提供设置面板
 * - 需求 15.2: 允许选择默认视图
 * - 需求 15.3: 允许选择默认任务排序方式
 * - 需求 15.4: 允许设置是否自动删除已完成任务
 * - 需求 15.5: 允许设置删除延迟天数（1-30 天）
 * - 需求 15.6: 允许设置任务完成时是否播放音效
 * - 需求 15.7: 允许选择主题模式（自动、亮色、暗色）
 * - 需求 15.8: 允许设置每周的第一天（周日或周一）
 * - 需求 15.9: 将所有设置保存到本地存储
 * - 需求 14.8: 在设置中显示所有可用快捷键的列表
 */

import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settingsStore'
import { useTheme } from '@/composables/useTheme'
import { parseAndValidateImportData } from '@/utils/dataValidation'
import { dataStore } from '@/services/DataStore'
import type { ViewType, SortOption, ImportStrategy } from '@/types'

interface Emits {
  (e: 'close'): void
  (e: 'toast', message: string, type: 'success' | 'error' | 'warning' | 'info'): void
}

const emit = defineEmits<Emits>()

// 导入导出状态
const fileInputRef = ref<HTMLInputElement | null>(null)
const exporting = ref(false)
const importing = ref(false)

const settingsStore = useSettingsStore()
const { settings } = storeToRefs(settingsStore)
const { setThemeMode } = useTheme()

/**
 * 检查是否为 Mac 系统
 */
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
const modKey = isMac ? '⌘' : 'Ctrl'

/**
 * 快捷键列表
 */
const shortcuts = computed(() => [
  { key: `${modKey}+F`, description: '打开搜索' },
  { key: `${modKey}+N`, description: '创建新任务' },
  { key: `${modKey}+D`, description: '切换暗色模式' },
  { key: `${modKey}+,`, description: '打开设置' },
  { key: 'Esc', description: '关闭弹窗/搜索' },
  { key: '1', description: '切换到"今天"视图' },
  { key: '2', description: '切换到"即将到来"视图' },
  { key: '3', description: '切换到"收件箱"视图' },
  { key: '4', description: '切换到"所有任务"视图' },
  { key: 'Space', description: '切换任务完成状态' },
  { key: 'Enter', description: '快速添加任务' },
  { key: '↑/↓', description: '在任务列表中导航' },
])

// 导入导出处理
/**
 * 导出数据为 JSON 文件
 * 需求 12.1: 支持将所有数据导出为 JSON 格式文件
 * 需求 12.3: 在导出文件名中包含导出日期时间
 */
async function handleExportData() {
  exporting.value = true
  try {
    await dataStore.initialize()
    const exportedData = await dataStore.exportData()
    const jsonString = JSON.stringify(exportedData, null, 2)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `todo-backup-${timestamp}.json`

    // 创建下载链接
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)

    emit('toast', '数据导出成功', 'success')
  } catch {
    emit('toast', '数据导出失败，请重试', 'error')
  } finally {
    exporting.value = false
  }
}

/**
 * 触发文件选择
 */
function triggerImportFile() {
  fileInputRef.value?.click()
}

/**
 * 处理导入文件
 * 需求 12.5: 验证文件格式的有效性
 * 需求 12.6: 格式无效时显示错误提示并终止导入
 * 需求 18.8: 验证导入的 JSON 数据格式符合应用数据结构
 */
async function handleImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 重置 input 以便再次选择同一文件
  input.value = ''

  // 验证文件类型
  if (!file.name.endsWith('.json')) {
    emit('toast', '请选择 JSON 格式的文件', 'error')
    return
  }

  importing.value = true
  try {
    const text = await file.text()

    // 解析并验证数据
    const result = parseAndValidateImportData(text)
    if (!result.success) {
      emit('toast', result.error, 'error')
      return
    }

    // 使用合并策略导入
    await dataStore.initialize()
    await dataStore.importData(result.data, 'merge')

    const taskCount = result.data.tasks.length
    const projectCount = result.data.projects.length
    emit('toast', `导入成功：${taskCount} 个任务，${projectCount} 个项目`, 'success')
  } catch {
    emit('toast', '导入过程中发生错误，请重试', 'error')
  } finally {
    importing.value = false
  }
}

// 事件处理
function handleViewChange(e: Event) {
  settingsStore.setDefaultView((e.target as HTMLSelectElement).value as ViewType)
}

function handleSortChange(e: Event) {
  settingsStore.setDefaultSort((e.target as HTMLSelectElement).value as SortOption)
}

function handleWeekStartChange(e: Event) {
  settingsStore.setWeekStartsOn(Number((e.target as HTMLSelectElement).value) as 0 | 1)
}

function handleThemeChange(e: Event) {
  const mode = (e.target as HTMLSelectElement).value as 'auto' | 'light' | 'dark'
  setThemeMode(mode)
}

function handleAnimationsToggle(e: Event) {
  settingsStore.setEnableAnimations((e.target as HTMLInputElement).checked)
}

function handleRemindersToggle(e: Event) {
  settingsStore.setEnableReminders((e.target as HTMLInputElement).checked)
}

function handleSoundToggle(e: Event) {
  settingsStore.setPlayCompletionSound((e.target as HTMLInputElement).checked)
}

function handleAutoDeleteToggle(e: Event) {
  settingsStore.setAutoDeleteCompleted((e.target as HTMLInputElement).checked)
}

function handleAutoDeleteDelayChange(e: Event) {
  const value = Number((e.target as HTMLInputElement).value)
  if (value >= 1 && value <= 30) {
    settingsStore.setAutoDeleteDelay(value)
  }
}
</script>

<style scoped>
/* 设置面板容器 */
.settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #1f2937);
}

/* 头部 */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.settings-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.settings-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary, #6b7280);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.settings-close:hover {
  background-color: var(--hover-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
}

.settings-close:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 内容区域 */
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px 20px;
}

/* 分组 */
.settings-section {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
}

/* 设置项 */
.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  min-height: 36px;
}

.settings-item-indent {
  padding-left: 16px;
}

.settings-label {
  font-size: 14px;
  color: var(--text-primary, #1f2937);
}

/* 下拉选择 */
.settings-select {
  padding: 4px 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #1f2937);
  font-size: 13px;
  cursor: pointer;
  min-width: 120px;
}

.settings-select:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 数字输入 */
.settings-number {
  width: 64px;
  padding: 4px 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #1f2937);
  font-size: 13px;
  text-align: center;
}

.settings-number:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 开关 */
.settings-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.settings-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  width: 40px;
  height: 22px;
  background-color: var(--toggle-off, #d1d5db);
  border-radius: 11px;
  position: relative;
  transition: background-color 0.2s ease;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.settings-toggle input:checked + .toggle-slider {
  background-color: var(--primary-color, #3b82f6);
}

.settings-toggle input:checked + .toggle-slider::after {
  transform: translateX(18px);
}

.settings-toggle input:focus + .toggle-slider {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* 屏幕阅读器专用 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* 数据管理按钮 */
.settings-btn {
  padding: 6px 14px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  background: var(--bg-primary, #ffffff);
  color: var(--text-primary, #1f2937);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.settings-btn:hover:not(:disabled) {
  border-color: var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
}

.settings-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.settings-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.file-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

/* 快捷键列表 */
.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

.shortcut-desc {
  font-size: 13px;
  color: var(--text-primary, #1f2937);
}

.shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 22px;
  padding: 0 6px;
  background-color: var(--kbd-bg, #f3f4f6);
  border: 1px solid var(--kbd-border, #e5e7eb);
  border-radius: 4px;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-secondary, #6b7280);
}

/* 暗色主题 */
:global(.dark) .settings-panel {
  background: var(--bg-primary, #1f2937);
  color: var(--text-primary, #f9fafb);
}

:global(.dark) .settings-header {
  border-bottom-color: #374151;
}

:global(.dark) .settings-close:hover {
  background-color: #374151;
  color: #f9fafb;
}

:global(.dark) .settings-section {
  border-bottom-color: #374151;
}

:global(.dark) .settings-select,
:global(.dark) .settings-number,
:global(.dark) .settings-btn {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

:global(.dark) .toggle-slider {
  background-color: #4b5563;
}

:global(.dark) .shortcut-key {
  background-color: #374151;
  border-color: #4b5563;
  color: #9ca3af;
}

:global(.dark) .shortcut-desc {
  color: #f9fafb;
}

/* 响应式 */
@media (max-width: 640px) {
  .settings-content {
    padding: 8px 12px 16px;
  }

  .settings-header {
    padding: 12px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .toggle-slider,
  .toggle-slider::after,
  .settings-close {
    transition: none;
  }
}
</style>
