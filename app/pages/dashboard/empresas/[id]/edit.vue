<script setup lang="ts">
import { ArrowLeft, Building2, Save, AlertTriangle } from 'lucide-vue-next'
import { formatPhoneMask } from '~~/shared/phone'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org', 'owner-admin-access'],
})

useSeoMeta({
  title: 'Editar empresa - Emprego OK',
})

const route = useRoute()
const localePath = useLocalePath()
const toast = useToast()
const companyId = computed(() => route.params.id as string)
const { updateCompany, deleteCompany } = useCompanies()

const { data: company, status, refresh } = useFetch(() => `/api/companies/${companyId.value}`, {
  key: computed(() => `company-edit-${companyId.value}`),
  headers: useRequestHeaders(['cookie']),
})

const isSubmitting = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

const form = ref({
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  responsibleName: '',
  description: '',
  isActive: true,
})

watch(company, (value) => {
  if (!value) return
  form.value = {
    name: value.name ?? '',
    address: value.address ?? '',
    city: value.city ?? '',
    state: value.state ?? '',
    phone: formatPhoneMask(value.phone),
    email: value.email ?? '',
    responsibleName: value.responsibleName ?? '',
    description: value.description ?? '',
    isActive: value.isActive ?? true,
  }
}, { immediate: true })

async function handleUpdate() {
  if (!form.value.name.trim()) {
    toast.error('Nome e obrigatorio')
    return
  }
  if (!form.value.email.trim()) {
    toast.error('Email e obrigatorio')
    return
  }

  isSubmitting.value = true
  try {
    await updateCompany(companyId.value, {
      name: form.value.name.trim(),
      address: form.value.address.trim() || null,
      city: form.value.city.trim() || null,
      state: form.value.state.trim() || null,
      phone: form.value.phone.trim() || null,
      email: form.value.email.trim(),
      responsibleName: form.value.responsibleName.trim() || null,
      description: form.value.description.trim() || null,
      isActive: form.value.isActive,
    })

    toast.success('Empresa atualizada com sucesso')
    await navigateTo(localePath(`/dashboard/empresas/${companyId.value}`))
  } catch (error: any) {
    toast.error('Não foi possivel atualizar a empresa', { message: error?.data?.statusMessage })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete() {
  isDeleting.value = true
  try {
    await deleteCompany(companyId.value)
    toast.success('Empresa desativada com sucesso')
    await navigateTo(localePath('/dashboard/empresas'))
  } catch (error: any) {
    toast.error('Não foi possivel deletar a empresa', { message: error?.data?.statusMessage })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
    <div class="flex items-center justify-between">
      <NuxtLink
        :to="localePath(`/dashboard/empresas/${companyId}`)"
        class="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 dark:hover:text-surface-100 no-underline"
      >
        <ArrowLeft class="size-4" />
        Voltar
      </NuxtLink>
    </div>

    <div v-if="status === 'pending'" class="text-sm text-surface-500">Carregando empresa...</div>

    <div v-else-if="!company" class="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-8 text-center">
      <p class="text-sm text-surface-500">Empresa não encontrada.</p>
      <button
        type="button"
        class="mt-3 inline-flex items-center gap-2 rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm"
        @click="refresh()"
      >
        Atualizar
      </button>
    </div>

    <template v-else>
      <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
        <div class="mb-6 flex items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <Building2 class="size-5 text-brand-500" />
            <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100">Editar empresa</h1>
          </div>

          <label class="inline-flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300">
            <span>Ativa</span>
            <button
              type="button"
              role="switch"
              :aria-checked="form.isActive"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="form.isActive ? 'bg-success-600' : 'bg-surface-300 dark:bg-surface-700'"
              @click="form.isActive = !form.isActive"
            >
              <span
                class="inline-block size-5 transform rounded-full bg-white transition-transform"
                :class="form.isActive ? 'translate-x-5' : 'translate-x-1'"
              />
            </button>
          </label>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium">Nome *</label>
            <input v-model="form.name" type="text" class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm" />
          </div>
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium">Endereço</label>
            <input v-model="form.address" type="text" class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Cidade</label>
            <input v-model="form.city" type="text" class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Estado</label>
            <input v-model="form.state" type="text" class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Telefone</label>
            <input
              v-model="form.phone"
              type="text"
              inputmode="numeric"
              maxlength="15"
              placeholder="(91) 91234-5678"
              class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm"
              @input="form.phone = formatPhoneMask(form.phone)"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Email *</label>
            <input v-model="form.email" type="email" required class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Responsável</label>
            <input v-model="form.responsibleName" type="text" class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm" />
          </div>
          <div class="md:col-span-2">
            <label class="mb-1 block text-sm font-medium">Descrição</label>
            <textarea v-model="form.description" rows="5" class="w-full rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-2 text-sm" />
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <NuxtLink
            :to="localePath(`/dashboard/empresas/${companyId}`)"
            class="inline-flex items-center rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm no-underline"
          >
            Cancelar
          </NuxtLink>
          <button
            type="button"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            @click="handleUpdate"
          >
            <Save class="size-4" />
            Atualizar cadastro
          </button>
        </div>

        <div class="mt-6 rounded-xl border border-danger-200/60 dark:border-danger-900/40 bg-danger-50/30 dark:bg-danger-950/20 p-5">
          <h3 class="text-sm font-semibold text-danger-700 dark:text-danger-400 mb-1">Zona de risco</h3>
          <p class="text-xs text-danger-600/80 dark:text-danger-400/60 mb-3">Apagar permanentemente o cadastro da empresa. Esta ação não pode ser desfeita.</p>
          <button
            class="cursor-pointer rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-700 transition-colors"
            @click="showDeleteConfirm = true"
          >
            Delete company
          </button>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showDeleteConfirm = false" />
        <div class="relative bg-white dark:bg-surface-900 rounded-2xl shadow-2xl shadow-surface-900/10 dark:shadow-black/30 ring-1 ring-surface-200/80 dark:ring-surface-700/60 p-6 max-w-sm w-full mx-4">
          <div class="mb-2 flex items-center gap-2">
            <AlertTriangle class="size-5 text-danger-600 dark:text-danger-400" />
            <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100">Delete company</h3>
          </div>
          <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
            Tem certeza que deseja deletar o cadastro da empresa <strong>{{ company?.name }}</strong>?
          </p>
          <div class="flex justify-end gap-2">
            <button
              :disabled="isDeleting"
              class="cursor-pointer rounded-lg border border-surface-300 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              @click="showDeleteConfirm = false"
            >
              Cancelar
            </button>
            <button
              :disabled="isDeleting"
              class="cursor-pointer rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              @click="handleDelete"
            >
              {{ isDeleting ? 'Deleting...' : 'Excluir' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
