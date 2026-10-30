<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import type {
  ReportDatePreset,
  ReportMetricKey,
  ReportsStatsResponse,
} from '~~/shared/reports'
import { getReportSectionItem, reportSectionItems } from '~/utils/reports'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org', 'settings-access'],
})

useSeoMeta({
  title: 'Relatórios — Emprego OK',
  description: 'Acompanhe relatórios operacionais do seu recrutamento.',
})

type DateRangeModel = {
  preset: ReportDatePreset
  from?: string
  to?: string
}

const activeSection = ref<ReportMetricKey>('companies')
const dateRange = ref<DateRangeModel>({ preset: '30d' })

const { data: resumeAccess } = await useFetch<{ allowed: boolean }>('/api/reports/resumes/access', {
  key: 'dashboard-reports-resumes-access',
  headers: useRequestHeaders(['cookie']),
})

const activeItem = computed(() => getReportSectionItem(activeSection.value))

const chartDescriptionBySection: Record<ReportMetricKey, string> = {
  companies: 'Evolucão acumulada de empresas ao longo do tempo, separadas entre ativas e inativas.',
  jobs: 'Evolucão acumulada do total de vagas ao longo do intervalo selecionado.',
  candidates: 'Evolucão acumulada do total de candidatos ao longo do intervalo selecionado.',
  applications: 'Evolucão acumulada do total de candidaturas ao longo do intervalo selecionado.',
  interviews: 'Evolucão acumulada do total de entrevistas ao longo do intervalo selecionado.',
  resumes: 'Evolucão acumulada dos currículos gerados pelo criador de currículos, com e sem aceite de armazenamento.',
}

const requestQuery = computed(() => ({
  metric: activeSection.value,
  preset: dateRange.value.preset,
  ...(dateRange.value.preset === 'custom'
    ? {
        from: dateRange.value.from,
        to: dateRange.value.to,
      }
    : {}),
}))

const {
  data,
  status,
  error,
  refresh,
} = await useFetch<ReportsStatsResponse>('/api/reports/stats', {
  key: 'dashboard-reports-stats',
  headers: useRequestHeaders(['cookie']),
  query: requestQuery,
  watch: [
    activeSection,
    () => dateRange.value.preset,
    () => dateRange.value.from,
    () => dateRange.value.to,
  ],
})

const reportData = computed<ReportsStatsResponse | null>(() => data.value ?? null)

const summaryCards = computed(() => {
  if (!reportData.value) {
    return []
  }

  return reportData.value.series.map(item => ({
    ...item,
    total: reportData.value?.totals[item.key] ?? 0,
  }))
})

function handleSectionChange(value: ReportMetricKey) {
  activeSection.value = value
}

function handleDateRangeChange(value: DateRangeModel) {
  dateRange.value = value
}
</script>

<template>
  <div class="flex min-h-full flex-col overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 lg:flex-row">
    <div class="hidden lg:block shrink-0">
      <ReportsSidebar
        :model-value="activeSection"
        :items="reportSectionItems"
        @update:model-value="handleSectionChange"
      />
    </div>

    <div class="lg:hidden">
      <ReportsMobileNav
        :model-value="activeSection"
        :items="reportSectionItems"
        @update:model-value="handleSectionChange"
      />
    </div>

    <section class="min-w-0 flex-1 bg-surface-50/80 dark:bg-surface-950/60">
      <div class="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <section class="overflow-hidden rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm">
          <div class="flex flex-col gap-4 border-b border-surface-200 dark:border-surface-800 px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">
                {{ activeItem.label }}
              </h2>
              <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                {{ chartDescriptionBySection[activeSection] }}
              </p>
            </div>

            <div class="flex flex-col gap-3 lg:items-end">
              <ReportsDateRangeDropdown
                :model-value="dateRange"
                @update:model-value="handleDateRangeChange"
              />

              <div v-if="reportData" class="flex flex-wrap items-center gap-3">
                <div
                  v-for="item in reportData.series"
                  :key="item.key"
                  class="inline-flex items-center gap-2 text-xs font-medium text-surface-500 dark:text-surface-400"
                >
                  <span
                    class="block size-2.5 rounded-full"
                    :style="{ backgroundColor: item.color }"
                  />
                  {{ item.label }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="status === 'pending'" class="space-y-6 px-4 py-5 sm:px-6">
            <div class="h-[320px] animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800" />
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="index in 3"
                :key="index"
                class="h-20 animate-pulse rounded-2xl bg-surface-100 dark:bg-surface-800"
              />
            </div>
          </div>

          <div
            v-else-if="error"
            class="px-4 py-10 text-center sm:px-6"
          >
            <div class="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-danger-200 dark:border-danger-900 bg-danger-50/70 dark:bg-danger-950/30 px-6 py-8">
              <div class="flex size-12 items-center justify-center rounded-full bg-danger-100 dark:bg-danger-950 text-danger-600 dark:text-danger-400">
                <AlertCircle class="size-5" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-danger-700 dark:text-danger-300">
                  Não foi possível carregar os relatórios
                </h3>
                <p class="mt-1 text-sm text-danger-600/80 dark:text-danger-400/80">
                  {{ error.statusMessage || 'Tente novamente em instantes.' }}
                </p>
              </div>
              <button
                type="button"
                class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                @click="refresh()"
              >
                Tentar novamente
              </button>
            </div>
          </div>

          <div v-else-if="reportData" class="px-4 py-5 sm:px-6">
            <ReportsLineChart
              :points="reportData.points"
              :series="reportData.series"
            />

            <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="item in summaryCards"
                :key="item.key"
                class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50/80 dark:bg-surface-950/40 px-4 py-4"
              >
                <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-surface-400 dark:text-surface-500">
                  <span
                    class="block size-2.5 rounded-full"
                    :style="{ backgroundColor: item.color }"
                  />
                  {{ item.label }}
                </div>
                <div class="mt-2 text-2xl font-semibold text-surface-900 dark:text-surface-50">
                  {{ item.total }}
                </div>
                <div class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                  Total acumulado até o fim do período selecionado.
                </div>
              </div>
            </div>
          </div>

          <ReportsResumeList
            v-if="activeSection === 'resumes' && resumeAccess?.allowed"
            class="border-t border-surface-200 dark:border-surface-800"
          />
        </section>
      </div>
    </section>
  </div>
</template>
