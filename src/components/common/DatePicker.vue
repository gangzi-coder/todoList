<template>
  <div class="date-picker">
    <!-- 输入框 -->
    <div class="date-picker-input-wrapper">
      <input
        ref="inputRef"
        :value="inputValue"
        type="text"
        class="date-picker-input"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="ariaLabel"
        readonly
        @click="togglePicker"
        @keydown="handleInputKeydown"
      />
      <button
        type="button"
        class="date-picker-icon"
        :disabled="disabled"
        aria-label="打开日期选择器"
        @mousedown.prevent
        @click="togglePicker"
      >
        📅
      </button>
    </div>

    <!-- 日期选择器面板 -->
    <Teleport to="body">
      <div v-if="isOpen" class="date-picker-overlay" @mousedown="closePicker" />
      <Transition name="picker-fade">
        <div
          v-if="isOpen"
          class="date-picker-panel"
          :style="panelStyle"
          @mousedown.stop
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
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { formatDate, addDays, addMonths, startOfDay } from '../../utils/date'

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
  modelValue?: Date | null
  placeholder?: string
  disabled?: boolean
  enableTime?: boolean
  showShortcuts?: boolean
  ariaLabel?: string
  minDate?: Date
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

const inputRef = ref<HTMLInputElement>()

const isOpen = ref(false)
const panelStyle = ref<Record<string, string>>({})

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedHour = ref(0)
const selectedMinute = ref(0)
const tempSelectedDate = ref<Date | null>(null)

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const shortcuts = computed<DatePickerShortcut[]>(() => [
  { label: '今天', value: () => new Date() },
  { label: '明天', value: () => addDays(new Date(), 1) },
  { label: '后天', value: () => addDays(new Date(), 2) },
  { label: '下周', value: () => addDays(new Date(), 7) },
  { label: '下月', value: () => addMonths(new Date(), 1) },
])

const inputValue = computed(() => {
  if (props.modelValue) {
    return props.enableTime
      ? formatDate(props.modelValue, 'full')
      : formatDate(props.modelValue, 'date')
  }
  return ''
})

const currentMonthYear = computed(() => {
  return `${currentYear.value}年${currentMonth.value + 1}月`
})

const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = []
  const today = startOfDay(new Date())
  const selectedDate = tempSelectedDate.value || props.modelValue

  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const firstDayOfWeek = firstDay.getDay()
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const lastDate = lastDay.getDate()
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0)
  const prevMonthLastDate = prevMonthLastDay.getDate()

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = prevMonthLastDate - i
    const fullDate = new Date(currentYear.value, currentMonth.value - 1, date)
    days.push({
      date, month: currentMonth.value - 1, year: currentYear.value,
      isCurrentMonth: false, isToday: false, isSelected: false,
      isDisabled: isDateDisabled(fullDate), fullDate,
    })
  }

  for (let date = 1; date <= lastDate; date++) {
    const fullDate = new Date(currentYear.value, currentMonth.value, date)
    const isToday = startOfDay(fullDate).getTime() === today.getTime()
    const isSelected = selectedDate
      ? startOfDay(fullDate).getTime() === startOfDay(selectedDate).getTime()
      : false
    days.push({
      date, month: currentMonth.value, year: currentYear.value,
      isCurrentMonth: true, isToday, isSelected,
      isDisabled: isDateDisabled(fullDate), fullDate,
    })
  }

  const remainingDays = 42 - days.length
  for (let date = 1; date <= remainingDays; date++) {
    const fullDate = new Date(currentYear.value, currentMonth.value + 1, date)
    days.push({
      date, month: currentMonth.value + 1, year: currentYear.value,
      isCurrentMonth: false, isToday: false, isSelected: false,
      isDisabled: isDateDisabled(fullDate), fullDate,
    })
  }

  return days
})

const isDateDisabled = (date: Date): boolean => {
  if (props.minDate && date < props.minDate) return true
  if (props.maxDate && date > props.maxDate) return true
  return false
}

const openPicker = async () => {
  if (props.disabled) return
  isOpen.value = true

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

const closePicker = () => {
  isOpen.value = false
  tempSelectedDate.value = null
}

const togglePicker = () => {
  if (isOpen.value) {
    closePicker()
  } else {
    openPicker()
  }
}

const updatePanelPosition = () => {
  if (!inputRef.value) return

  const inputRect = inputRef.value.getBoundingClientRect()
  const panelHeight = 420
  const panelWidth = 300
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  let top: number
  const spaceBelow = viewportHeight - inputRect.bottom
  if (spaceBelow >= panelHeight || spaceBelow >= inputRect.top) {
    top = inputRect.bottom + 4
  } else {
    top = inputRect.top - panelHeight - 4
  }

  let left = inputRect.left
  if (left + panelWidth > viewportWidth) {
    left = viewportWidth - panelWidth - 8
  }
  if (left < 8) left = 8

  panelStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${left}px`,
    zIndex: '10000',
  }
}

const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const handleDayClick = (day: CalendarDay) => {
  if (day.isDisabled) return
  tempSelectedDate.value = new Date(day.fullDate)
  if (!props.enableTime) {
    handleConfirm()
  }
}

const handleShortcutClick = (shortcut: DatePickerShortcut) => {
  const date = shortcut.value()
  tempSelectedDate.value = date
  if (props.enableTime) {
    selectedHour.value = date.getHours()
    selectedMinute.value = date.getMinutes()
  }
  currentMonth.value = date.getMonth()
  currentYear.value = date.getFullYear()
  if (!props.enableTime) {
    handleConfirm()
  }
}

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

const handleClear = () => {
  emit('update:modelValue', null)
  emit('change', null)
  closePicker()
}

const handleInputKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (!isOpen.value) openPicker()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closePicker()
  }
}

const handleResize = () => {
  if (isOpen.value) updatePanelPosition()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  window.addEventListener('scroll', handleResize, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('scroll', handleResize, true)
})
</script>

<style scoped>
.date-picker {
  position: relative;
  display: inline-block;
  width: 100%;
}

.date-picker-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.date-picker-input {
  width: 100%;
  padding: 8px 40px 8px 12px;
  background-color: var(--input-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
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

/* 遮罩层：点击关闭面板 */
.date-picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.date-picker-panel {
  background-color: var(--panel-bg, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
  padding: 16px;
  width: 300px;
}

.date-picker-shortcuts {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.date-picker-shortcut {
  padding: 5px 12px;
  background-color: var(--shortcut-bg, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.15s;
}

.date-picker-shortcut:hover {
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

.date-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.date-picker-nav-button {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
  line-height: 1;
  transition: background-color 0.15s;
}

.date-picker-nav-button:hover {
  background-color: var(--hover-bg, #f3f4f6);
}

.date-picker-current-month {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.date-picker-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.date-picker-weekday {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  padding: 4px 0;
}

.date-picker-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.date-picker-day {
  width: 36px;
  height: 36px;
  margin: 0 auto;
  background: none;
  border: none;
  border-radius: 50%;
  font-size: 13px;
  color: var(--text-primary, #1f2937);
  cursor: pointer;
  transition: all 0.15s;
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
  font-weight: 700;
  color: var(--primary-color, #3b82f6);
  box-shadow: inset 0 0 0 1px var(--primary-color, #3b82f6);
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
  transition: all 0.15s;
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

.picker-fade-enter-active,
.picker-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.picker-fade-enter-from,
.picker-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

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
