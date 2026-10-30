<script setup lang="ts">
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { formatPhoneMask, onlyPhoneDigits } from '~~/shared/phone'
import { SCHOOLING_LEVELS, SCHOOLING_STATUSES, schoolingHasCourse } from '~~/shared/resume'
import { useResumeBuilderDraft } from '~/composables/useResumeBuilderDraft'

definePageMeta({
  layout: 'public',
})

const route = useRoute()
const localePath = useLocalePath()

useSeoMeta({
  title: 'Criador de currículo — Emprego OK',
  robots: 'noindex, nofollow',
})

const jobSlug = computed(() => (route.query.jobSlug as string) || '')
const returnTo = computed(() => (route.query.returnTo as string) || '')
const isReturnToJob = computed(() => {
  const to = returnTo.value
  if (!to) return false
  return to.includes('/vagas/')
})
const returnToLabel = computed(() => {
  const to = returnTo.value
  if (!to) return ''
  if (isReturnToJob.value) return 'Voltar para a vaga'
  const home = localePath('/')
  if (to === home || to.startsWith(`${home}?`)) return 'Voltar para a página inicial'
  return 'Voltar'
})

const {
  draft,
  isLoaded,
  setPersonalEmail,
  setPersonalFullName,
  setPhoto,
  clearPhoto,
  addSchooling,
  removeSchooling,
  addCourse,
  removeCourse,
  addExperience,
  removeExperience,
} = useResumeBuilderDraft()

const stepLabels = [
  'Pessoal',
  'Foto',
  'Escolar',
  'Cursos',
  'Profissional',
  'Revisão',
] as const

const stepFromQuery = computed(() => {
  const raw = route.query.step
  const n = typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN
  if (!Number.isFinite(n)) return 1
  return Math.min(stepLabels.length, Math.max(1, n))
})

const currentStep = computed<number>({
  get: () => stepFromQuery.value,
  set: (value) => {
    const next = Math.min(stepLabels.length, Math.max(1, value))
    navigateTo({
      path: localePath('/curriculo/criar'),
      query: {
        ...route.query,
        step: String(next),
      },
    }, { replace: true })
  },
})

const errors = ref<Record<string, string>>({})
const isDownloadingPdf = ref(false)
const acceptedTerms = ref(false)
const acceptedMarketing = ref(false)
const photoInputRef = ref<HTMLInputElement | null>(null)
const photoError = ref('')
const isProcessingPhoto = ref(false)

function validateStep1(): boolean {
  const nextErrors: Record<string, string> = {}
  const name = draft.value.personal.fullName.trim()
  const email = draft.value.personal.email.trim()
  const phoneDigits = onlyPhoneDigits(draft.value.personal.phone)
  const age = draft.value.personal.age.trim()
  const city = draft.value.personal.city.trim()
  const cnhCategory = draft.value.personal.cnhCategory.trim()

  if (!name) nextErrors.fullName = 'Nome completo é obrigatório'
  else if (name.split(' ').filter(Boolean).length < 2) nextErrors.fullName = 'Informe nome e sobrenome'

  if (!email) nextErrors.email = 'Email é obrigatório'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Email inválido'

  if (!phoneDigits) nextErrors.phone = 'Telefone é obrigatório'
  else if (phoneDigits.length < 10) nextErrors.phone = 'Telefone inválido'

  if (!age) nextErrors.age = 'Idade é obrigatória'
  else if (!/^\d{1,3}$/.test(age) || Number(age) < 14 || Number(age) > 99) nextErrors.age = 'Idade inválida'

  if (!city) nextErrors.city = 'Cidade/Vila é obrigatório'

  if (draft.value.personal.hasCnh && !cnhCategory) nextErrors.cnhCategory = 'Informe a categoria da CNH'

  errors.value = nextErrors
  return Object.keys(nextErrors).length === 0
}

async function handlePhotoSelected(event: Event) {
  if (!import.meta.client) return
  const input = event.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return

  photoError.value = ''

  if (!file.type.startsWith('image/')) {
    photoError.value = 'Selecione uma imagem válida'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    photoError.value = 'A imagem deve ter no máximo 5MB'
    return
  }

  isProcessingPhoto.value = true
  try {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      const loaded = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('image-load-failed'))
      })
      img.src = url
      await loaded

      const targetRatio = 3 / 4
      const sw = img.naturalWidth
      const sh = img.naturalHeight
      const sourceRatio = sw / sh

      let cropW = sw
      let cropH = sh
      let cropX = 0
      let cropY = 0

      if (sourceRatio > targetRatio) {
        cropW = Math.round(sh * targetRatio)
        cropX = Math.round((sw - cropW) / 2)
      } else if (sourceRatio < targetRatio) {
        cropH = Math.round(sw / targetRatio)
        cropY = Math.round((sh - cropH) / 2)
      }

      const outW = 300
      const outH = 400
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('no-canvas')

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH)

      const dataUrl = canvas.toDataURL('image/jpeg', 0.86)
      setPhoto({ dataUrl, mime: 'image/jpeg' })
    } finally {
      URL.revokeObjectURL(url)
    }
  } catch {
    photoError.value = 'Não foi possível processar a imagem'
  } finally {
    isProcessingPhoto.value = false
  }
}

function removePhoto() {
  clearPhoto()
  photoError.value = ''
  if (photoInputRef.value) photoInputRef.value.value = ''
}

function goNext() {
  if (currentStep.value === 1 && !validateStep1()) return
  currentStep.value = Math.min(stepLabels.length, currentStep.value + 1)
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goBack() {
  if (currentStep.value <= 1) {
    if (returnTo.value) {
      navigateTo(returnTo.value)
      return
    }
    navigateTo(localePath('/vagas'))
    return
  }
  currentStep.value = currentStep.value - 1
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goPrevStep() {
  currentStep.value = Math.max(1, currentStep.value - 1)
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function experiencePeriod(exp: { start?: string; end?: string; period?: string }): string {
  const start = (exp.start ?? '').trim()
  const end = (exp.end ?? '').trim()
  const legacy = (exp.period ?? '').trim()
  if (start || end) return `${start || '—'} até ${end || '—'}`
  return legacy
}

function resumePdfFilename(): string {
  const raw = (draft.value.personal.fullName || 'curriculo').trim()
  const safe = raw.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
  const base = safe || 'curriculo'
  return `${base}.pdf`
}

async function generateResumePdfBlob(): Promise<Blob> {
  const response = await fetch('/api/resume/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...draft.value,
      consent: { terms: acceptedTerms.value, marketing: acceptedMarketing.value },
    }),
  })
  if (!response.ok) throw new Error(`PDF generation failed (${response.status})`)
  return response.blob()
}

async function downloadPdf() {
  if (!import.meta.client || isDownloadingPdf.value || !acceptedTerms.value) return
  isDownloadingPdf.value = true
  try {
    const blob = await generateResumePdfBlob()
    const url = URL.createObjectURL(blob)
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = resumePdfFilename()
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      URL.revokeObjectURL(url)
    }

  } finally {
    isDownloadingPdf.value = false
  }
}

watch(
  () => draft.value.personal.phone,
  (value) => {
    const masked = formatPhoneMask(value)
    if (masked !== value) draft.value.personal.phone = masked
  },
)

watch(
  () => draft.value.personal.hasCnh,
  (hasCnh) => {
    if (!hasCnh) draft.value.personal.cnhCategory = ''
  },
)

watch(
  () => currentStep.value,
  () => {
    errors.value = {}
  },
)
</script>

<template>
  <div class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
    <div class="flex items-center justify-between gap-3 mb-5">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-4 py-2 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="size-4" />
        Voltar
      </button>

      <div class="text-right">
        <p class="text-[11px] uppercase tracking-wide text-surface-400">Criador de currículo</p>
        <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">Emprego OK</p>
      </div>
    </div>

    <div class="sticky top-0 z-10 -mx-4 px-4 py-3 sm:-mx-6 sm:px-6 bg-white/90 dark:bg-surface-950/90 backdrop-blur border-y border-surface-100 dark:border-surface-800 mb-6">
      <div class="flex items-center gap-2 overflow-x-auto">
        <template v-for="(label, idx) in stepLabels" :key="label">
          <button
            type="button"
            class="shrink-0 inline-flex items-center gap-2 text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :class="idx + 1 === currentStep
              ? 'rounded-full border border-[#6f3ce4] bg-[#6f3ce4] text-white px-3 py-1.5'
              : 'rounded-full px-0 py-0'"
            :aria-current="idx + 1 === currentStep ? 'step' : undefined"
            :aria-label="`Step ${idx + 1}: ${label}`"
            :disabled="idx + 1 > currentStep"
            @click="currentStep = idx + 1"
          >
            <span
              class="inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold"
              :class="idx + 1 === currentStep
                ? 'bg-white/20 text-white'
                : idx + 1 < currentStep
                  ? 'bg-[#6f3ce4] text-white'
                  : 'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-200'"
            >
              {{ idx + 1 }}
            </span>
            <span v-if="idx + 1 === currentStep" class="whitespace-nowrap">{{ label }}</span>
          </button>
          <span
            v-if="idx < stepLabels.length - 1"
            aria-hidden="true"
            class="shrink-0 px-1 text-sm font-semibold"
            :class="idx + 1 < currentStep ? 'text-[#6f3ce4]' : 'text-surface-300 dark:text-surface-700'"
          >
            -
          </span>
        </template>
      </div>
    </div>

    <div v-if="!isLoaded" class="animate-pulse space-y-4">
      <div class="h-6 w-52 bg-surface-200 dark:bg-surface-800 rounded" />
      <div class="h-4 w-72 bg-surface-200 dark:bg-surface-800 rounded" />
      <div class="h-32 w-full bg-surface-200 dark:bg-surface-800 rounded-2xl" />
    </div>

    <div v-else class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden">
      <div class="h-1 bg-gradient-to-r from-brand-500 to-brand-400" />

      <div class="p-5 sm:p-7">
        <template v-if="currentStep === 1">
          <h1 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-50">
            Olá, bem vindo(a).
          </h1>
          <p class="mt-2 text-sm text-surface-600 dark:text-surface-300">
            Vamos construir seu currículo gratuitamente.
          </p>
          <p class="mt-1 text-sm text-surface-600 dark:text-surface-300">
            Já criou o seu aqui?
            <NuxtLink :to="localePath('/curriculo/recuperar')" class="font-semibold text-[#6f3ce4] underline">Recuperar meu currículo</NuxtLink>
          </p>

          <p class="mt-6 text-sm font-semibold text-surface-900 dark:text-surface-100">
            Vamos começar por suas informações pessoais:
          </p>

          <div class="mt-4 space-y-4">
            <div>
              <label for="resume-full-name" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Nome completo
              </label>
              <input
                id="resume-full-name"
                :value="draft.personal.fullName"
                type="text"
                autocomplete="name"
                class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                placeholder="Ex.: Maria Silva"
                @input="setPersonalFullName(($event.target as HTMLInputElement).value)"
              />
              <p v-if="errors.fullName" class="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{{ errors.fullName }}</p>
            </div>

            <div>
              <label for="resume-email" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email
              </label>
              <input
                id="resume-email"
                :value="draft.personal.email"
                type="email"
                autocomplete="email"
                inputmode="email"
                class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                placeholder="ex.: maria@email.com"
                @input="setPersonalEmail(($event.target as HTMLInputElement).value)"
              />
              <p v-if="errors.email" class="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{{ errors.email }}</p>
            </div>

            <div>
              <label for="resume-phone" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Telefone
              </label>
              <input
                id="resume-phone"
                v-model="draft.personal.phone"
                type="tel"
                inputmode="numeric"
                maxlength="15"
                autocomplete="tel"
                class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                placeholder="(91) 91234-5678"
              />
              <p v-if="errors.phone" class="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{{ errors.phone }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="resume-age" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Idade
                </label>
                <input
                  id="resume-age"
                  v-model="draft.personal.age"
                  type="text"
                  inputmode="numeric"
                  maxlength="3"
                  class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  placeholder="Ex.: 28"
                />
                <p v-if="errors.age" class="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{{ errors.age }}</p>
              </div>

              <div>
                <label for="resume-city" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Cidade/Vila
                </label>
                <input
                  id="resume-city"
                  v-model="draft.personal.city"
                  type="text"
                  autocomplete="address-level2"
                  class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                  placeholder="Ex.: Belém"
                />
                <p v-if="errors.city" class="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{{ errors.city }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="resume-has-cnh" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Possui CNH?
                </label>
                <select
                  id="resume-has-cnh"
                  v-model="draft.personal.hasCnh"
                  class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                >
                  <option :value="false">Não</option>
                  <option :value="true">Sim</option>
                </select>
              </div>

              <div v-if="draft.personal.hasCnh">
                <label for="resume-cnh-category" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                  Categoria da CNH
                </label>
                <select
                  id="resume-cnh-category"
                  v-model="draft.personal.cnhCategory"
                  class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm text-surface-900 dark:text-surface-100 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                >
                  <option value="">Selecione</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="AB">AB</option>
                  <option value="AC">AC</option>
                  <option value="AD">AD</option>
                  <option value="AE">AE</option>
                </select>
                <p v-if="errors.cnhCategory" class="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{{ errors.cnhCategory }}</p>
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-7 py-3 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="goPrevStep"
            >
              Anterior
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-[#6f3ce4] px-7 py-3 text-sm font-semibold text-white hover:bg-[#5b2fc2] active:scale-[0.98] transition-all shadow-sm"
              @click="goNext"
            >
              Próximo
              <ArrowRight class="size-4" />
            </button>
          </div>
        </template>

        <template v-else-if="currentStep === 2">
          <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50">Agora vamos adicionar sua foto</h2>
          <p class="mt-2 text-sm text-surface-600 dark:text-surface-300">
            Envie uma foto no formato 3x4, ela será ajustada automaticamente caso esteja em outra proporção.
          </p>

          <div class="mt-5 grid gap-4 sm:grid-cols-[1fr_160px] sm:items-start">
            <div class="space-y-3">
              <label for="resume-photo" class="block text-sm font-medium text-surface-700 dark:text-surface-300">
                Foto (3x4)
              </label>
              <input
                id="resume-photo"
                ref="photoInputRef"
                type="file"
                accept="image/*"
                class="block w-full text-sm text-surface-700 dark:text-surface-200 file:mr-4 file:rounded-xl file:border-0 file:bg-[#6f3ce4] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#5b2fc2]"
                @change="handlePhotoSelected"
              />
              <p v-if="photoError" class="text-xs text-danger-600 dark:text-danger-400">{{ photoError }}</p>
              <p v-else class="text-xs text-surface-500 dark:text-surface-400">Tamanho máximo: 5MB</p>

              <div v-if="draft.photo" class="pt-2">
                <button
                  type="button"
                  class="text-xs font-semibold text-surface-600 hover:text-danger-600 dark:text-surface-300 dark:hover:text-danger-400 transition-colors"
                  @click="removePhoto"
                >
                  Remover foto
                </button>
              </div>
            </div>

            <div class="justify-self-start">
              <div class="text-xs font-semibold text-surface-500 mb-2">Prévia da foto</div>
              <div
                class="relative w-[120px] h-[160px] rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 overflow-hidden"
              >
                <div v-if="isProcessingPhoto" class="absolute inset-0 flex items-center justify-center text-xs text-surface-500">
                  Processando...
                </div>
                <img
                  v-else-if="draft.photo?.dataUrl"
                  :src="draft.photo.dataUrl"
                  alt="Foto 3x4"
                  class="h-full w-full object-cover"
                >
                <div v-else class="absolute inset-0 flex items-center justify-center text-xs text-surface-500">
                  Sem foto
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-7 py-3 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="goPrevStep"
            >
              Anterior
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-[#6f3ce4] px-7 py-3 text-sm font-semibold text-white hover:bg-[#5b2fc2] active:scale-[0.98] transition-all shadow-sm"
              :disabled="isProcessingPhoto"
              @click="goNext"
            >
              Próximo
              <ArrowRight class="size-4" />
            </button>
          </div>
        </template>

        <template v-else-if="currentStep === 3">
          <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50">Vamos agora cadastrar sua formação acadêmica (escola e/ou faculdade):</h2>

          <div class="mt-5 space-y-4">
            <div
              v-for="(item, idx) in draft.schooling"
              :key="item.id"
              class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4"
            >
              <div class="flex items-center justify-between gap-3 mb-3">
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  Formação {{ idx + 1 }}
                </p>
                <button
                  v-if="draft.schooling.length > 1"
                  type="button"
                  class="text-xs font-semibold text-[#720e0e] hover:opacity-80 transition-colors"
                  @click="removeSchooling(item.id)"
                >
                  Remover
                </button>
              </div>

              <div class="space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label :for="`school-title-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Escolaridade</label>
                    <select
                      :id="`school-title-${item.id}`"
                      v-model="item.title"
                      class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    >
                      <option value="" disabled>Selecione</option>
                      <option v-for="level in SCHOOLING_LEVELS" :key="level" :value="level">{{ level }}</option>
                    </select>
                  </div>
                  <div>
                    <label :for="`school-status-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Situação</label>
                    <select
                      :id="`school-status-${item.id}`"
                      v-model="item.status"
                      class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    >
                      <option value="" disabled>Selecione</option>
                      <option v-for="status in SCHOOLING_STATUSES" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                </div>
                <div v-if="schoolingHasCourse(item.title)">
                  <label :for="`school-course-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Nome do curso</label>
                  <input
                    :id="`school-course-${item.id}`"
                    v-model="item.course"
                    type="text"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Ex.: Administração"
                  />
                </div>
                <div>
                  <label :for="`school-name-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Instituição</label>
                  <input
                    :id="`school-name-${item.id}`"
                    v-model="item.school"
                    type="text"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Nome da escola"
                  />
                </div>
                <div>
                  <label :for="`school-year-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Ano de conclusão</label>
                  <label class="mb-2 inline-flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
                    <input
                      v-model="item.studying"
                      type="checkbox"
                      class="h-4 w-4 rounded border-surface-300 dark:border-surface-700 accent-brand-600"
                    />
                    Cursando
                  </label>
                  <input
                    v-if="!item.studying"
                    :id="`school-year-${item.id}`"
                    v-model="item.graduationYear"
                    type="text"
                    inputmode="numeric"
                    maxlength="4"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Ex.: 2022"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              class="w-full inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-4 py-3 text-sm font-semibold text-[#6f3ce4] hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="addSchooling"
            >
              Adicionar Nova Formação
            </button>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-7 py-3 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="goPrevStep"
            >
              Anterior
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-[#6f3ce4] px-7 py-3 text-sm font-semibold text-white hover:bg-[#5b2fc2] active:scale-[0.98] transition-all shadow-sm"
              @click="goNext"
            >
              Próximo
              <ArrowRight class="size-4" />
            </button>
          </div>
        </template>

        <template v-else-if="currentStep === 4">
          <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50">Vamos agora cadastrar seus cursos complementares:</h2>

          <div class="mt-5 space-y-4">
            <div
              v-for="(item, idx) in draft.courses"
              :key="item.id"
              class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4"
            >
              <div class="flex items-center justify-between gap-3 mb-3">
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  Curso {{ idx + 1 }}
                </p>
                <button
                  v-if="draft.courses.length > 1"
                  type="button"
                  class="text-xs font-semibold text-[#720e0e] hover:opacity-80 transition-colors"
                  @click="removeCourse(item.id)"
                >
                  Remover
                </button>
              </div>

              <div class="space-y-3">
                <div>
                  <label :for="`course-title-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Curso</label>
                  <input
                    :id="`course-title-${item.id}`"
                    v-model="item.title"
                    type="text"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Ex.: Curso de Excel, Técnico em..."
                  />
                </div>
                <div>
                  <label :for="`course-inst-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Instituição</label>
                  <input
                    :id="`course-inst-${item.id}`"
                    v-model="item.institution"
                    type="text"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Nome da instituição"
                  />
                </div>
                <div>
                  <label :for="`course-comp-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Carga horária</label>
                  <input
                    :id="`course-comp-${item.id}`"
                    v-model="item.completion"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    @input="item.completion = item.completion.replace(/\\D+/g, '')"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Ex.: 40"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              class="w-full inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-4 py-3 text-sm font-semibold text-[#6f3ce4] hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="addCourse"
            >
              Adicionar Novo Curso
            </button>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-7 py-3 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="goPrevStep"
            >
              Anterior
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-[#6f3ce4] px-7 py-3 text-sm font-semibold text-white hover:bg-[#5b2fc2] active:scale-[0.98] transition-all shadow-sm"
              @click="goNext"
            >
              Próximo
              <ArrowRight class="size-4" />
            </button>
          </div>
        </template>

        <template v-else-if="currentStep === 5">
          <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50">Vamos agora cadastrar sua experiência profissional</h2>

          <div class="mt-5 space-y-4">
            <div
              v-for="(item, idx) in draft.experiences"
              :key="item.id"
              class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-4"
            >
              <div class="flex items-center justify-between gap-3 mb-3">
                <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
                  Experiência {{ idx + 1 }}
                </p>
                <button
                  v-if="draft.experiences.length > 1"
                  type="button"
                  class="text-xs font-semibold text-[#720e0e] hover:opacity-80 transition-colors"
                  @click="removeExperience(item.id)"
                >
                  Remover
                </button>
              </div>

              <div class="space-y-3">
                <div>
                  <label :for="`exp-title-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Cargo</label>
                  <input
                    :id="`exp-title-${item.id}`"
                    v-model="item.title"
                    type="text"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Ex.: Auxiliar administrativo"
                  />
                </div>
                <div>
                  <label :for="`exp-company-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Instituição</label>
                  <input
                    :id="`exp-company-${item.id}`"
                    v-model="item.company"
                    type="text"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label :for="`exp-start-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Início</label>
                    <input
                      :id="`exp-start-${item.id}`"
                      v-model="item.start"
                      type="text"
                      class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                      placeholder="mês/ano"
                    />
                  </div>
                  <div>
                    <label :for="`exp-end-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Fim</label>
                    <input
                      :id="`exp-end-${item.id}`"
                      v-model="item.end"
                      type="text"
                      class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                      placeholder="mês/ano"
                    />
                  </div>
                </div>
                <div>
                  <label :for="`exp-activities-${item.id}`" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Atividades realizadas</label>
                  <textarea
                    :id="`exp-activities-${item.id}`"
                    v-model="item.activities"
                    rows="3"
                    class="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-3.5 py-2.5 text-sm bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                    placeholder="Descreva suas principais atividades"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              class="w-full inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-4 py-3 text-sm font-semibold text-[#6f3ce4] hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="addExperience"
            >
              Adicionar Nova Experiência
            </button>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-7 py-3 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="goPrevStep"
            >
              Anterior
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-[#6f3ce4] px-7 py-3 text-sm font-semibold text-white hover:bg-[#5b2fc2] active:scale-[0.98] transition-all shadow-sm"
              @click="goNext"
            >
              Próximo
              <ArrowRight class="size-4" />
            </button>
          </div>
        </template>

        <template v-else-if="currentStep === 6">
          <h2 class="text-lg font-bold text-surface-900 dark:text-surface-50">Pronto, finalizamos!</h2>
          <p class="mt-2 text-sm text-surface-600 dark:text-surface-300">
            Agora você pode visualizar seu currículo com suas informações, e se quiser, pode clicar em voltar e corrigir a informação que quiser ajustar.
          </p>
          <p class="mt-2 text-sm text-surface-600 dark:text-surface-300">
            Se você gostou e estiver tudo certinho, clique em baixar o currículo em PDF.
          </p>

          <div class="mt-6 space-y-4">
            <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 p-4">
              <p class="text-xs font-semibold text-surface-500 mb-2">Informações pessoais</p>

              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-sm text-surface-800 dark:text-surface-200 text-left">
                    {{ draft.personal.fullName || '—' }}
                  </p>
                  <p class="mt-0.5 text-xs text-surface-900 dark:text-surface-100">
                    {{ draft.personal.age?.trim() ? `${draft.personal.age} anos` : '—' }}
                  </p>

                  <div class="mt-6 text-sm text-surface-800 dark:text-surface-200 space-y-1">
                    <p>{{ draft.personal.city || '—' }}</p>
                    <p>{{ draft.personal.phone || '—' }}</p>
                    <p>{{ draft.personal.email || '—' }}</p>
                    <p v-if="draft.personal.hasCnh">{{ `CNH ${draft.personal.cnhCategory || '—'}` }}</p>
                  </div>
                </div>

                <div class="shrink-0">
                  <div class="w-[85px] h-[110px] rounded-lg border border-surface-200 dark:border-surface-800 bg-white/60 dark:bg-surface-950/30 overflow-hidden">
                    <img
                      v-if="draft.photo?.dataUrl"
                      :src="draft.photo.dataUrl"
                      alt="Foto 3x4"
                      class="h-full w-full object-cover"
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 p-4">
              <p class="text-xs font-semibold text-surface-500 mb-2">Formação acadêmica</p>
              <ul class="text-sm text-surface-800 dark:text-surface-200 space-y-1">
                <li v-for="i in draft.schooling" :key="i.id">
                  <span v-if="i.studying || [i.title, i.status, i.course, i.school, i.graduationYear].some(v => v.trim())">
                    {{ [i.title, i.status, schoolingHasCourse(i.title) ? i.course : '', i.school, i.studying ? 'Cursando' : i.graduationYear].map(v => v.trim()).filter(Boolean).join(' — ') }}
                  </span>
                  <span v-else>—</span>
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 p-4">
              <p class="text-xs font-semibold text-surface-500 mb-2">Cursos complementares</p>
              <ul class="text-sm text-surface-800 dark:text-surface-200 space-y-1">
                <li v-for="i in draft.courses" :key="i.id">
                  <span v-if="[i.title, i.institution, i.completion].some(v => v.trim())">
                    {{ [i.title, i.institution, i.completion.trim() ? `${i.completion.trim()} horas` : ''].map(v => v.trim()).filter(Boolean).join(' — ') }}
                  </span>
                  <span v-else>—</span>
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 p-4">
              <p class="text-xs font-semibold text-surface-500 mb-2">Experiências profissionais</p>
              <ul class="text-sm text-surface-800 dark:text-surface-200 space-y-2">
                <li v-for="i in draft.experiences" :key="i.id">
                  <div v-if="[i.title, i.company, i.start, i.end, i.period, i.activities].some(v => v.trim())">
                    <p class="font-semibold">
                      {{ [i.title, i.company].map(v => v.trim()).filter(Boolean).join(' — ') || '—' }}
                    </p>
                    <p v-if="experiencePeriod(i)" class="text-surface-600 dark:text-surface-300">{{ experiencePeriod(i) }}</p>
                    <p v-if="i.activities.trim()" class="text-surface-600 dark:text-surface-300 whitespace-pre-line">{{ i.activities.trim() }}</p>
                  </div>
                  <span v-else>—</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="mt-6 space-y-3 rounded-2xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/40 p-4">
            <label class="flex items-start gap-3 text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
              <input
                v-model="acceptedTerms"
                type="checkbox"
                class="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-300 dark:border-surface-700 accent-[#6f3ce4]"
                data-testid="resume-accept-terms"
              />
              <span>
                Li e aceito os
                <NuxtLink :to="localePath('/curriculo/termos')" target="_blank" class="font-semibold text-[#6f3ce4] underline">Termos de Uso e a Política de Privacidade</NuxtLink>.
                <span class="text-[#720e0e]">*</span>
              </span>
            </label>
            <label class="flex items-start gap-3 text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
              <input
                v-model="acceptedMarketing"
                type="checkbox"
                class="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-300 dark:border-surface-700 accent-[#6f3ce4]"
              />
              <span>
                Autorizo a Emprego OK a armazenar meu currículo e me enviar por e-mail vagas, cursos e novidades compatíveis com meu perfil. Posso cancelar quando quiser.
              </span>
            </label>
          </div>

          <div class="mt-7 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-6 py-3 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="goPrevStep"
            >
              Anterior
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-xl bg-[#6f3ce4] px-6 py-3 text-sm font-semibold text-white hover:bg-[#5b2fc2] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              :disabled="isDownloadingPdf || !acceptedTerms"
              @click="downloadPdf"
            >
              Baixar currículo em PDF
            </button>
            <button
              v-if="returnTo"
              type="button"
              class="inline-flex items-center justify-center rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-6 py-3 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="navigateTo(returnTo)"
            >
              {{ returnToLabel }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
