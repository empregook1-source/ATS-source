<script setup lang="ts">
import { ArrowLeft, Building2, Save } from 'lucide-vue-next'
import { formatPhoneMask } from '~~/shared/phone'

definePageMeta({
  layout: 'dashboard',
  middleware: ['auth', 'require-org', 'owner-admin-access'],
})

useSeoMeta({
  title: 'Nova empresa — Emprego OK',
})

const localePath = useLocalePath()
const toast = useToast()
const { createCompany } = useCompanies()
const isSubmitting = ref(false)

const form = ref({
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  responsibleName: '',
  description: '',
})

async function handleSave() {
  if (!form.value.name.trim()) {
    toast.error('Nome é obrigatório')
    return
  }
  if (!form.value.email.trim()) {
    toast.error('Email é obrigatório')
    return
  }

  isSubmitting.value = true
  try {
    const created = await createCompany({
      name: form.value.name.trim(),
      address: form.value.address.trim() || undefined,
      city: form.value.city.trim() || undefined,
      state: form.value.state.trim() || undefined,
      phone: form.value.phone.trim() || undefined,
      email: form.value.email.trim(),
      responsibleName: form.value.responsibleName.trim() || undefined,
      description: form.value.description.trim() || undefined,
    })

    toast.success('Empresa criada com sucesso')
    await navigateTo(localePath(`/dashboard/empresas/${(created as any).id}`))
  } catch (error: any) {
    toast.error('Não foi possível criar a empresa', { message: error?.data?.statusMessage })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
    <div class="flex items-center justify-between">
      <NuxtLink
        :to="localePath('/dashboard/empresas')"
        class="inline-flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 dark:hover:text-surface-100 no-underline"
      >
        <ArrowLeft class="size-4" />
        Voltar
      </NuxtLink>
    </div>

    <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-6">
      <div class="mb-6 flex items-center gap-2">
        <Building2 class="size-5 text-brand-500" />
        <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100">Nova empresa</h1>
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
          :to="localePath('/dashboard/empresas')"
          class="inline-flex items-center rounded-lg border border-surface-300 dark:border-surface-700 px-4 py-2 text-sm no-underline"
        >
          Cancelar
        </NuxtLink>
        <button
          type="button"
          :disabled="isSubmitting"
          class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          @click="handleSave"
        >
          <Save class="size-4" />
          Salvar e Continuar
        </button>
      </div>
    </div>
  </div>
</template>
