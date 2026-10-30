<script setup lang="ts">
import { FileText, Search, X, ChevronDown, Briefcase, Mail, Clock, ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

useSeoMeta({
  title: 'Candidaturas — Emprego OK',
  description: 'Gerencie candidaturas em todas as vagas',
})

const route = useRoute()
const router = useRouter()
const activeCompanyId = ref<string | undefined>(undefined)
const { companies } = useCompanies({ isActive: true, limit: 100 })

// ── Search ────────────────────────────────────────────────────────────────────

const searchInput = ref('')
const debouncedSearch = ref<string | undefined>(undefined)
const currentPage = ref(1)
const pageSize = 20

let debounceTimer: ReturnType<typeof setTimeout>
watch(searchInput, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debouncedSearch.value = val.trim() || undefined
  }, 250)
})

// ── Status filter ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const
type Status = typeof STATUS_OPTIONS[number]

const initialAppStatus = STATUS_OPTIONS.includes(route.query.status as any)
  ? (route.query.status as Status)
  : undefined
const activeStatus = useState<Status | undefined>('app-filter-status', () => initialAppStatus)
// Ensure the state matches the URL on navigation (useState caches across client-side navigations)
if (initialAppStatus !== undefined) {
  activeStatus.value = initialAppStatus
}

// Sync the URL when the status filter changes
watch(activeStatus, (newStatus) => {
  const query = { ...route.query }
  if (newStatus) {
    query.status = newStatus
  }
  else {
    delete query.status
  }
  router.replace({ query })
})

const statusFilter = computed(() => activeStatus.value)

const activeJobId = ref<string | undefined>(undefined)
const jobDropdownOpen = ref(false)
const jobDropdownRef = ref<HTMLElement | null>(null)

watch([activeCompanyId, statusFilter, activeJobId, debouncedSearch], () => {
  currentPage.value = 1
})

const { jobs: jobsForFilter } = useJobs({ companyId: activeCompanyId, limit: 100 })

const uniqueJobs = computed(() => {
  return [...jobsForFilter.value]
    .map(j => ({ id: j.id, title: j.title }))
    .sort((a, b) => a.title.localeCompare(b.title))
})

const { applications, total, page, limit, fetchStatus, error, refresh } = useApplications({
  companyId: activeCompanyId,
  jobId: activeJobId,
  status: statusFilter,
  search: debouncedSearch,
  page: currentPage,
  limit: pageSize,
})

function handleJobDropdownOutside(e: MouseEvent) {
  if (jobDropdownRef.value && !jobDropdownRef.value.contains(e.target as Node)) {
    jobDropdownOpen.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', handleJobDropdownOutside))
onUnmounted(() => document.removeEventListener('mousedown', handleJobDropdownOutside))

// ── Sorting ───────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'email' | 'job' | 'status' | 'score' | 'created'
type SortDir = 'asc' | 'desc'

const sortKey = ref<SortKey>('created')
const sortDir = ref<SortDir>('desc')

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'created' || key === 'score' ? 'desc' : 'asc'
  }
}

// ── Filtered + sorted list ────────────────────────────────────────────────────

const filteredCandidaturas = computed(() => {
  let list = [...applications.value]

  // Sort
  const dir = sortDir.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    switch (sortKey.value) {
      case 'name':
        return dir * `${a.candidateFirstName} ${a.candidateLastName}`.localeCompare(`${b.candidateFirstName} ${b.candidateLastName}`)
      case 'email':
        return dir * a.candidateEmail.localeCompare(b.candidateEmail)
      case 'job':
        return dir * a.jobTitle.localeCompare(b.jobTitle)
      case 'status':
        return dir * a.status.localeCompare(b.status)
      case 'score':
        return dir * ((a.score ?? -1) - (b.score ?? -1))
      case 'created':
        return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      default:
        return 0
    }
  })

  return list
})

const hasActiveFilters = computed(() =>
  activeStatus.value != null || activeJobId.value != null || activeCompanyId.value != null || !!debouncedSearch.value,
)

function clearAllFilters() {
  activeStatus.value = undefined
  activeJobId.value = undefined
  activeCompanyId.value = undefined
  searchInput.value = ''
  debouncedSearch.value = undefined
  currentPage.value = 1
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function scoreClass(score: number) {
  if (score >= 75) return 'bg-success-50 text-success-700 ring-success-200 dark:bg-success-950 dark:text-success-400 dark:ring-success-800'
  if (score >= 40) return 'bg-warning-50 text-warning-700 ring-warning-200 dark:bg-warning-950 dark:text-warning-400 dark:ring-warning-800'
  return 'bg-danger-50 text-danger-700 ring-danger-200 dark:bg-danger-950 dark:text-danger-400 dark:ring-danger-800'
}

const statusBadgeClasses: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  screening: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  interview: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  offer: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  hired: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  rejected: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
}

const statusDotClasses: Record<string, string> = {
  new: 'bg-blue-500',
  screening: 'bg-violet-500',
  interview: 'bg-amber-500',
  offer: 'bg-teal-500',
  hired: 'bg-green-600',
  rejected: 'bg-surface-400 dark:bg-surface-500',
}

const statusLabels: Record<Status, string> = {
  new: 'Novo',
  screening: 'Triagem',
  interview: 'Entrevista',
  offer: 'Talentos',
  hired: 'Contratado',
  rejected: 'Rejeitado',
}

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit.value)))

const paginationItems = computed<(number | 'ellipsis')[]>(() => {
  const items: (number | 'ellipsis')[] = []
  const totalPageCount = totalPages.value
  const activePage = page.value

  if (totalPageCount <= 7) {
    return Array.from({ length: totalPageCount }, (_, index) => index + 1)
  }

  items.push(1)

  if (activePage > 3) items.push('ellipsis')

  const start = Math.max(2, activePage - 1)
  const end = Math.min(totalPageCount - 1, activePage + 1)

  for (let pageNumber = start; pageNumber <= end; pageNumber++) {
    items.push(pageNumber)
  }

  if (activePage < totalPageCount - 2) items.push('ellipsis')

  items.push(totalPageCount)

  return items
})

function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > totalPages.value || targetPage === page.value) return
  currentPage.value = targetPage
}
</script>

<template>
  <div class="mx-auto max-w-6xl">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Candidaturas</h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Acompanhe candidatos através da sua linha do tempo de candidaturas.
        </p>
      </div>
    </div>

    <!-- Search bar -->
    <div class="relative mb-4">
      <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-surface-400" />
      <input
        v-model="searchInput"
        type="text"
        placeholder="Buscar por nome do candidato, e-mail ou título da vaga…"
        class="w-full rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 pl-10 pr-3 py-2.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
      />
    </div>

    <!-- Filter bar -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <CompanySelect v-model="activeCompanyId" :companies="companies" />

      <!-- Job dropdown filter -->
      <div ref="jobDropdownRef" class="relative">
        <button
          class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
          :class="activeJobId
            ? 'border-brand-300 dark:border-brand-700 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400'
            : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 hover:border-surface-300 dark:hover:border-surface-700'"
          @click="jobDropdownOpen = !jobDropdownOpen"
        >
          <Briefcase class="size-3.5" />
          {{ activeJobId ? uniqueJobs.find(j => j.id === activeJobId)?.title ?? 'Vaga' : 'Vaga' }}
          <ChevronDown class="size-3.5" />
        </button>
        <div
          v-if="jobDropdownOpen"
          class="absolute left-0 top-full mt-1 z-20 w-64 max-h-56 overflow-y-auto rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-lg py-1"
        >
          <button
            class="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
            :class="!activeJobId ? 'text-brand-600 font-medium' : 'text-surface-700 dark:text-surface-300'"
            @click="activeJobId = undefined; jobDropdownOpen = false"
          >
            Todas as vagas
          </button>
          <button
            v-for="j in uniqueJobs"
            :key="j.id"
            class="w-full text-left px-3 py-2 text-sm hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors truncate"
            :class="activeJobId === j.id ? 'text-brand-600 font-medium' : 'text-surface-700 dark:text-surface-300'"
            @click="activeJobId = j.id; jobDropdownOpen = false"
          >
            {{ j.title }}
          </button>
        </div>
      </div>

      <!-- Status filter tabs -->
      <div class="flex items-center gap-1">
        <button
          class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
          :class="!activeStatus
            ? 'bg-surface-900 text-white dark:bg-surface-100 dark:text-surface-900'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'"
          @click="activeStatus = undefined"
        >
          Ver tudo
        </button>
        <button
          v-for="s in STATUS_OPTIONS"
          :key="s"
          class="rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors"
          :class="activeStatus === s
            ? 'bg-surface-900 text-white dark:bg-surface-100 dark:text-surface-900'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'"
          @click="activeStatus = activeStatus === s ? undefined : s"
        >
          {{ statusLabels[s] }}
        </button>
      </div>

      <!-- Clear all -->
      <button
        v-if="hasActiveFilters"
        class="inline-flex items-center gap-1 text-xs text-surface-400 hover:text-danger-600 transition-colors ml-auto"
        @click="clearAllFilters"
      >
        <X class="size-3" />
        Limpar filtros
      </button>
    </div>

    <!-- Loading -->
    <div v-if="fetchStatus === 'pending'" class="text-center py-16 text-surface-400">
      Loading applications…
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700"
    >
      Falha ao carregar candidaturas. Please try again.
      <button class="underline ml-1" @click="refresh()">Retry</button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="applications.length === 0 && !hasActiveFilters"
      class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-16 text-center"
    >
      <FileText class="size-10 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">Nenhuma candidatura ainda</h3>
      <p class="text-sm text-surface-500 dark:text-surface-400">
        Candidaturas aparecerão aqui quando candidatos aplicarem em suas vagas ou quando você vincular candidatos manualmente.
      </p>
    </div>

    <!-- No results after filtering -->
    <div
      v-else-if="applications.length === 0 && hasActiveFilters"
      class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 text-center"
    >
      <Search class="size-8 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">Nenhuma candidatura encontrada</h3>
      <p class="text-sm text-surface-500 dark:text-surface-400 mb-3">
        Try adjusting your search or filters.
      </p>
      <button
        class="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        @click="clearAllFilters"
      >
        Limpar filtros
      </button>
    </div>

    <!-- Application table -->
    <div v-else>
      <div class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-800">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-800">
              <th class="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400">
                <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('name')">
                  Nome
                  <ArrowUp v-if="sortKey === 'name' && sortDir === 'asc'" class="size-3.5" />
                  <ArrowDown v-else-if="sortKey === 'name' && sortDir === 'desc'" class="size-3.5" />
                  <ArrowUpDown v-else class="size-3.5 opacity-40" />
                </button>
              </th>
              <th class="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400 hidden lg:table-cell">
                <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('email')">
                  Email
                  <ArrowUp v-if="sortKey === 'email' && sortDir === 'asc'" class="size-3.5" />
                  <ArrowDown v-else-if="sortKey === 'email' && sortDir === 'desc'" class="size-3.5" />
                  <ArrowUpDown v-else class="size-3.5 opacity-40" />
                </button>
              </th>
              <th class="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400 hidden md:table-cell">
                <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('job')">
                  Vaga
                  <ArrowUp v-if="sortKey === 'job' && sortDir === 'asc'" class="size-3.5" />
                  <ArrowDown v-else-if="sortKey === 'job' && sortDir === 'desc'" class="size-3.5" />
                  <ArrowUpDown v-else class="size-3.5 opacity-40" />
                </button>
              </th>
              <th class="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400">
                <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('status')">
                  Status
                  <ArrowUp v-if="sortKey === 'status' && sortDir === 'asc'" class="size-3.5" />
                  <ArrowDown v-else-if="sortKey === 'status' && sortDir === 'desc'" class="size-3.5" />
                  <ArrowUpDown v-else class="size-3.5 opacity-40" />
                </button>
              </th>
              <th class="text-center px-4 py-3 font-medium text-surface-500 dark:text-surface-400 hidden sm:table-cell">
                <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('score')">
                  Score
                  <ArrowUp v-if="sortKey === 'score' && sortDir === 'asc'" class="size-3.5" />
                  <ArrowDown v-else-if="sortKey === 'score' && sortDir === 'desc'" class="size-3.5" />
                  <ArrowUpDown v-else class="size-3.5 opacity-40" />
                </button>
              </th>
              <th class="text-left px-4 py-3 font-medium text-surface-500 dark:text-surface-400">
                <button class="inline-flex items-center gap-1 hover:text-surface-900 dark:hover:text-surface-100 transition-colors" @click="toggleSort('created')">
                  Aplicado em
                  <ArrowUp v-if="sortKey === 'created' && sortDir === 'asc'" class="size-3.5" />
                  <ArrowDown v-else-if="sortKey === 'created' && sortDir === 'desc'" class="size-3.5" />
                  <ArrowUpDown v-else class="size-3.5 opacity-40" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-100 dark:divide-surface-800">
            <tr
              v-for="app in filteredCandidaturas"
              :key="app.id"
              class="group bg-white dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors cursor-pointer"
              @click="$router.push($localePath(`/dashboard/applications/${app.id}`))"
            >
              <td class="px-4 py-3">
                <NuxtLink
                  :to="$localePath(`/dashboard/applications/${app.id}`)"
                  class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 transition-colors whitespace-nowrap"
                >
                  {{ app.candidateFirstName }} {{ app.candidateLastName }}
                </NuxtLink>
              </td>
              <td class="px-4 py-3 text-surface-500 dark:text-surface-400 hidden lg:table-cell">
                <span class="inline-flex items-center gap-1.5">
                  <Mail class="size-3.5 shrink-0" />
                  <span class="truncate max-w-[200px]">{{ app.candidateEmail }}</span>
                </span>
              </td>
              <td class="px-4 py-3 text-surface-600 dark:text-surface-300 hidden md:table-cell">
                <span class="inline-flex items-center gap-1.5 truncate max-w-[200px]">
                  <Briefcase class="size-3.5 shrink-0 text-surface-400" />
                  {{ app.jobTitle }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap"
                  :class="statusBadgeClasses[app.status] ?? 'bg-surface-100 text-surface-600'"
                >
                  <span class="size-1.5 rounded-full" :class="statusDotClasses[app.status] ?? 'bg-surface-400'" />
                  {{ statusLabels[app.status as Status] ?? app.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-center hidden sm:table-cell">
                <span
                  v-if="app.score != null"
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset"
                  :class="scoreClass(app.score)"
                >
                  {{ app.score }}%
                </span>
                <span v-else class="text-surface-300 dark:text-surface-600">—</span>
              </td>
              <td class="px-4 py-3 text-surface-400 whitespace-nowrap">
                <TimelineDateLink :date="app.createdAt" class="inline-flex items-center gap-1.5">
                  <Clock class="size-3.5 shrink-0" />
                  {{ timeAgo(app.createdAt) }}
                </TimelineDateLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs text-surface-400">
          {{ total }} candidatura{{ total === 1 ? '' : 's' }} total
        </p>

        <div
          v-if="totalPages > 1"
          class="flex items-center justify-end gap-1"
        >
          <button
            :disabled="page <= 1"
            class="inline-flex items-center gap-1 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-600 dark:text-surface-300 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400"
            @click="goToPage(page - 1)"
          >
            <ChevronLeft class="size-4" />
            Anterior
          </button>

          <template v-for="(item, index) in paginationItems" :key="`${item}-${index}`">
            <span
              v-if="item === 'ellipsis'"
              class="px-2 text-sm text-surface-400"
            >
              ...
            </span>
            <button
              v-else
              class="inline-flex min-w-9 items-center justify-center rounded-lg border px-3 py-1.5 text-sm transition-colors"
              :class="page === item
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400'"
              @click="goToPage(item)"
            >
              {{ item }}
            </button>
          </template>

          <button
            :disabled="page >= totalPages"
            class="inline-flex items-center gap-1 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-600 dark:text-surface-300 transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400"
            @click="goToPage(page + 1)"
          >
            Próxima
            <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
