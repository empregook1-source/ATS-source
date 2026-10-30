<script setup lang="ts">
import { AlertCircle, Download, Search } from 'lucide-vue-next'
import { onlyPhoneDigits } from '~~/shared/phone'

type ResumeListResponse = {
  items: Array<{
    id: string
    fullName: string
    email: string
    phone: string | null
    city: string | null
    updatedAt: string
  }>
  total: number
  page: number
  limit: number
}

const search = ref('')
const debouncedSearch = ref('')
const page = ref(1)
const limit = 20
const downloadingId = ref<string | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = value.trim()
    page.value = 1
  }, 300)
})

const { data, status, error, refresh } = await useFetch<ResumeListResponse>('/api/reports/resumes', {
  key: 'dashboard-reports-resumes',
  headers: useRequestHeaders(['cookie']),
  query: computed(() => ({
    page: page.value,
    limit,
    ...(debouncedSearch.value ? { search: debouncedSearch.value } : {}),
  })),
})

const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / limit)))

function getWhatsAppUrl(phone: string | null): string | null {
  const digits = onlyPhoneDigits(phone)
  if (!digits) return null

  const localDigits = digits.startsWith('55') && digits.length > 11
    ? digits.slice(2)
    : digits

  return `https://wa.me/55${localDigits}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

async function downloadPdf(id: string, fullName: string) {
  if (downloadingId.value) return
  downloadingId.value = id
  try {
    const response = await fetch(`/api/reports/resumes/${id}/pdf`)
    if (!response.ok) throw new Error(`Download failed (${response.status})`)
    const url = URL.createObjectURL(await response.blob())
    const link = document.createElement('a')
    link.href = url
    link.download = `${fullName.trim() || 'curriculo'}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('Não foi possível baixar o currículo. Tente novamente.')
  } finally {
    downloadingId.value = null
  }
}
</script>

<template>
  <div class="px-4 py-5 sm:px-6">
    <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Currículos com aceite</h3>
    <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">Currículos armazenados com consentimento do candidato.</p>

    <div class="relative mt-4">
      <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-surface-400" />
      <input
        v-model="search"
        type="search"
        placeholder="Buscar por nome, e-mail, telefone ou cidade"
        class="w-full rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 py-2.5 pl-9 pr-3.5 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      />
    </div>

    <div v-if="error" class="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-danger-200 dark:border-danger-900 bg-danger-50/70 dark:bg-danger-950/30 px-6 py-8 text-center">
      <AlertCircle class="size-5 text-danger-600 dark:text-danger-400" />
      <p class="text-sm text-danger-700 dark:text-danger-300">Não foi possível carregar os currículos.</p>
      <button
        type="button"
        class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        @click="refresh()"
      >
        Tentar novamente
      </button>
    </div>

    <div v-else class="mt-5 overflow-x-auto rounded-2xl border border-surface-200 dark:border-surface-800">
      <table class="w-full text-left text-sm">
        <thead class="bg-surface-50 dark:bg-surface-950/40 text-xs uppercase tracking-wide text-surface-500">
          <tr>
            <th class="px-4 py-3 font-medium">Nome</th>
            <th class="px-4 py-3 font-medium">E-mail</th>
            <th class="px-4 py-3 font-medium">Telefone</th>
            <th class="px-4 py-3 font-medium">Cidade</th>
            <th class="px-4 py-3 font-medium">Data</th>
            <th class="px-4 py-3 font-medium text-right">PDF</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-surface-100 dark:divide-surface-800 text-surface-800 dark:text-surface-200">
          <tr v-if="status === 'pending' && !data">
            <td colspan="6" class="px-4 py-8 text-center text-surface-500">Carregando…</td>
          </tr>
          <tr v-else-if="!data?.items.length">
            <td colspan="6" class="px-4 py-8 text-center text-surface-500">Nenhum currículo armazenado.</td>
          </tr>
          <tr v-for="item in data?.items ?? []" :key="item.id">
            <td class="px-4 py-3 font-medium whitespace-nowrap">{{ item.fullName }}</td>
            <td class="px-4 py-3">{{ item.email }}</td>
            <td class="px-4 py-3 whitespace-nowrap">
              <a
                v-if="getWhatsAppUrl(item.phone)"
                :href="getWhatsAppUrl(item.phone)!"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-[#6f3ce4] underline hover:text-[#5b2fc2]"
                title="Abrir no WhatsApp"
              >{{ item.phone }}</a>
              <span v-else>—</span>
            </td>
            <td class="px-4 py-3">{{ item.city || '—' }}</td>
            <td class="px-4 py-3 whitespace-nowrap text-surface-500">{{ formatDate(item.updatedAt) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-lg bg-[#6f3ce4] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5b2fc2] disabled:opacity-60"
                :disabled="downloadingId === item.id"
                @click="downloadPdf(item.id, item.fullName)"
              >
                <Download class="size-3.5" />
                Baixar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between text-sm text-surface-500">
      <span>Página {{ page }} de {{ totalPages }} — {{ data?.total ?? 0 }} currículos</span>
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 disabled:opacity-50"
          :disabled="page <= 1"
          @click="page--"
        >
          Anterior
        </button>
        <button
          type="button"
          class="rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 disabled:opacity-50"
          :disabled="page >= totalPages"
          @click="page++"
        >
          Próxima
        </button>
      </div>
    </div>
  </div>
</template>
