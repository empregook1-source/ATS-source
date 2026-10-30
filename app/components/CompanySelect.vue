<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

type Company = { id: string; name: string }

const props = withDefaults(defineProps<{
  modelValue?: string
  companies: Company[]
  placeholder?: string
  widthClass?: string
}>(), {
  placeholder: 'Todas as empresas',
  widthClass: 'w-48 max-w-48',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.placeholder
  return props.companies.find(c => c.id === props.modelValue)?.name ?? 'Empresa'
})

function close() {
  open.value = false
}

function toggle() {
  open.value = !open.value
}

function selectCompany(id: string | undefined) {
  emit('update:modelValue', id)
  close()
}

function handleOutside(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) close()
}

onMounted(() => document.addEventListener('mousedown', handleOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleOutside))
</script>

<template>
  <div ref="rootRef" class="relative" :class="widthClass">
    <button
      class="inline-flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
      :class="modelValue
        ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400'
        : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-700'"
      @click="toggle"
    >
      <span class="min-w-0 flex-1 truncate text-left">
        {{ selectedLabel }}
      </span>
      <ChevronDown class="ml-auto size-3.5 shrink-0" />
    </button>

    <div
      v-if="open"
      class="absolute left-0 top-full mt-1 z-20 w-full max-h-56 overflow-y-auto rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-lg py-1"
    >
      <button
        class="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        :class="!modelValue ? 'text-brand-600 font-medium' : 'text-surface-700 dark:text-surface-300'"
        @click="selectCompany(undefined)"
      >
        {{ placeholder }}
      </button>
      <button
        v-for="item in companies"
        :key="item.id"
        class="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors truncate"
        :class="modelValue === item.id ? 'text-brand-600 font-medium' : 'text-surface-700 dark:text-surface-300'"
        @click="selectCompany(item.id)"
      >
        {{ item.name }}
      </button>
    </div>
  </div>
</template>
