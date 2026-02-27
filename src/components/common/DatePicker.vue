<template>
  <div ref="datePickerRef" class="date-picker">
    <!-- 输入框 -->
    <div class="date-picker-input-wrapper">
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        class="date-picker-input"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keydown="handleInputKeydown"
      />
      <button
        type="button"
        class="date-picker-icon"
        :disabled="disabled"
        aria-label="打开日期选择器"
        @click="togglePicker"
      >
        📅
      </button>
    </div>

    <!-- 日期选择器面板 -->
    <Teleport to="body">
      <Transition name="picker-fade">
        <div
          v-if="isOpen"
          ref="panelRef"
          class="date-picker-panel"
          :style="panelStyle"
          @keydown="handlePanelKeydown"
        >
          <!-- 快捷选项 -->
          <div v-if="showShortcuts" class="date-picker-shortcuts">
            <button
              v-for="shortcut in shortcuts"
              :key="shortcut.label"
              type="button"
              class="date-picker-shortcut"
              :title="`设置为${shortcut.label}`"
              @click="handleShortcutClick(shortcut)"
            >
              {{ shortcut.label }}
            </button>
          </div>

          <!-- 日历视图 -->
          <div class="date-picker-calendar">
            <!-- 头部：月份导航 -->
            <div class="date-picker-header">
              <button
                type="button"
                class="date-picker-nav-button"
                aria-label="上一月"
                title="上一月"
                @click="previousMonth"
              >
                ‹
              </button>
              <div class="date-picker-current-month">
                {{ currentMonthYear }}
              </div>
              <button
                type="button"
                class="date-picker-nav-button"
                aria-label="下一月"
                title="下一月"
                @click="nextMonth"
              >
                ›
              </button>
            </div>

            <!-- 星期标题 -->
            <div class="date-picker-weekdays">
              <div
                v-for="day in weekdays"
                :key="day"
                class="date-picker-weekday"
              >
                {{ day }}
              </div>
            </div>

            <!-- 日期网格 -->
            <div class="date-picker-days" role="grid" aria-label="日历">
              <button
                v-for="day in calendarDays"
                :key="`${day.year}-${day.month}-${day.date}`"
                type="button"
                class="date-picker-day"
                :class="{
                  'date-picker-day-other-month': !day.isCurrentMonth,
                  'date-picker-day-today': day.isToday,
                  'date-picker-day-selected': day.isSelected,
                  'date-picker-day-disabled': day.isDisabled
                }"
                :disabled="day.isDisabled"
                :aria-label="`${day.year}年${day.month + 1}月${day.date}日${day.isToday ? '（今天）' : ''}${day.isSelected ? '（已选中）' : ''}`"
                :aria-selected="day.isSelected"
                :aria-current="day.isToday ? 'date' : undefined"
                @click="handleDayClick(day)"
              >
                {{ day.date }}
              </button>
            </div>
          </div>

          <!-- 时间选择 -->
          <div v-if="enableTime" class="date-picker-time">
            <div class="date-picker-time-inputs">
              <input
                v-model.number="selectedHour"
                type="number"
                min="0"
                max="23"
                class="date-picker-time-input"
                placeholder="时"
                aria-label="小时"
              />
              <span class="date-picker-time-separator">:</span>
              <input
                v-model.number="selectedMinute"
                type="number"
                min="0"
                max="59"
                class="date-picker-time-input"
                placeholder="分"
                aria-label="分钟"
              />
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="date-picker-footer">
            <button
              type="button"
              class="date-picker-button date-picker-button-clear"
              title="清除日期"
              @click="handleClear"
            >
              清除
            </button>
            <button
              type="button"
              class="date-picker-button date-picker-button-confirm"
              title="确认选择"
              @click="handleConfirm"
            >
              确定
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { formatDate, addDays, addMonths, startOfDay } from '../../utils/date'

/**
 * DatePicker 组件
 * 
 * 日期时间选择器组件，支持日期和时间选择、快捷选项、键盘导航
 * 
 * 验收标准：
 * - 需求 4.5: 允许用户为任务设置截止日期和时间
 * - 需求 19.2: 支持完整的键盘导航
 * - 需求 19.1: 为所有交互元素提供适当的 ARIA 标签
 */

interface DatePickerShortcut {
  label: string
  value: () => Date
}

interface CalendarDay {
  date: number
  month: number
  year: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
  fullDate: Date
}

interface Props {
  /** 当前选中的日期 */
  modelValue?: Date | null
  /** 占位符 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否启用时间选择 */
  enableTime?: boolean
  /** 是否显示快捷选项 */
  showShortcuts?: boolean
  /** ARIA 标签 */
  ariaLabel?: string
  /** 最小日期 */
  minDate?: Date
  /** 最大日期 */
  maxDate?: Date
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: '选择日期',
  disabled: false,
  enableTime: false,
  showShortcuts: true,
  ariaLabel: '日期选择器',
  minDate: undefined,
  maxDate: undefined,
})

interface Emits {
  (e: 'update:modelValue', value: Date | null): void
  (e: 'change', value: Date | null): void
}

const emit = defineEmits<Emits>()

// 引用
const datePickerRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const panelRef = ref<HTMLElement>()

// 状态
const isOpen = ref(false)
const inputValue = ref('')
const panelStyle = ref<Record<string, string>>({})

// 当前显示的月份
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

// 选中的时间
const selectedHour = ref(0)
const selectedMinute = ref(0)

// 临时选中的日期（未确认前）
const tempSelectedDate = ref<Date | null>(null)

/**
 * 星期标题
 */
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

/**
 * 快捷选项
 */
const shortcuts = computed<DatePickerShortcut[]>(() => [
  { label: '今天', value: () => new Date() },
  { label: '明天', value: () => addDays(new Date(), 1) },
  { label: '后天', value: () => addDays(new Date(), 2) },
  { label: '下周', value: () => addDays(new Date(), 7) },
  { label: '下月', value: () => addMonths(new Date(), 1) },
])

/**
 * 当前月份年份显示
 */
const currentMonthYear = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

/**
 * 日历日期数组
 */
const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = []
  const today = startOfDay(new Date())
  const selectedDate = tempSelectedDate.value || props.modelValue
  
  // 当前月第一天
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const firstDayOfWeek = firstDay.getDay()
  
  // 当前月最后一天
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const lastDate = lastDay.getDate()
  
  // 上个月需要显示的天数
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0)
  const prevMonthLastDate = prevMonthLastDay.getDate()
  
  // 添加上个月的日期
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthLastDate - i
    const fullDate = new Date(currentYear.value, currentMonth.value - 1, date)
    days.push({
      date,
      month: currentMonth.value - 1,
      year: currentYear.value,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isDisabled: isDateDisabled(fullDate),
      fullDate,
    })
  }
  
  // 添加当前月的日期
  for (let date = 1; date <= lastDate; date++) {
    const fullDate = new Date(currentYear.value, currentMonth.value, date)
    const isToday = startOfDay(fullDate).getTime() === today.getTime()
    const isSelected = selectedDate ? 
      startOfDay(fullDate).getTime() === startOfDay(selectedDate).getTime() : false
    
    days.push({
      date,
      month: currentMonth.value,
      year: currentYear.value,
      isCurrentMonth: true,
      isToday,
      isSelected,
      isDisabled: isDateDisabled(fullDate),
      fullDate,
    })
  }
  
  // 添加下个月的日期（补齐到 42 天，6 行）
  const remainingDays = 42 - days.length
  for (let date = 1; date <= remainingDays; date++) {
    const fullDate = new Date(currentYear.value, currentMonth.value + 1, date)
    days.push({
      date,
      month: currentMonth.value + 1,
      year: currentYear.value,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      isDisabled: isDateDisabled(fullDate),
      fullDate,
    })
  }
  
  return days
})

/**
 * 判断日期是否被禁用
 */
const isDateDisabled = (date: Date): boolean => {
  if (props.minDate && date < props.minDate) {
    return true
  }
  if (props.maxDate && date > props.maxDate) {
    return true
  }
  return false
}

/**
 * 更新输入框显示值
 */
const updateInputValue = () => {
  if (props.modelValue) {
    if (props.enableTime) {
      inputValue.value = formatDate(props.modelValue, 'full')
    } else {
      inputValue.value = formatDate(props.modelValue, 'date')
    }
  } else {
    inputValue.value = ''
  }
}

/**
 * 打开选择器
 */
const openPicker = async () => {
  if (props.disabled) return
  
  isOpen.value = true
  
  // 初始化显示月份
  if (props.modelValue) {
    currentMonth.value = props.modelValue.getMonth()
    currentYear.value = props.modelValue.getFullYear()
    selectedHour.value = props.modelValue.getHours()
    selectedMinute.value = props.modelValue.getMinutes()
    tempSelectedDate.value = new Date(props.modelValue)
  } else {
    const now = new Date()
    currentMonth.value = now.getMonth()
    currentYear.value = now.getFullYear()
    selectedHour.value = 0
    selectedMinute.value = 0
    tempSelectedDate.value = null
  }
  
  await nextTick()
  updatePanelPosition()
}

/**
 * 关闭选择器
 */
const closePicker = () => {
  isOpen.value = false
  tempSelectedDate.value = null
}

/**
 * 切换选择器
 */
const togglePicker = () => {
  if (isOpen.value) {
    closePicker()
  } else {
    openPicker()
  }
}

/**
 * 更新面板位置
 */
const updatePanelPosition = () => {
  if (!inputRef.value || !panelRef.value) return
  
  const inputRect = inputRef.value.getBoundingClientRect()
  const panelHeight = panelRef.value.offsetHeight
  const viewportHeight = window.innerHeight
  
  const spaceBelow = viewportHeight - inputRect.bottom
  const spaceAbove = inputRect.top
  
  let top: number
  if (spaceBelow >= panelHeight || spaceBelow >= spaceAbove) {
    top = inputRect.bottom + window.scrollY + 4
  } else {
    top = inputRect.top + window.scrollY - panelHeight - 4
  }
  
  panelStyle.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${inputRect.left + window.scrollX}px`,
    zIndex: '1000',
  }
}

/**
 * 上一月
 */
const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

/**
 * 下一月
 */
const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

/**
 * 处理日期点击
 */
const handleDayClick = (day: CalendarDay) => {
  if (day.isDisabled) return
  
  tempSelectedDate.value = new Date(day.fullDate)
  
  // 如果不需要时间选择，直接确认
  if (!props.enableTime) {
    handleConfirm()
  }
}

/**
 * 处理快捷选项点击
 */
const handleShortcutClick = (shortcut: DatePickerShortcut) => {
  const date = shortcut.value()
  tempSelectedDate.value = date
  
  if (props.enableTime) {
    selectedHour.value = date.getHours()
    selectedMinute.value = date.getMinutes()
  }
  
  // 更新显示月份
  currentMonth.value = date.getMonth()
  currentYear.value = date.getFullYear()
  
  // 如果不需要时间选择，直接确认
  if (!props.enableTime) {
    handleConfirm()
  }
}

/**
 * 处理确认
 */
const handleConfirm = () => {
  let finalDate: Date | null = null
  
  if (tempSelectedDate.value) {
    finalDate = new Date(tempSelectedDate.value)
    
    if (props.enableTime) {
      finalDate.setHours(selectedHour.value)
      finalDate.setMinutes(selectedMinute.value)
      finalDate.setSeconds(0)
      finalDate.setMilliseconds(0)
    } else {
      finalDate.setHours(0, 0, 0, 0)
    }
  }
  
  emit('update:modelValue', finalDate)
  emit('change', finalDate)
  closePicker()
}

/**
 * 处理清除
 */
const handleClear = () => {
  emit('update:modelValue', null)
  emit('change', null)
  closePicker()
}

/**
 * 处理输入框聚焦
 */
const handleInputFocus = () => {
  openPicker()
}

/**
 * 处理输入框失焦
 */
const handleInputBlur = () => {
  // 延迟关闭，以便点击面板时不会立即关闭
  setTimeout(() => {
    if (!panelRef.value?.contains(document.activeElement)) {
      // closePicker() // 暂时不自动关闭，让用户手动确认
    }
  }, 200)
}

/**
 * 处理输入框键盘事件
 */
const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (!isOpen.value) {
      openPicker()
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closePicker()
  }
}

/**
 * 处理面板键盘事件
 */
const handlePanelKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePicker()
  }
}

/**
 * 处理外部点击
 */
const handleClickOutside = (event: MouseEvent) => {
  if (!isOpen.value) return
  
  const target = event.target as Node
  if (
    datePickerRef.value &&
    !datePickerRef.value.contains(target) &&
    panelRef.value &&
    !panelRef.value.contains(target)
  ) {
    closePicker()
  }
}

// 监听 modelValue 变化，更新输入框
watch(() => props.modelValue, updateInputValue, { immediate: true })

// 监听窗口大小变化
const handleResize = () => {
  if (isOpen.value) {
    updatePanelPosition()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize)
})
</script>

<style scoped>
/* 日期选择器容器 */
.date-picker {
  position: relative;
  display: inline-block;
  width: 100%;
}

/* 输入框包装器 */
.date-picker-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

/* 输入框 */
.date-picker-input {
  width: 100%;
  padding: 8px 40px 8px 12px;
  background-color: var(--input-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  transition: all 0.2s;
}

.date-picker-input:hover:not(:disabled) {
  border-color: var(--primary-color, #3b82f6);
}

.date-picker-input:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
  border-color: var(--primary-color, #3b82f6);
}

.date-picker-input:disabled {
  background-color: var(--input-disabled-bg, #f3f4f6);
  cursor: not-allowed;
  opacity: 0.6;
}

/* 日历图标按钮 */
.date-picker-icon {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.date-picker-icon:hover:not(:disabled) {
  background-color: var(--hover-bg, #f3f4f6);
}

.date-picker-icon:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 选择器面板 */
.date-picker-panel {
  background-color: var(--panel-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  min-width: 280px;
}

/* 快捷选项 */
.date-picker-shortcuts {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.date-picker-shortcut {
  padding: 4px 12px;
  background-color: var(--shortcut-bg, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.2s;
}

.date-picker-shortcut:hover {
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

/* 日历 */
.date-picker-calendar {
  margin-bottom: 12px;
}

/* 头部 */
.date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.date-picker-nav-button {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.date-picker-nav-button:hover {
  background-color: var(--hover-bg, #f3f4f6);
}

.date-picker-current-month {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

/* 星期标题 */
.date-picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}

.date-picker-weekday {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  padding: 4px;
}

/* 日期网格 */
.date-picker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.date-picker-day {
  aspect-ratio: 1;
  background: none;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-picker-day:hover:not(:disabled):not(.date-picker-day-other-month) {
  background-color: var(--hover-bg, #f3f4f6);
}

.date-picker-day-other-month {
  color: var(--text-tertiary, #d1d5db);
}

.date-picker-day-today {
  font-weight: 600;
  color: var(--primary-color, #3b82f6);
}

.date-picker-day-selected {
  background-color: var(--primary-color, #3b82f6);
  color: white;
  font-weight: 600;
}

.date-picker-day-selected:hover {
  background-color: var(--primary-hover, #2563eb);
}

.date-picker-day-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 时间选择 */
.date-picker-time {
  padding: 12px 0;
  border-top: 1px solid var(--border-color, #e5e7eb);
  margin-bottom: 12px;
}

.date-picker-time-inputs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.date-picker-time-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
  color: var(--text-primary, #1f2937);
  background-color: var(--input-bg, #ffffff);
}

.date-picker-time-input:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: -1px;
}

.date-picker-time-separator {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

/* 底部按钮 */
.date-picker-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.date-picker-button {
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.date-picker-button-clear {
  background-color: var(--button-secondary-bg, #f3f4f6);
  color: var(--text-primary, #1f2937);
  border-color: var(--border-color, #e5e7eb);
}

.date-picker-button-clear:hover {
  background-color: var(--button-secondary-hover, #e5e7eb);
}

.date-picker-button-confirm {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.date-picker-button-confirm:hover {
  background-color: var(--primary-hover, #2563eb);
}

/* 过渡动画 */
.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 暗色主题 */
:global(.dark) .date-picker-input,
:global(.dark) .date-picker-panel,
:global(.dark) .date-picker-time-input {
  --input-bg: #1f2937;
  --panel-bg: #1f2937;
  --border-color: #374151;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-tertiary: #4b5563;
  --hover-bg: #374151;
  --shortcut-bg: #374151;
  --button-secondary-bg: #374151;
  --button-secondary-hover: #4b5563;
  --input-disabled-bg: #374151;
}
</style>
