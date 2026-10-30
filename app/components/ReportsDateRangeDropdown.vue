<script setup lang="ts">
import { CalendarDays, Check, ChevronDown } from 'lucide-vue-next'
import type { ReportDatePreset } from '~~/shared/reports'

type DateRangeModel = {
  preset: ReportDatePreset
  from?: string
  to?: string
}

const props = defineProps<{
  modelValue: DateRangeModel
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DateRangeModel]
}>()

const options: Array<{ label: string; preset: Exclude<ReportDatePreset, 'custom'> }> = [
  { label: '7 dias', preset: '7d' },
  { label: '15 dias', preset: '15d' },
  { label: '30 dias', preset: '30d' },
]

const rootRef = useTemplateRef<HTMLElement>('root')
const isOpen = ref(false)
const customFrom = ref(props.modelValue.from ?? '')
const customTo = ref(props.modelValue.to ?? '')

watch(() => props.modelValue, (value) => {
  customFrom.value = value.from ?? ''
  customTo.value = value.to ?? ''
}, { deep: true })

const canApplyCustomRange = computed(() =>
  Boolean(customFrom.value && customTo.value && customFrom.value <= customTo.value),
)

const buttonLabel = computed(() => {
  if (props.modelValue.preset === 'custom' && props.modelValue.from && props.modelValue.to) {
    const [fromYear, fromMonth, fromDay] = props.modelValue.from.split('-')
    const [toYear, toMonth, toDay] = props.modelValue.to.split('-')
    return `${fromDay}/${fromMonth}/${fromYear} - ${toDay}/${toMonth}/${toYear}`
  }

  return options.find(option => option.preset === props.modelValue.preset)?.label ?? 'Período'
})

function close() {
  isOpen.value = false
}

function selectPreset(preset: Exclude<ReportDatePreset, 'custom'>) {
  emit('update:modelValue', { preset })
  close()
}

function selectCustom() {
  isOpen.value = true
  if (props.modelValue.preset === 'custom') {
    customFrom.value = props.modelValue.from ?? ''
    customTo.value = props.modelValue.to ?? ''
  }
}

function applyCustomRange() {
  if (!canApplyCustomRange.value) {
    return
  }

  emit('update:modelValue', {
    preset: 'custom',
    from: customFrom.value,
    to: customTo.value,
  })
  close()
}

function handleOutsideClick(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-200 shadow-sm transition-colors hover:border-surface-300 dark:hover:border-surface-600 hover:text-surface-900 dark:hover:text-surface-50"
      @click="isOpen = !isOpen"
    >
      <CalendarDays class="size-4 text-surface-400 dark:text-surface-500" />
      {{ buttonLabel }}
      <ChevronDown class="size-4 text-surface-400 transition-transform" :class="isOpen ? 'rotate-180' : ''" />
    </button>

    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute right-0 top-[calc(100%+8px)] z-20 w-[300px] rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-2 shadow-xl shadow-surface-900/8 dark:shadow-surface-950/30"
      >
        <div class="space-y-1">
          <button
            v-for="option in options"
            :key="option.preset"
            type="button"
            class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="props.modelValue.preset === option.preset
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
              : 'text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/70'"
            @click="selectPreset(option.preset)"
          >
            <span>{{ option.label }}</span>
            <Check v-if="props.modelValue.preset === option.preset" class="size-4" />
          </button>

          <button
            type="button"
            class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors"
            :class="props.modelValue.preset === 'custom'
              ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
              : 'text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/70'"
            @click="selectCustom"
          >
            <span>Custom</span>
            <Check v-if="props.modelValue.preset === 'custom'" class="size-4" />
          </button>
        </div>

        <div class="mt-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-950/40 p-3">
          <div class="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-surface-400 dark:text-surface-500">
            Intervalo customizado
          </div>

          <div class="grid gap-3">
            <label class="grid gap-1.5">
              <span class="text-xs font-medium text-surface-500 dark:text-surface-400">Data inicial</span>
              <input
                v-model="customFrom"
                type="date"
                class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>

            <label class="grid gap-1.5">
              <span class="text-xs font-medium text-surface-500 dark:text-surface-400">Data final</span>
              <input
                v-model="customTo"
                type="date"
                class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm text-surface-700 dark:text-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </label>
          </div>

          <div class="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-lg px-3 py-2 text-sm font-medium text-surface-500 transition-colors hover:text-surface-800 dark:text-surface-400 dark:hover:text-surface-100"
              @click="close"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canApplyCustomRange"
              @click="applyCustomRange"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>
