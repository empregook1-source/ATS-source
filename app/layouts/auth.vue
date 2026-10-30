<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'

const localePath = useLocalePath()
const router = useRouter()

async function handleBack() {
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  await navigateTo(localePath('/'))
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4 relative">
    <div class="w-full max-w-[540px]">
      <button
        type="button"
        class="mb-3 inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 transition-colors"
        @click="handleBack"
      >
        <ArrowLeft class="size-4" />
        Voltar
      </button>

      <div class="bg-white dark:bg-surface-900 rounded-lg shadow-sm dark:shadow-none dark:border dark:border-surface-800 p-8">
        <div class="text-center mb-8">
          <div class="flex justify-center mb-3">
            <img src="/eagle-mascot-logo.png" alt="Matrix mascot" class="size-16 object-contain" />
          </div>
          <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">Matrix</h1>
          <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">Sistema de recrutamento da Emprego OK</p>
        </div>
        <slot />
      </div>
      <div class="mt-3 text-center"><SourceCodeLink /></div>
    </div>
  </div>
</template>
