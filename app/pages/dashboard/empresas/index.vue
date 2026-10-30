<script setup lang="ts">
import { Building2, Plus, Search } from 'lucide-vue-next'
import { formatPhoneMask } from '~~/shared/phone'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

useSeoMeta({
  title: 'Empresas — Emprego OK',
  description: 'Lista de empresas vinculadas a sua organização',
})

const localePath = useLocalePath()
const { allowed: canCreateCompany } = usePermission({ company: ['create'] })
const search = ref('')
const { companies, status, refresh } = useCompanies({ search })

const companyMetricConfig = [
  { key: 'new', label: 'Novo', textColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/40' },
  { key: 'screening', label: 'Triagem', textColor: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-950/40' },
  { key: 'interview', label: 'Entrevista', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/40' },
  { key: 'offer', label: 'Talentos', textColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-950/40' },
  { key: 'hired', label: 'Contratado', textColor: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/40' },
  { key: 'rejected', label: 'Rejeitar', textColor: 'text-surface-500 dark:text-surface-400', bgColor: 'bg-surface-100 dark:bg-surface-800' },
] as const

type CompanyMetricKey = (typeof companyMetricConfig)[number]['key']

function getMetricValue(item: any, key: CompanyMetricKey): number {
  return item.pipeline?.[key] ?? 0
}

function getCompanyContactInfo(item: any) {
  const phone = formatPhoneMask(item.phone) || 'Sem telefone'
  const responsible = item.responsibleName?.trim() || 'Sem responsável'
  return `${phone} | ${responsible}`
}

function getCompanyEmail(item: any) {
  const email = item.email?.trim()
  return email || null
}

function goToCompany(companyId: string) {
  return navigateTo(localePath(`/dashboard/empresas/${companyId}`))
}

function handleCardKeydown(event: KeyboardEvent, companyId: string) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  goToCompany(companyId)
}
</script>

<template>
  <div class="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-surface-900 dark:text-surface-100">Empresas</h1>
        <p class="text-sm text-surface-500 dark:text-surface-400">Gerencie empresas e acompanhe pipeline por cliente.</p>
      </div>
      <NuxtLink
        v-if="canCreateCompany"
        :to="localePath('/dashboard/empresas/new')"
        class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 no-underline"
      >
        <Plus class="size-4" />
        Nova empresa
      </NuxtLink>
    </div>

    <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
      <label class="relative block">
        <Search class="absolute left-3 top-2.5 size-4 text-surface-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nome da empresa"
          class="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 pl-9 pr-3 py-2 text-sm text-surface-900 dark:text-surface-100"
        />
      </label>
    </div>

    <div v-if="status === 'pending'" class="text-sm text-surface-500">Carregando empresas...</div>

    <div v-else-if="companies.length === 0" class="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-8 text-center">
      <Building2 class="mx-auto size-8 text-surface-400" />
      <p class="mt-3 text-sm text-surface-500">Nenhuma empresa encontrada.</p>
      <button
        type="button"
        class="mt-3 inline-flex items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm"
        @click="refresh()"
      >
        Atualizar
      </button>
    </div>

    <div v-else class="space-y-3">
      <article
        v-for="item in companies"
        :key="item.id"
        role="link"
        tabindex="0"
        class="block cursor-pointer rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-5 py-4 no-underline hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-sm transition-all"
        @click="goToCompany(item.id)"
        @keydown="(event) => handleCardKeydown(event, item.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">{{ item.name }}</h2>
            <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
              {{ getCompanyContactInfo(item) }}
              <span> | </span>
              <a
                v-if="getCompanyEmail(item)"
                :href="`mailto:${getCompanyEmail(item)}`"
                class="text-brand-600 hover:underline dark:text-brand-400"
                @click.stop
              >
                {{ getCompanyEmail(item) }}
              </a>
              <span v-else>Sem email</span>
            </p>
          </div>
          <span
            class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            :class="item.isActive ? 'bg-success-100 text-success-700 dark:bg-success-950/50 dark:text-success-300' : 'bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-300'"
          >
            {{ item.isActive ? 'Ativa' : 'Inativa' }}
          </span>
        </div>

        <div class="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div
            v-for="metric in companyMetricConfig"
            :key="metric.key"
            class="rounded-lg px-2 py-1.5 text-center"
            :class="metric.bgColor"
          >
            <p class="text-sm font-bold tabular-nums" :class="metric.textColor">
              {{ getMetricValue(item, metric.key) }}
            </p>
            <p class="text-[10px] font-medium text-surface-500 dark:text-surface-400">{{ metric.label }}</p>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
