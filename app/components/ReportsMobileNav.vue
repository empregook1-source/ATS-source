<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import type { ReportMetricKey } from '~~/shared/reports'
import type { ReportSectionItem } from '~/utils/reports'

const props = defineProps<{
  modelValue: ReportMetricKey
  items: ReportSectionItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ReportMetricKey]
}>()
</script>

<template>
  <div class="border-b border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
    <div class="flex items-center gap-3 px-4 pt-3 pb-2">
      <NuxtLink
        :to="$localePath('/dashboard')"
        class="inline-flex items-center gap-1 text-xs font-medium text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors no-underline"
      >
        <ChevronLeft class="size-3.5" />
        Voltar
      </NuxtLink>
      <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
        Relatórios
      </h2>
    </div>

    <nav class="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2">
      <button
        v-for="item in props.items"
        :key="item.key"
        type="button"
        class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
        :class="props.modelValue === item.key
          ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300'
          : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-surface-100'"
        @click="emit('update:modelValue', item.key)"
      >
        <component :is="item.icon" class="size-3.5" />
        {{ item.label }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
</style>
