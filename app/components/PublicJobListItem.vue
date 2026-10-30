<script setup lang="ts">
import { Briefcase, ChevronRight, MapPin } from 'lucide-vue-next'

type PublicJobListItemModel = {
  id: string
  title: string
  slug: string
  description: string | null
  location: string | null
  type: string
  createdAt: string
}

const props = withDefaults(defineProps<{
  job: PublicJobListItemModel
  to: string | Record<string, unknown>
  compact?: boolean
}>(), {
  compact: false,
})

const typeLabels: Record<string, string> = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  contract: 'Temporário',
  internship: 'Estágio',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <NuxtLink
    :to="to"
    class="group block rounded-lg border border-surface-200 bg-white transition-all hover:border-surface-300 hover:shadow-sm dark:border-surface-800 dark:bg-surface-900 dark:hover:border-surface-700"
    :class="compact ? 'px-4 py-3' : 'px-5 py-4'"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <h2 class="font-semibold text-surface-900 transition-colors group-hover:text-brand-600 dark:text-surface-100 dark:group-hover:text-brand-400"
          :class="compact ? 'text-sm' : 'text-base'"
        >
          {{ job.title }}
        </h2>

        <div class="mt-1.5 flex flex-wrap items-center gap-3 text-surface-500" :class="compact ? 'text-xs' : 'text-sm'">
          <span class="inline-flex items-center gap-1">
            <Briefcase class="size-3.5" />
            {{ typeLabels[job.type] ?? job.type }}
          </span>
          <span v-if="job.location" class="inline-flex items-center gap-1">
            <MapPin class="size-3.5" />
            {{ job.location }}
          </span>
          <span class="text-surface-400">
            Publicado em {{ formatDate(job.createdAt) }}
          </span>
        </div>

        <p
          v-if="job.description && !compact"
          class="mt-2 line-clamp-2 text-sm text-surface-600 dark:text-surface-400"
        >
          {{ job.description }}
        </p>
      </div>

      <ChevronRight class="mt-1 size-5 shrink-0 text-surface-300 transition-colors group-hover:text-brand-500" />
    </div>
  </NuxtLink>
</template>
