<script setup lang="ts">
import {
  Save, Trash2, ArrowLeft, ExternalLink, Link2, ClipboardCopy,
} from 'lucide-vue-next'
import { z } from 'zod'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org'],
})

const route = useRoute()
const localePath = useLocalePath()
const jobId = route.params.id as string
const toast = useToast()
const { handlePreviewReadOnlyError } = usePreviewReadOnly()
const { track } = useTrack()

const { job, status: fetchStatus, error: fetchError, updateJob, deleteJob } = useJob(jobId)
const { companies } = useCompanies({ isActive: true, limit: 100 })

useSeoMeta({
  title: computed(() =>
    job.value ? `Configurações — ${job.value.title} — Emprego OK` : 'Configurações — Emprego OK',
  ),
})

// ─────────────────────────────────────────────
// Form state — synced from fetched job
// ─────────────────────────────────────────────

const form = ref({
  title: '',
  description: '',
  companyId: '',
  location: '',
  type: 'full_time' as string,
  slug: '',
  salaryMin: undefined as number | undefined,
  salaryMax: undefined as number | undefined,
  salaryCurrency: '',
  salaryUnit: '' as string,
  remoteStatus: '' as string,
  validThrough: '',
  requireResume: false,
  requireCoverLetter: false,
  autoScoreOnApply: false,
})

watch(job, (j) => {
  if (j) {
    form.value = {
      title: j.title ?? '',
      description: j.description ?? '',
      companyId: j.companyId ?? '',
      location: j.location ?? '',
      type: j.type ?? 'full_time',
      slug: j.slug ?? '',
      salaryMin: j.salaryMin ?? undefined,
      salaryMax: j.salaryMax ?? undefined,
      salaryCurrency: j.salaryCurrency ?? '',
      salaryUnit: j.salaryUnit ?? '',
      remoteStatus: j.remoteStatus ?? '',
      validThrough: j.validThrough ? new Date(j.validThrough).toISOString().split('T')[0] ?? '' : '',
      requireResume: j.requireResume ?? false,
      requireCoverLetter: j.requireCoverLetter ?? false,
      autoScoreOnApply: j.autoScoreOnApply ?? false,
    }
  }
}, { immediate: true })

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

const editSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(200, 'Título deve ter até 200 caracteres'),
  description: z.string().optional(),
  companyId: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['full_time', 'part_time', 'contract', 'internship']),
  slug: z.string().max(80).optional(),
  salaryMin: z.coerce.number().int().min(0).optional(),
  salaryMax: z.coerce.number().int().min(0).optional(),
  salaryCurrency: z.string().length(3).optional().or(z.literal('')),
  salaryUnit: z.enum(['YEAR', 'MONTH', 'HOUR']).optional().or(z.literal('')),
  remoteStatus: z.enum(['remote', 'hybrid', 'onsite']).optional().or(z.literal('')),
  validThrough: z.string().optional(),
  requireResume: z.boolean().optional(),
  requireCoverLetter: z.boolean().optional(),
  autoScoreOnApply: z.boolean().optional(),
})

const errors = ref<Record<string, string>>({})
const isSaving = ref(false)
const saved = ref(false)

async function handleSave() {
  const result = editSchema.safeParse(form.value)
  if (!result.success) {
    errors.value = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0]?.toString()
      if (field) errors.value[field] = issue.message
    }
    return
  }
  errors.value = {}
  isSaving.value = true

  try {
    const payload: Record<string, unknown> = {
      title: form.value.title,
      description: form.value.description || undefined,
      companyId: form.value.companyId || null,
      location: form.value.location || undefined,
      type: form.value.type,
      slug: form.value.slug || undefined,
      requireResume: form.value.requireResume,
      requireCoverLetter: form.value.requireCoverLetter,
      autoScoreOnApply: form.value.autoScoreOnApply,
    }

    if (form.value.salaryMin != null && form.value.salaryMin > 0) payload.salaryMin = form.value.salaryMin
    if (form.value.salaryMax != null && form.value.salaryMax > 0) payload.salaryMax = form.value.salaryMax
    if (form.value.salaryCurrency) payload.salaryCurrency = form.value.salaryCurrency
    if (form.value.salaryUnit) payload.salaryUnit = form.value.salaryUnit
    if (form.value.remoteStatus) payload.remoteStatus = form.value.remoteStatus
    if (form.value.validThrough) payload.validThrough = new Date(form.value.validThrough)

    await updateJob(payload as any)
    track('job_settings_saved', { job_id: jobId })
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    toast.error('Falha ao salvar alterações', { message: err.data?.statusMessage, statusCode: err.data?.statusCode })
  } finally {
    isSaving.value = false
  }
}

// ─────────────────────────────────────────────
// Application link
// ─────────────────────────────────────────────

const requestUrl = useRequestURL()
const applicationUrl = computed(() => {
  const base = `${requestUrl.protocol}//${requestUrl.host}`
  return `${base}/vagas/${job.value?.slug ?? jobId}/apply`
})

const linkCopied = ref(false)

async function copyApplicationLink() {
  try {
    await navigator.clipboard.writeText(applicationUrl.value)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  } catch {
    toast.info(applicationUrl.value)
  }
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

async function handleDelete() {
  isDeleting.value = true
  try {
    track('job_deleted', { job_id: jobId, source: 'settings' })
    await deleteJob()
  } catch (err: any) {
    if (handlePreviewReadOnlyError(err)) return
    toast.error('Falha ao excluir job', { message: err.data?.statusMessage, statusCode: err.data?.statusCode })
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

// ─────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────

const typeOptions = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
]

const remoteOptions = [
  { value: '', label: 'Não especificado' },
  { value: 'remote', label: 'Remoto' },
  { value: 'hybrid', label: 'Híbrido' },
  { value: 'onsite', label: 'Presencial' },
]

const salaryUnitOptions = [
  { value: '', label: 'Not specified' },
  { value: 'YEAR', label: 'Por ano' },
  { value: 'MONTH', label: 'Por mês' },
  { value: 'HOUR', label: 'Por hora' },
]
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- Loading -->
    <div v-if="fetchStatus === 'pending'" class="text-center py-12 text-surface-400">
      Carregando…
    </div>

    <!-- Error -->
    <div
      v-else-if="fetchError"
      class="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950 p-4 text-sm text-danger-700 dark:text-danger-400"
    >
      {{ fetchError.statusCode === 404 ? 'Vaga não encontrada.' : 'Falha ao carregar vaga.' }}
      <NuxtLink :to="$localePath('/dashboard/jobs')" class="underline ml-1">Voltar para vagas</NuxtLink>
    </div>

    <template v-else-if="job">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Configurações da vaga</h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
          Edite os detalhes da vaga <strong>{{ job.title }}</strong>.
        </p>
      </div>

      <form @submit.prevent="handleSave" class="space-y-8">
        <!-- ═══════════════════════════════════════ -->
        <!-- SECTION: Basic Details                   -->
        <!-- ═══════════════════════════════════════ -->
        <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
          <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100 mb-5">Detalhes básicos</h2>
          <div class="space-y-4">
            <!-- Title -->
            <div>
              <label for="settings-title" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Título <span class="text-danger-500">*</span>
              </label>
              <input
                id="settings-title"
                v-model="form.title"
                type="text"
                class="w-full rounded-lg border px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                :class="errors.title ? 'border-danger-300' : 'border-surface-300 dark:border-surface-700'"
              />
              <p v-if="errors.title" class="mt-1 text-xs text-danger-600 dark:text-danger-400">{{ errors.title }}</p>
            </div>

            <!-- Description -->
            <div>
              <label for="settings-description" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Descrição
              </label>
              <textarea
                id="settings-description"
                v-model="form.description"
                rows="6"
                placeholder="Descreva a vaga, cargo, responsabilidade e requisitos…"
                class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <!-- Location + Type row -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label for="settings-company" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Empresa
                </label>
                <select
                  id="settings-company"
                  v-model="form.companyId"
                  class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                >
                  <option value="">Sem empresa informada</option>
                  <option v-for="item in companies" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
              </div>
              <div>
                <label for="settings-location" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Localização
                </label>
                <input
                  id="settings-location"
                  v-model="form.location"
                  type="text"
                  placeholder="ex: Rua principal, 123 - centro"
                  class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label for="settings-type" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Tipo de emprego
                </label>
                <select
                  id="settings-type"
                  v-model="form.type"
                  class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                >
                  <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Remote status -->
            <div>
              <label for="settings-remote" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                Modelo de trabalho
              </label>
              <select
                id="settings-remote"
                v-model="form.remoteStatus"
                class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              >
                <option v-for="opt in remoteOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <!-- Slug -->
            <div>
              <label for="settings-slug" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                URL Slug
              </label>
              <input
                id="settings-slug"
                v-model="form.slug"
                type="text"
                placeholder="auto-generated-from-title"
                class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors font-mono text-xs"
              />
              <p class="mt-1 text-xs text-surface-400 dark:text-surface-500">
                URL pública da candidatura. Deixe em branco pra gerar automaticamente a partir do título.
              </p>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════ -->
        <!-- SECTION: Salary & Compensation           -->
        <!-- ═══════════════════════════════════════ -->
        <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
          <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100 mb-1">Salário</h2>
          <p class="text-xs text-surface-400 dark:text-surface-500 mb-5">
            Adicionar informação salarial melhora a visibilidade nas plataformas.
          </p>
          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="settings-salary-min" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Salário mínimo
                </label>
                <input
                  id="settings-salary-min"
                  v-model.number="form.salaryMin"
                  type="number"
                  min="0"
                  placeholder="ex: 5.000,00"
                  class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
              <div>
                <label for="settings-salary-max" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Salário máximo
                </label>
                <input
                  id="settings-salary-max"
                  v-model.number="form.salaryMax"
                  type="number"
                  min="0"
                  placeholder="ex: 8.000,00"
                  class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="settings-currency" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Moeda
                </label>
                <input
                  id="settings-currency"
                  v-model="form.salaryCurrency"
                  type="text"
                  maxlength="3"
                  placeholder="ex: R$, USD, EUR"
                  class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors uppercase"
                />
              </div>
              <div>
                <label for="settings-salary-unit" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                  Período de pagamento
                </label>
                <select
                  id="settings-salary-unit"
                  v-model="form.salaryUnit"
                  class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                >
                  <option v-for="opt in salaryUnitOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════ -->
        <!-- SECTION: Application Options             -->
        <!-- ═══════════════════════════════════════ -->
        <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
          <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100 mb-1">Opções da candidatura</h2>
          <p class="text-xs text-surface-400 dark:text-surface-500 mb-5">
            Controle o que seus candidatos devem fornecer quando se candidatarem.
          </p>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.requireResume"
                type="checkbox"
                class="size-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100">Currículo obrigatório</span>
                <p class="text-xs text-surface-400 dark:text-surface-500">Candidatos devem fazer upload do arquivo de currículo</p>
              </div>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.requireCoverLetter"
                type="checkbox"
                class="size-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100">Perguntar sobre a carta de apresentação</span>
                <p class="text-xs text-surface-400 dark:text-surface-500">Candidatos podem escrever uma carta de apresentação.</p>
              </div>
            </label>
            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="form.autoScoreOnApply"
                type="checkbox"
                class="size-4 rounded border-surface-300 dark:border-surface-600 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100">Avaliar automaticamente na candidatura</span>
                <p class="text-xs text-surface-400 dark:text-surface-500">Executar avaliação IA automaticamente quando candidato se candidatar</p>
              </div>
            </label>
          </div>
        </section>

        <!-- ═══════════════════════════════════════ -->
        <!-- SECTION: Listing Expiry                  -->
        <!-- ═══════════════════════════════════════ -->
        <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
          <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100 mb-1">Expiração</h2>
          <p class="text-xs text-surface-400 dark:text-surface-500 mb-5">
            Configure isso quando o post onde foi publicado a vaga expira automaticamente. 
          </p>
          <div>
            <label for="settings-valid-through" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Válido até
            </label>
            <input
              id="settings-valid-through"
              v-model="form.validThrough"
              type="date"
              class="w-full sm:w-64 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
            />
          </div>
        </section>

        <!-- ═══════════════════════════════════════ -->
        <!-- SECTION: Application Link                -->
        <!-- ═══════════════════════════════════════ -->
        <section v-if="job.status === 'open'" class="rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30 p-6">
          <div class="flex items-center gap-2 mb-2">
            <Link2 class="size-4 text-brand-600 dark:text-brand-400" />
            <h2 class="text-base font-semibold text-brand-700 dark:text-brand-300">Link da vaga</h2>
          </div>
          <p class="text-xs text-surface-600 dark:text-surface-400 mb-3">
            Compartilhe esse link com os candidator para eles se candidatarem à vaga.
          </p>
          <div class="flex items-center gap-2">
            <input
              type="text"
              readonly
              :value="applicationUrl"
              class="flex-1 rounded-lg border border-brand-200 dark:border-brand-800 bg-white dark:bg-surface-900 px-3 py-1.5 text-sm text-surface-700 dark:text-surface-300 select-all"
            />
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              @click="copyApplicationLink"
            >
              <ClipboardCopy class="size-3.5" />
              {{ linkCopied ? 'Copiado!' : 'Copiar' }}
            </button>
          </div>
        </section>

        <!-- ═══════════════════════════════════════ -->
        <!-- Save button                              -->
        <!-- ═══════════════════════════════════════ -->
        <div class="flex items-center justify-between pt-2 pb-8">
          <button
            type="submit"
            :disabled="isSaving"
            class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save class="size-4" />
            {{ saved ? 'Salvo!' : isSaving ? 'Salvando…' : 'Salvar alterações' }}
          </button>
        </div>
      </form>

      <!-- ═══════════════════════════════════════ -->
      <!-- DANGER ZONE                              -->
      <!-- ═══════════════════════════════════════ -->
      <section class="rounded-xl border border-danger-200 dark:border-danger-800/60 bg-danger-50/50 dark:bg-danger-950/20 p-6 mb-12">
        <h2 class="text-base font-semibold text-danger-700 dark:text-danger-400 mb-1">Zona de risco</h2>
        <p class="text-xs text-surface-500 dark:text-surface-400 mb-4">
          Deletar essa vaga permanentemente e todas as candidaturas associadas.
        </p>

        <div v-if="!showDeleteConfirm">
          <button
            type="button"
            class="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-danger-300 dark:border-danger-700 px-4 py-2 text-sm font-medium text-danger-700 dark:text-danger-400 hover:bg-danger-100 dark:hover:bg-danger-950/40 transition-colors"
            @click="showDeleteConfirm = true"
          >
            <Trash2 class="size-4" />
            Excluir esta vaga
          </button>
        </div>

        <div v-else class="rounded-lg border border-danger-300 dark:border-danger-700 bg-white dark:bg-surface-900 p-4">
          <p class="text-sm text-surface-700 dark:text-surface-300 mb-3">
            Tem certeza que deseja excluir <strong>{{ job.title }}</strong>? This will also delete all associated applications. Esta acao não pode ser desfeita.
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="isDeleting"
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleDelete"
            >
              {{ isDeleting ? 'Excluindo…' : 'Sim, excluir' }}
            </button>
            <button
              type="button"
              :disabled="isDeleting"
              class="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="showDeleteConfirm = false"
            >
              Cancelar
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
