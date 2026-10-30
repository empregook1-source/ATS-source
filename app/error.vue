<script setup lang="ts">
import type { NuxtError } from '#app'
import { ArrowLeft, WifiOff } from 'lucide-vue-next'

const props = defineProps({
  error: Object as () => NuxtError,
})

const localePath = useLocalePath()

const statusCode = computed(() => {
  const normalizedError = props.error as Record<string, unknown> | undefined
  const code = normalizedError?.statusCode ?? normalizedError?.status
  return typeof code === 'number' ? code : 500
})
const statusLabel = computed(() => (statusCode.value >= 500 ? 'Erro interno do servidor' : 'Página não encontrada'))

useHead({
  title: computed(() => `${statusCode.value} | EmpregoOK`),
})

async function goHome() {
  await clearError({ redirect: localePath('/') })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-surface-950 dark:text-surface-100">
    <div
      class="pointer-events-none absolute top-[-42%] left-1/2 h-[920px] w-[1080px] -translate-x-1/2 rounded-full opacity-[0.2]"
      style="background: radial-gradient(ellipse at center, var(--color-brand-500), transparent 70%)"
    />
    <div
      class="pointer-events-none absolute left-[-12rem] top-[35%] h-[24rem] w-[24rem] rounded-full opacity-20 blur-3xl"
      style="background: var(--color-brand-400)"
    />
    <div
      class="pointer-events-none absolute right-[-10rem] bottom-[-8rem] h-[30rem] w-[30rem] rounded-full opacity-30 blur-3xl"
      style="background: linear-gradient(120deg, var(--color-accent-500), var(--color-brand-400))"
    />

    <PublicNavBar />

    <main class="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 pt-28 pb-16 sm:pt-32">
      <section
        class="mx-auto w-full max-w-3xl rounded-3xl border border-brand-300/30 bg-white/95 p-7 text-center shadow-xl backdrop-blur-sm dark:border-surface-700 dark:bg-surface-900/95 sm:p-10"
      >
        <div class="mx-auto inline-flex rounded-2xl border border-brand-300/40 bg-brand-500/10 p-4 text-brand-500">
          <WifiOff class="h-10 w-10 sm:h-12 sm:w-12" />
        </div>

        <p class="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-brand-700 dark:text-brand-200">
          {{ statusCode }} · {{ statusLabel }}
        </p>

        <h1 class="mt-3 text-2xl font-semibold tracking-tight text-slate-900 dark:text-surface-100 sm:text-3xl">
          Ops! parece que algo deu errado
        </h1>

        <p class="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-surface-300 sm:text-base">
          Não se preocupe, o sistema está bem e as vagas estão salvas para você se candidatar
        </p>

        <div class="mt-8">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500"
            @click="goHome"
          >
            <ArrowLeft class="h-4 w-4" />
            Voltar para a página principal
          </button>
        </div>
      </section>
    </main>
  </div>
</template>
