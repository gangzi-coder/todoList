<template>
  <div class="date-picker-examples">
    <h2>DatePicker 组件示例</h2>

    <!-- 基础日期选择 -->
    <section class="example-section">
      <h3>基础日期选择</h3>
      <DatePicker
        v-model="basicDate"
        placeholder="选择日期"
      />
      <p class="result">选中的日期: {{ basicDate ? formatDate(basicDate, 'date') : '未选择' }}</p>
    </section>

    <!-- 日期时间选择 -->
    <section class="example-section">
      <h3>日期时间选择</h3>
      <DatePicker
        v-model="dateTimeValue"
        placeholder="选择日期和时间"
        :enable-time="true"
      />
      <p class="result">选中的日期时间: {{ dateTimeValue ? formatDate(dateTimeValue, 'full') : '未选择' }}</p>
    </section>

    <!-- 带快捷选项 -->
    <section class="example-section">
      <h3>带快捷选项</h3>
      <DatePicker
        v-model="shortcutDate"
        placeholder="使用快捷选项"
        :show-shortcuts="true"
      />
      <p class="result">选中的日期: {{ shortcutDate ? formatDate(shortcutDate, 'relative') : '未选择' }}</p>
    </section>

    <!-- 禁用状态 -->
    <section class="example-section">
      <h3>禁用状态</h3>
      <DatePicker
        v-model="disabledDate"
        placeholder="禁用的日期选择器"
        :disabled="true"
      />
    </section>

    <!-- 日期范围限制 -->
    <section class="example-section">
      <h3>日期范围限制（只能选择未来 30 天）</h3>
      <DatePicker
        v-model="limitedDate"
        placeholder="选择日期"
        :min-date="new Date()"
        :max-date="maxDate"
      />
      <p class="result">选中的日期: {{ limitedDate ? formatDate(limitedDate, 'date') : '未选择' }}</p>
    </section>

    <!-- 不显示快捷选项 -->
    <section class="example-section">
      <h3>不显示快捷选项</h3>
      <DatePicker
        v-model="noShortcutDate"
        placeholder="选择日期"
        :show-shortcuts="false"
      />
      <p class="result">选中的日期: {{ noShortcutDate ? formatDate(noShortcutDate, 'date') : '未选择' }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DatePicker from './DatePicker.vue'
import { formatDate, addDays } from '../../utils/date'

const basicDate = ref<Date | null>(null)
const dateTimeValue = ref<Date | null>(null)
const shortcutDate = ref<Date | null>(null)
const disabledDate = ref<Date | null>(new Date())
const limitedDate = ref<Date | null>(null)
const noShortcutDate = ref<Date | null>(null)

const maxDate = computed(() => addDays(new Date(), 30))
</script>

<style scoped>
.date-picker-examples {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary, #1f2937);
}

.example-section {
  margin-bottom: 32px;
  padding: 20px;
  background-color: var(--section-bg, #f9fafb);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
}

h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary, #1f2937);
}

.result {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: var(--result-bg, #ffffff);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  border: 1px solid var(--border-color, #e5e7eb);
}

:global(.dark) .example-section {
  --section-bg: #111827;
  --border-color: #374151;
  --text-primary: #f9fafb;
}

:global(.dark) .result {
  --result-bg: #1f2937;
  --text-secondary: #9ca3af;
  --border-color: #374151;
}
</style>
