<script setup lang="ts">
import { ArrowLeft, Briefcase, Users, Pencil, MapPin, Phone, Mail, UserRound, FileText, Copy, Check } from 'lucide-vue-next'
import { formatPhoneMask } from '~~/shared/phone'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const localePath = useLocalePath()
const { allowed: canEditCompany } = usePermission({ company: ['update'] })
const companyId = computed(() => route.params.id as string)
const activeTab = ref<'jobs' | 'candidates'>('jobs')

const { data: company, status, refresh } = useFetch(() => `/api/companies/${companyId.value}`, {
  key: computed(() => `company-${companyId.value}`),
  headers: useRequestHeaders(['cookie']),
})

const metrics = computed(() => company.value?.metrics ?? {
  activeJobs: 0,
  inactiveJobs: 0,
  totalApplications: 0,
  totalHired: 0,
  totalRejected: 0,
})

const emailCopied = ref(false)

const companyAddress = computed(() => {
  const parts = [company.value?.address, company.value?.city, company.value?.state]
    .filter((part): part is string => Boolean(part && part.trim()))
  return parts.join(', ')
})

const companyPhone = computed(() => formatPhoneMask(company.value?.phone))

async function copyCompanyEmail() {
  const email = company.value?.email
  if (!email) return
  try {
    await navigator.clipboard.writeText(email)
    emailCopied.value = true
    setTimeout(() => {
      emailCopied.value = false
    }, 2000)
  } catch {
    emailCopied.value = false
  }
}

const jobs = computed(() => company.value?.jobs ?? [])
const candidates = computed(() => company.value?.candidates ?? [])
const recentJobs = computed(() => company.value?.recentJobs ?? [])
const recentCandidates = computed(() => company.value?.recentCandidates ?? [])

const JOB_STATUS_OPTIONS = ['draft', 'open', 'closed', 'archived'] as const
type JobStatus = typeof JOB_STATUS_OPTIONS[number]

const APPLICATION_STATUS_OPTIONS = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const
type ApplicationStatus = typeof APPLICATION_STATUS_OPTIONS[number]

const selectedJobStatus = ref<'all' | JobStatus>('all')
const selectedCandidateStatus = ref<'all' | ApplicationStatus>('all')

const jobStatusLabels: Record<JobStatus, string> = {
  draft: 'Rascunho',
  open: 'Aberto',
  closed: 'Fechado',
  archived: 'Arquivado',
}

const applicationStatusLabels: Record<ApplicationStatus, string> = {
  new: 'Novo',
  screening: 'Triagem',
  interview: 'Entrevista',
  offer: 'Talentos',
  hired: 'Contratado',
  rejected: 'Rejeitado',
}

const jobStatusBadgeClasses: Record<JobStatus, string> = {
  draft: 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400',
  open: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400',
  closed: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
  archived: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
}

const jobStatusDotClasses: Record<JobStatus, string> = {
  draft: 'bg-surface-400 dark:bg-surface-500',
  open: 'bg-success-500',
  closed: 'bg-warning-500',
  archived: 'bg-surface-400 dark:bg-surface-500',
}

const applicationStatusBadgeClasses: Record<ApplicationStatus, string> = {
  new: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  screening: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  interview: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  offer: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  hired: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  rejected: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
}

const applicationStatusDotClasses: Record<ApplicationStatus, string> = {
  new: 'bg-blue-500',
  screening: 'bg-violet-500',
  interview: 'bg-amber-500',
  offer: 'bg-teal-500',
  hired: 'bg-green-600',
  rejected: 'bg-surface-400 dark:bg-surface-500',
}

const filteredJobs = computed(() => {
  if (selectedJobStatus.value === 'all') return jobs.value
  return jobs.value.filter(item => item.status === selectedJobStatus.value)
})

const filteredCandidates = computed(() => {
  if (selectedCandidateStatus.value === 'all') return candidates.value
  return candidates.value.filter(item => item.applicationStatus === selectedCandidateStatus.value)
})
</script>

<template>
  <div class="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
    <NuxtLink
      :to="localePath('/dashboard/empresas')"
      class="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 dark:hover:text-surface-100 no-underline"
    >
      <ArrowLeft class="size-4" />
      Voltar para empresas
    </NuxtLink>

    <div v-if="status === 'pending'" class="text-sm text-surface-500">Carregando detalhes da empresa...</div>

    <div v-else-if="!company" class="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-8 text-center">
      <p class="text-sm text-surface-500">Empresa não encontrada.</p>
      <button
        type="button"
        class="mt-3 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm"
        @click="refresh()"
      >
        Tentar novamente
      </button>
    </div>

    <template v-else>
      <header class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-surface-900 dark:text-surface-100">{{ company.name }}</h1>
          <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">{{ company.city }} {{ company.state }}</p>
        </div>
        <NuxtLink
          v-if="canEditCompany"
          :to="localePath(`/dashboard/empresas/${company.id}/edit`)"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 no-underline"
        >
          <Pencil class="size-4" />
          Editar
        </NuxtLink>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
          <p class="text-xs text-surface-500">Informações da empresa</p>
          <div class="mt-3 space-y-3">
            <div class="flex items-start gap-2">
              <MapPin class="mt-0.5 size-4 text-surface-400" />
              <div class="min-w-0">
                <p class="text-[11px] uppercase tracking-wide text-surface-400">Endereço</p>
                <p class="text-sm text-surface-700 dark:text-surface-200">{{ companyAddress || 'Sem endereço informado' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Phone class="mt-0.5 size-4 text-surface-400" />
              <div class="min-w-0">
                <p class="text-[11px] uppercase tracking-wide text-surface-400">Telefone</p>
                <p class="text-sm text-surface-700 dark:text-surface-200">{{ companyPhone || 'Sem telefone informado' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <Users class="mt-0.5 size-4 text-surface-400" />
              <div class="min-w-0">
                <p class="text-[11px] uppercase tracking-wide text-surface-400">Contato</p>
                <p class="text-sm text-surface-700 dark:text-surface-200">{{ companyPhone || company.email || 'Sem contato informado' }}</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <UserRound class="mt-0.5 size-4 text-surface-400" />
              <div class="min-w-0">
                <p class="text-[11px] uppercase tracking-wide text-surface-400">Nome do responsável</p>
                <p class="text-sm text-surface-700 dark:text-surface-200">{{ company.responsibleName || 'Sem responsável informado' }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
          <p class="text-xs text-surface-500">Dados adicionais</p>
          <div class="mt-3 space-y-3">
            <div class="flex items-start gap-2">
              <Mail class="mt-0.5 size-4 text-surface-400" />
              <div class="min-w-0 flex-1">
                <p class="text-[11px] uppercase tracking-wide text-surface-400">Email</p>
                <a
                  v-if="company.email"
                  :href="`mailto:${company.email}`"
                  class="inline-flex text-sm text-brand-600 hover:underline dark:text-brand-400 break-all"
                >
                  {{ company.email }}
                </a>
                <p v-else class="text-sm text-surface-700 dark:text-surface-200">Sem email informado</p>
              </div>
              <button
                v-if="company.email"
                type="button"
                class="inline-flex items-center gap-1 rounded-md border border-surface-200 dark:border-surface-700 px-2 py-1 text-xs text-surface-600 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-800"
                @click="copyCompanyEmail"
              >
                <Check v-if="emailCopied" class="size-3.5" />
                <Copy v-else class="size-3.5" />
                {{ emailCopied ? 'Copiado!' : 'Copiar' }}
              </button>
            </div>
            <div class="flex items-start gap-2">
              <FileText class="mt-0.5 size-4 text-surface-400" />
              <div class="min-w-0">
                <p class="text-[11px] uppercase tracking-wide text-surface-400">Observações</p>
                <p class="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap">{{ company.description || 'Sem observações' }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
          <p class="text-xs text-surface-500">Vagas ativas</p>
          <p class="mt-1 text-xl font-semibold">{{ metrics.activeJobs }}</p>
        </div>
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
          <p class="text-xs text-surface-500">Vagas inativas</p>
          <p class="mt-1 text-xl font-semibold">{{ metrics.inactiveJobs }}</p>
        </div>
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
          <p class="text-xs text-surface-500">Candidaturas</p>
          <p class="mt-1 text-xl font-semibold">{{ metrics.totalApplications }}</p>
        </div>
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
          <p class="text-xs text-surface-500">Contratados</p>
          <p class="mt-1 text-xl font-semibold">{{ metrics.totalHired }}</p>
        </div>
        <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
          <p class="text-xs text-surface-500">Rejeitados</p>
          <p class="mt-1 text-xl font-semibold">{{ metrics.totalRejected }}</p>
        </div>
      </section>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section class="xl:col-span-2 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
          <div class="border-b border-surface-200 dark:border-surface-800 px-4 py-3 flex items-center gap-2">
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-sm"
              :class="activeTab === 'jobs' ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : 'text-surface-500'"
              @click="activeTab = 'jobs'"
            >
              Vagas
            </button>
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-sm"
              :class="activeTab === 'candidates' ? 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300' : 'text-surface-500'"
              @click="activeTab = 'candidates'"
            >
              Candidatos
            </button>
          </div>

          <div class="border-b border-surface-200 dark:border-surface-800 px-4 py-3">
            <div v-if="activeTab === 'jobs'" class="flex items-center gap-2">
              <label for="company-jobs-status-filter" class="text-xs text-surface-500 dark:text-surface-400">Status:</label>
              <select
                id="company-jobs-status-filter"
                v-model="selectedJobStatus"
                class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2.5 py-1.5 text-xs text-surface-700 dark:text-surface-300"
              >
                <option value="all">Todos</option>
                <option v-for="statusOption in JOB_STATUS_OPTIONS" :key="statusOption" :value="statusOption">
                  {{ jobStatusLabels[statusOption] }}
                </option>
              </select>
            </div>

            <div v-else class="flex items-center gap-2">
              <label for="company-candidates-status-filter" class="text-xs text-surface-500 dark:text-surface-400">Status:</label>
              <select
                id="company-candidates-status-filter"
                v-model="selectedCandidateStatus"
                class="rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-2.5 py-1.5 text-xs text-surface-700 dark:text-surface-300"
              >
                <option value="all">Todos</option>
                <option v-for="statusOption in APPLICATION_STATUS_OPTIONS" :key="statusOption" :value="statusOption">
                  {{ applicationStatusLabels[statusOption] }}
                </option>
              </select>
            </div>
          </div>

          <div v-if="activeTab === 'jobs'" class="divide-y divide-surface-200 dark:divide-surface-800">
            <NuxtLink
              v-for="item in filteredJobs"
              :key="item.id"
              :to="localePath(`/dashboard/jobs/${item.id}`)"
              class="flex items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-surface-50 dark:hover:bg-surface-800/50"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{{ item.title }}</p>
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                    :class="jobStatusBadgeClasses[item.status as JobStatus] ?? 'bg-surface-100 text-surface-600'"
                  >
                    <span class="size-1.5 rounded-full" :class="jobStatusDotClasses[item.status as JobStatus] ?? 'bg-surface-400'" />
                    {{ jobStatusLabels[item.status as JobStatus] ?? item.status }}
                  </span>
                </div>
                <p class="text-xs text-surface-500">{{ item.location || 'Sem local definido' }}</p>
              </div>
            </NuxtLink>
            <div v-if="filteredJobs.length === 0" class="px-4 py-6 text-sm text-surface-500">Nenhum job vinculado para o status selecionado.</div>
          </div>

          <div v-else class="divide-y divide-surface-200 dark:divide-surface-800">
            <NuxtLink
              v-for="item in filteredCandidates"
              :key="item.id"
              :to="localePath(`/dashboard/candidates/${item.id}`)"
              class="flex items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-surface-50 dark:hover:bg-surface-800/50"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                    {{ item.firstName }} {{ item.lastName }}
                  </p>
                  <span
                    v-if="item.applicationStatus"
                    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                    :class="applicationStatusBadgeClasses[item.applicationStatus as ApplicationStatus] ?? 'bg-surface-100 text-surface-600'"
                  >
                    <span class="size-1.5 rounded-full" :class="applicationStatusDotClasses[item.applicationStatus as ApplicationStatus] ?? 'bg-surface-400'" />
                    {{ applicationStatusLabels[item.applicationStatus as ApplicationStatus] ?? item.applicationStatus }}
                  </span>
                </div>
                <p class="text-xs text-surface-500">{{ item.email }}</p>
              </div>
            </NuxtLink>
            <div v-if="filteredCandidates.length === 0" class="px-4 py-6 text-sm text-surface-500">Nenhum candidato vinculado para o status selecionado.</div>
          </div>
        </section>

        <aside class="space-y-4">
          <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
            <div class="mb-3 flex items-center gap-2">
              <Briefcase class="size-4 text-surface-500" />
              <h2 class="text-sm font-semibold">Vagas recentes</h2>
            </div>
            <div class="space-y-2">
              <NuxtLink
                v-for="item in recentJobs"
                :key="item.id"
                :to="localePath(`/dashboard/jobs/${item.id}`)"
                class="block rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2 text-sm no-underline hover:border-brand-300 dark:hover:border-brand-700"
              >
                {{ item.title }}
              </NuxtLink>
              <p v-if="recentJobs.length === 0" class="text-xs text-surface-500">Sem vagas recentes.</p>
            </div>
          </section>

          <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4">
            <div class="mb-3 flex items-center gap-2">
              <Users class="size-4 text-surface-500" />
              <h2 class="text-sm font-semibold">Candidatos recentes</h2>
            </div>
            <div class="space-y-2">
              <NuxtLink
                v-for="item in recentCandidates"
                :key="item.id"
                :to="localePath(`/dashboard/candidates/${item.id}`)"
                class="block rounded-lg border border-surface-200 dark:border-surface-800 px-3 py-2 text-sm no-underline hover:border-brand-300 dark:hover:border-brand-700"
              >
                {{ item.firstName }} {{ item.lastName }}
              </NuxtLink>
              <p v-if="recentCandidates.length === 0" class="text-xs text-surface-500">Sem candidatos recentes.</p>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
