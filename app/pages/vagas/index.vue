<script setup lang="ts">
import { Search, Briefcase, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-vue-next'

definePageMeta({
  layout: 'public',
})

const route = useRoute()
const localePath = useLocalePath()

/** Forward source-tracking query params (?ref=, utm_*) through navigation */
const sourceQuery = computed(() => {
  const q: Record<string, string> = {}
  if (route.query.ref) q.ref = route.query.ref as string
  if (route.query.utm_source) q.utm_source = route.query.utm_source as string
  if (route.query.utm_medium) q.utm_medium = route.query.utm_medium as string
  if (route.query.utm_campaign) q.utm_campaign = route.query.utm_campaign as string
  if (route.query.utm_term) q.utm_term = route.query.utm_term as string
  if (route.query.utm_content) q.utm_content = route.query.utm_content as string
  return q
})

useSeoMeta({
  title: 'Vagas de emprego - Emprego OK',
  description:
    'Busque vagas abertas e candidate-se na plataforma da Emprego OK e encontre sua próxima oportunidade de emprego.',
  ogTitle: 'Portal de vagas — Emprego OK',
  ogDescription:
    'Busque vagas abertas e candidate-se na plataforma da Emprego OK e encontre sua próxima oportunidade de emprego.',
  ogType: 'website',
  ogImage: '/matrix-banner.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Portal de vagas - Emprego OK',
  twitterDescription:
    'Busque vagas abertas e candidate-se na plataforma da Emprego OK.',
})

// ─────────────────────────────────────────────
// Query state
// ─────────────────────────────────────────────

const page = ref(1)
const searchInput = ref('')
const searchQuery = ref('')
const typeFilter = ref<string | undefined>(undefined)

const routeSearchTerm = computed(() => {
  const param = route.query.search
  return typeof param === 'string' ? param.trim() : ''
})

// Debounce search input
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(searchInput, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchQuery.value = val.trim()
    page.value = 1
  }, 300)
})

// Reset page when filters change
watch(typeFilter, () => {
  page.value = 1
})

watch(
  routeSearchTerm,
  (term) => {
    searchInput.value = term
    searchQuery.value = term
    page.value = 1
  },
  { immediate: true },
)

const queryParams = computed(() => ({
  page: page.value,
  limit: 20,
  ...(searchQuery.value && { search: searchQuery.value }),
  ...(typeFilter.value && { type: typeFilter.value }),
}))

const { data, status: fetchStatus, error, refresh } = useFetch('/api/public/jobs', {
  key: 'public-jobs',
  query: queryParams,
})

const jobs = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(total.value / 20))

const typeOptions = [
  { label: 'Todos', value: undefined },
  { label: 'Tempo integral', value: 'full_time' },
  { label: 'Meio período', value: 'part_time' },
  { label: 'Temporário', value: 'contract' },
  { label: 'Estágio', value: 'internship' },
] as const
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-8">
      <NuxtLink
        :to="localePath('/')"
        class="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/3 dark:text-slate-200 dark:hover:bg-white/8"
      >
        <ArrowLeft class="size-4" />
        Voltar
      </NuxtLink>
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">Vagas abertas</h1>
      <p class="text-sm text-surface-500 mt-1">
        Busque vagas abertas e encontre sua próxima oportunidade.
      </p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <!-- Search -->
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-surface-400 pointer-events-none" />
        <input
          v-model="searchInput"
          type="text"
          placeholder="Buscar vagas por título ou localização…"
          class="w-full rounded-lg border border-surface-300 dark:border-surface-700 pl-9 pr-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
        />
      </div>

      <!-- Type filter -->
      <select
        :value="typeFilter ?? ''"
        class="rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 bg-white dark:bg-surface-900 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
        @change="typeFilter = ($event.target as HTMLSelectElement).value || undefined"
      >
        <option v-for="opt in typeOptions" :key="String(opt.value)" :value="opt.value ?? ''">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Loading state -->
    <div v-if="fetchStatus === 'pending'" class="text-center py-16 text-surface-400">
      Loading positions…
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-4 text-sm text-danger-700 dark:text-danger-400"
    >
      Falha ao carregar vagas. Please try again.
      <button class="underline ml-1 cursor-pointer" @click="refresh()">Retry</button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="jobs.length === 0"
      class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 text-center"
    >
      <Briefcase class="size-10 text-surface-300 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-surface-700 dark:text-surface-300 mb-1">Sem vagas abertas</h3>
      <p class="text-sm text-surface-500">
        <template v-if="searchQuery || typeFilter">
          Sem vagas abertas para os filtros aplicados. Ajuste os filtros para sua busca.
        </template>
        <template v-else>
          Não há vagas abertas agora. Volte mais tarde!
        </template>
      </p>
    </div>

    <!-- Job list -->
    <div v-else class="space-y-3">
      <PublicJobListItem
        v-for="j in jobs"
        :key="j.id"
        :job="j"
        :to="{ path: $localePath(`/vagas/${j.slug}`), query: sourceQuery }"
      />

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-4">
        <button
          :disabled="page <= 1"
          class="inline-flex items-center gap-1 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          @click="page--"
        >
          <ChevronLeft class="size-4" />
          Previous
        </button>

        <span class="text-sm text-surface-500">
          Page {{ page }} of {{ totalPages }}
        </span>

        <button
          :disabled="page >= totalPages"
          class="inline-flex items-center gap-1 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          @click="page++"
        >
          Next
          <ChevronRight class="size-4" />
        </button>
      </div>

      <!-- Total count -->
      <p class="text-xs text-surface-400 pt-1">
        {{ total }} open position{{ total === 1 ? '' : 's' }}
      </p>
    </div>
  </div>
</template>
