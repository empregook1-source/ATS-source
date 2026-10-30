<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

definePageMeta({
  layout: 'public',
})

useSeoMeta({
  title: 'Recuperar meu currículo — Emprego OK',
  robots: 'noindex, nofollow',
})

const localePath = useLocalePath()

const fullName = ref('')
const email = ref('')
const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const errorMessage = ref('')

async function submit() {
  if (status.value === 'sending') return
  status.value = 'sending'
  errorMessage.value = ''
  try {
    await $fetch('/api/resume/recover', {
      method: 'POST',
      body: { fullName: fullName.value, email: email.value },
    })
    status.value = 'sent'
  } catch (error: any) {
    status.value = 'error'
    errorMessage.value = error?.statusCode === 429
      ? 'Muitas solicitações. Tente novamente em alguns minutos.'
      : 'Confira o nome e o e-mail e tente novamente.'
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-10">
    <NuxtLink
      :to="localePath('/curriculo/criar')"
      class="mb-5 inline-flex items-center gap-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-4 py-2 text-sm font-semibold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
    >
      <ArrowLeft class="size-4" />
      Voltar
    </NuxtLink>

    <div class="rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-sm overflow-hidden">
      <div class="h-1 bg-gradient-to-r from-brand-500 to-brand-400" />

      <div class="p-5 sm:p-7">
        <h1 class="text-xl sm:text-2xl font-bold text-surface-900 dark:text-surface-50">
          Recuperar meu currículo
        </h1>

        <template v-if="status === 'sent'">
          <p class="mt-4 text-sm text-surface-600 dark:text-surface-300">
            Se encontrarmos um currículo com esses dados, ele será enviado para <strong>{{ email }}</strong> em alguns minutos.
            Confira também a caixa de spam.
          </p>
          <NuxtLink
            :to="localePath('/curriculo/criar')"
            class="mt-6 inline-flex items-center justify-center rounded-xl bg-[#6f3ce4] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Criar ou atualizar currículo
          </NuxtLink>
        </template>

        <form v-else class="mt-4 space-y-4" @submit.prevent="submit">
          <p class="text-sm text-surface-600 dark:text-surface-300">
            Informe o nome completo e o e-mail usados ao criar o currículo. Vamos enviar o PDF para esse e-mail.
          </p>

          <div>
            <label for="recover-name" class="block text-sm font-semibold text-surface-900 dark:text-surface-100">Nome completo</label>
            <input
              id="recover-name"
              v-model="fullName"
              type="text"
              required
              minlength="2"
              maxlength="200"
              autocomplete="name"
              class="mt-1 w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:border-[#6f3ce4] focus:outline-none"
            >
          </div>

          <div>
            <label for="recover-email" class="block text-sm font-semibold text-surface-900 dark:text-surface-100">E-mail</label>
            <input
              id="recover-email"
              v-model="email"
              type="email"
              required
              maxlength="254"
              autocomplete="email"
              class="mt-1 w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-950 px-4 py-2.5 text-sm text-surface-900 dark:text-surface-100 focus:border-[#6f3ce4] focus:outline-none"
            >
          </div>

          <p v-if="status === 'error'" class="text-sm text-red-600 dark:text-red-400">{{ errorMessage }}</p>

          <button
            type="submit"
            :disabled="status === 'sending'"
            class="inline-flex w-full items-center justify-center rounded-xl bg-[#6f3ce4] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {{ status === 'sending' ? 'Enviando…' : 'Enviar meu currículo por e-mail' }}
          </button>

          <p class="text-xs text-surface-500 dark:text-surface-400">
            Só é possível recuperar currículos salvos com a autorização de armazenamento marcada.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
