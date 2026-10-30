<script setup lang="ts">
import { ArrowLeft, User, Briefcase, Calendar, Clock, Hash, FileText, MessageSquare } from 'lucide-vue-next'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'
import { useDocuments } from '~/composables/useDocuments'
import { formatPhoneMask, onlyPhoneDigits } from '~~/shared/phone'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const applicationId = route.params.id as string
const { handlePreviewReadOnlyError } = usePreviewReadOnly()
const toast = useToast()

const { application, status: fetchStatus, error, updateApplication } = useApplication(applicationId)
const { downloadDocument, getPreviewUrl } = useDocuments()

useSeoMeta({
  title: computed(() =>
    application.value
      ? `${application.value.candidate.firstName} ${application.value.candidate.lastName} → ${application.value.job.title} — Emprego OK`
      : 'Candidatura — Emprego OK',
  ),
})

// ─────────────────────────────────────────────
// Status transitions
// ─────────────────────────────────────────────
import { APPLICATION_STATUS_TRANSITIONS } from '~~/shared/status-transitions'

const transitionLabels: Record<string, string> = {
  new: 'Reabrir',
  screening: 'Mover para triagem',
  interview: 'Mover para entrevista',
  offer: 'Fazer proposta',
  hired: 'Marcar como contratado',
  rejected: 'Rejeitar',
}

const transitionClasses: Record<string, string> = {
  new: 'border border-surface-300 dark:border-surface-700 bg-white/80 dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:border-surface-400 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800',
  screening: 'bg-violet-600 text-white shadow-sm shadow-violet-900/20 hover:bg-violet-700',
  interview: 'bg-amber-600 text-white shadow-sm shadow-amber-900/20 hover:bg-amber-700',
  offer: 'bg-teal-600 text-white shadow-sm shadow-teal-900/20 hover:bg-teal-700',
  hired: 'bg-green-700 text-white shadow-sm shadow-green-900/30 hover:bg-green-800',
  rejected: 'bg-danger-600 text-white shadow-sm shadow-danger-900/20 hover:bg-danger-700',
}

const transitionDotClasses: Record<string, string> = {
  new: 'bg-surface-400 dark:bg-surface-500',
  screening: 'bg-violet-200',
  interview: 'bg-amber-200',
  offer: 'bg-teal-200',
  hired: 'bg-green-100',
  rejected: 'bg-danger-200',
}

const allowedTransitions = computed(() => {
  if (!application.value) return []
  return APPLICATION_STATUS_TRANSITIONS[application.value.status] ?? []
})

const isTransitioning = ref(false)
const showEntrevistaSidebar = ref(false)

const isDownloadingResume = ref(false)
const showResumePreview = ref(false)
const resumePreviewUrl = ref<string | null>(null)

const resumeDocument = computed(() => {
  const docs = (application.value as any)?.candidate?.documents ?? []
  return docs.find((d: any) => d?.type === 'resume') ?? null
})

function startResumeDownloadState() {
  isDownloadingResume.value = true
  setTimeout(() => {
    isDownloadingResume.value = false
  }, 5000)
}

async function handleViewResume() {
  const doc = resumeDocument.value
  if (!doc?.id) {
    toast.warning('Currículo indisponível', 'Este candidato não possui um currículo anexado.')
    return
  }

  startResumeDownloadState()

  if (doc.mimeType === 'application/pdf') {
    resumePreviewUrl.value = getPreviewUrl(doc.id)
    showResumePreview.value = true
    return
  }

  await downloadDocument(doc.id)
}

function closeResumePreview() {
  showResumePreview.value = false
  resumePreviewUrl.value = null
}

async function handleTransition(newStatus: string) {
  isTransitioning.value = true
  try {
    await updateApplication({ status: newStatus as any })
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    toast.error('Falha ao atualizar status', { message: err.data?.statusMessage, statusCode: err.data?.statusCode })
  } finally {
    isTransitioning.value = false
  }
}

// ─────────────────────────────────────────────
// Notes editing
// ─────────────────────────────────────────────

const isEditingNotes = ref(false)
const notesInput = ref('')
const isSavingNotes = ref(false)

function startEditNotes() {
  notesInput.value = application.value?.notes ?? ''
  isEditingNotes.value = true
}

async function saveNotes() {
  isSavingNotes.value = true
  try {
    await updateApplication({ notes: notesInput.value || null })
    isEditingNotes.value = false
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    toast.error('Falha ao salvar observações', { message: err.data?.statusMessage, statusCode: err.data?.statusCode })
  } finally {
    isSavingNotes.value = false
  }
}

// ─────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────

const statusBadgeClasses: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  screening: 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  interview: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  offer: 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  hired: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  rejected: 'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400',
}

function formatResponseValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value ?? '—')
}

function getGmailComposeUrl(email: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: email,
  })
  return `https://mail.google.com/mail/?${params.toString()}`
}

function getWhatsAppUrl(phone: string | null | undefined): string | null {
  const digits = onlyPhoneDigits(phone)
  if (!digits) return null

  const localDigits = digits.startsWith('55') && digits.length > 11
    ? digits.slice(2)
    : digits

  return `https://wa.me/55${localDigits}`
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- Back link -->
    <NuxtLink
      :to="$localePath('/dashboard/applications')"
      class="mb-4 inline-flex items-center gap-1 rounded-full border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
    >
      <ArrowLeft class="size-4" />
      Voltar para candidaturas
    </NuxtLink>

    <!-- Loading -->
    <div v-if="fetchStatus === 'pending'" class="text-center py-12 text-surface-400">
      Loading application…
    </div>

    <!-- Error / not found -->
    <div
      v-else-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700"
    >
      {{ error.statusCode === 404 ? 'Candidatura não encontrada.' : 'Falha ao carregar candidatura.' }}
      <NuxtLink :to="$localePath('/dashboard/applications')" class="underline ml-1">Voltar para candidaturas</NuxtLink>
    </div>

    <!-- Application detail -->
    <template v-else-if="application">
      <!-- Header -->
      <div class="mb-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
          Visão geral da candidatura
        </p>
        <div class="mb-2 flex flex-wrap items-center gap-2 text-surface-400">
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50 truncate">
            {{ application.candidate.firstName }} {{ application.candidate.lastName }}
          </h1>
          <span class="text-surface-400">→</span>
          <NuxtLink
            :to="$localePath(`/dashboard/jobs/${application.job.id}`)"
            class="text-xl text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 truncate transition-colors"
          >
            {{ application.job.title }}
          </NuxtLink>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="statusBadgeClasses[application.status] ?? 'bg-surface-100 text-surface-600'"
          >
            {{ application.status }}
          </span>
          <TimelineDateLink :date="application.createdAt" class="text-sm text-surface-500 dark:text-surface-400">
            Aplicado em {{ new Date(application.createdAt).toLocaleDateString() }}
          </TimelineDateLink>
        </div>
      </div>

      <!-- Acoes rapidas -->
      <div class="mb-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white/80 dark:bg-surface-900/70 p-3">
        <p class="mb-2 text-xs font-medium uppercase tracking-wide text-surface-500 dark:text-surface-400">
          Ações rápidas
        </p>
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-for="nextStatus in allowedTransitions"
            :key="nextStatus"
            :disabled="isTransitioning"
            class="inline-flex cursor-pointer items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            :class="transitionClasses[nextStatus] ?? 'border border-surface-300 dark:border-surface-700 bg-white/80 dark:bg-surface-900 text-surface-700 dark:text-surface-300 hover:border-surface-400 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800'"
            @click="handleTransition(nextStatus)"
          >
            <span
              class="mr-2 inline-flex size-1.5 rounded-full"
              :class="transitionDotClasses[nextStatus] ?? 'bg-surface-400 dark:bg-surface-500'"
            />
            {{ transitionLabels[nextStatus] ?? nextStatus }}
          </button>
          <button
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-surface-300 dark:border-surface-700 bg-white/80 dark:bg-surface-900 px-3.5 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-700 dark:hover:text-brand-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            @click="showEntrevistaSidebar = true"
          >
            <Calendar class="size-3.5" />
            Agendar entrevista
          </button>
          <button
            :disabled="isDownloadingResume"
            class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-surface-300 dark:border-surface-700 bg-white/80 dark:bg-surface-900 px-3.5 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:border-brand-400 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-700 dark:hover:text-brand-300 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            @click="handleViewResume"
          >
            <FileText class="size-3.5" />
            {{ isDownloadingResume ? 'Fazendo download...' : 'Ver currículo' }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <!-- Candidate info -->
        <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
          <div class="flex items-center gap-2 mb-3">
            <User class="size-4 text-surface-500 dark:text-surface-400" />
            <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Candidato(a)</h2>
          </div>
          <dl class="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt class="text-surface-400">Name</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                <NuxtLink
                  :to="$localePath(`/dashboard/candidates/${application.candidate.id}`)"
                  class="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  {{ application.candidate.firstName }} {{ application.candidate.lastName }}
                </NuxtLink>
              </dd>
            </div>
            <div>
              <dt class="text-surface-400">Email</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                <a
                  :href="getGmailComposeUrl(application.candidate.email)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >{{ application.candidate.email }}</a>
              </dd>
            </div>
            <div v-if="application.candidate.phone">
              <dt class="text-surface-400">Telefone</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                <a
                  v-if="getWhatsAppUrl(application.candidate.phone)"
                  :href="getWhatsAppUrl(application.candidate.phone)!"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-brand-600 dark:text-brand-400 underline underline-offset-2 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                >
                  {{ formatPhoneMask(application.candidate.phone) }}
                </a>
                <span v-else>{{ formatPhoneMask(application.candidate.phone) }}</span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Job info -->
        <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
          <div class="flex items-center gap-2 mb-3">
            <Briefcase class="size-4 text-surface-500 dark:text-surface-400" />
            <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Vaga</h2>
          </div>
          <dl class="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt class="text-surface-400">Título</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                <NuxtLink
                  :to="$localePath(`/dashboard/jobs/${application.job.id}`)"
                  class="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                  {{ application.job.title }}
                </NuxtLink>
              </dd>
            </div>
            <div>
              <dt class="text-surface-400">Status da vaga</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium capitalize">{{ application.job.status }}</dd>
            </div>
          </dl>
        </div>

        <!-- Application details -->
        <div class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 md:col-span-2">
          <div class="flex items-center gap-2 mb-3">
            <Hash class="size-4 text-surface-500 dark:text-surface-400" />
            <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Detalhes</h2>
          </div>
          <dl class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-surface-400">Score</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">{{ application.score ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-surface-400">Status</dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium capitalize">{{ application.status }}</dd>
            </div>
            <div>
              <dt class="text-surface-400 inline-flex items-center gap-1">
                <Calendar class="size-3.5" />
                Aplicado em
              </dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                <TimelineDateLink :date="application.createdAt">{{ new Date(application.createdAt).toLocaleDateString() }}</TimelineDateLink>
              </dd>
            </div>
            <div>
              <dt class="text-surface-400 inline-flex items-center gap-1">
                <Clock class="size-3.5" />
                Atualizado em
              </dt>
              <dd class="text-surface-700 dark:text-surface-200 font-medium">
                <TimelineDateLink :date="application.updatedAt">{{ new Date(application.updatedAt).toLocaleDateString() }}</TimelineDateLink>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Notes -->
      <div class="mt-4 rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5 mb-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <MessageSquare class="size-4 text-surface-500 dark:text-surface-400" />
            <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">Observações</h2>
          </div>
          <button
            v-if="!isEditingNotes"
            class="cursor-pointer text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
            @click="startEditNotes"
          >
            {{ application.notes ? 'Editar' : 'Adicionar notas' }}
          </button>
        </div>

        <div v-if="isEditingNotes">
          <textarea
            v-model="notesInput"
            rows="4"
            placeholder="Add notes about this application…"
            class="w-full rounded-lg border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
          />
          <div class="flex items-center gap-2 mt-2">
            <button
              :disabled="isSavingNotes"
              class="cursor-pointer rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="saveNotes"
            >
              {{ isSavingNotes ? 'Salvando…' : 'Salvar' }}
            </button>
            <button
              class="cursor-pointer rounded-lg border border-surface-300 dark:border-surface-600 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="isEditingNotes = false"
            >
              Cancelar
            </button>
          </div>
        </div>

        <p
          v-else-if="application.notes"
          class="text-sm text-surface-600 dark:text-surface-300 whitespace-pre-wrap"
        >
          {{ application.notes }}
        </p>
        <p v-else class="text-sm text-surface-400 italic">Ainda não há observações.</p>
      </div>

      <!-- Question Responses -->
      <div
        v-if="application.responses && application.responses.length > 0"
        class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5"
      >
        <div class="flex items-center gap-2 mb-3">
          <FileText class="size-4 text-surface-500 dark:text-surface-400" />
          <h2 class="text-sm font-semibold text-surface-700 dark:text-surface-200">
            Respostas ({{ application.responses.length }})
          </h2>
        </div>
        <div class="space-y-3">
          <div
            v-for="response in application.responses"
            :key="response.id"
            class="border-b border-surface-100 dark:border-surface-800 pb-3 last:border-0 last:pb-0"
          >
            <dt class="text-xs font-medium text-surface-500 dark:text-surface-400 mb-0.5">
              {{ response.question?.label ?? 'Unknown question' }}
            </dt>
            <dd class="text-sm text-surface-700 dark:text-surface-200">
              {{ formatResponseValue(response.value) }}
            </dd>
          </div>
        </div>
      </div>
    </template>
  </div>

  <!-- Entrevista Schedule Sidebar -->
  <InterviewScheduleSidebar
    v-if="showEntrevistaSidebar && application"
    :application-id="applicationId"
    :candidate-name="`${application.candidate.firstName} ${application.candidate.lastName}`"
    :job-title="application.job.title"
    @close="showEntrevistaSidebar = false"
    @scheduled="showEntrevistaSidebar = false"
  />

  <div
    v-if="showResumePreview && resumePreviewUrl"
    class="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
    @click="closeResumePreview"
  >
    <div
      class="w-full max-w-5xl h-[80vh] rounded-xl overflow-hidden border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 shadow-xl"
      @click.stop
    >
      <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-800">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">Currículo</p>
          <p class="text-xs text-surface-500 dark:text-surface-400 truncate">
            {{ resumeDocument?.originalFilename ?? 'PDF' }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
          @click="closeResumePreview"
        >
          Fechar
        </button>
      </div>
      <iframe :src="resumePreviewUrl" class="h-full w-full" />
    </div>
  </div>
</template>
