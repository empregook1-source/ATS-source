<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import type { ReportMetricKey } from '~~/shared/reports'
import type { ReportSectionItem } from '~/utils/reports'
import { reportsSectionIcon } from '~/utils/reports'

const props = defineProps<{
  modelValue: ReportMetricKey
  items: ReportSectionItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ReportMetricKey]
}>()
</script>

<template>
  <aside
    class="flex h-full w-72 min-w-72 flex-col border-r border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-y-auto overscroll-contain"
  >
    <div class="px-4 pt-5 pb-4">
      <NuxtLink
        :to="$localePath('/dashboard')"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 transition-colors no-underline mb-3"
      >
        <ChevronLeft class="size-3.5" />
        Voltar para o painel
      </NuxtLink>
      <div class="flex items-center gap-2.5">
        <div class="flex items-center justify-center size-8 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
          <component :is="reportsSectionIcon" class="size-4" />
        </div>
        <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
          Relatórios
        </h2>
      </div>
    </div>

    <nav class="flex-1 px-3 pb-5">
      <div class="flex flex-col gap-0.5">
        <button
          v-for="item in props.items"
          :key="item.key"
          type="button"
          class="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all"
          :class="props.modelValue === item.key
            ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-medium'
            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-surface-100'"
          @click="emit('update:modelValue', item.key)"
        >
          <div
            class="flex items-center justify-center size-8 rounded-md transition-colors"
            :class="props.modelValue === item.key
              ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400'
              : 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500 group-hover:text-surface-600 dark:group-hover:text-surface-300'"
          >
            <component :is="item.icon" class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate leading-tight">
              {{ item.label }}
            </div>
            <div
              class="mt-0.5 truncate text-[11px] leading-tight"
              :class="props.modelValue === item.key
                ? 'text-brand-500/70 dark:text-brand-400/60'
                : 'text-surface-400 dark:text-surface-500'"
            >
              {{ item.subtitle }}
            </div>
          </div>
        </button>
      </div>
    </nav>
  </aside>
</template>
