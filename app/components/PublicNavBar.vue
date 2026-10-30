<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'

const localePath = useLocalePath()
const { isDark, toggle: toggleColorMode } = useColorMode()
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50">
    <div class="mx-auto mt-3 max-w-[1320px] px-4 sm:px-6">
      <div class="flex h-18 items-center justify-between rounded-full border border-slate-900/8 bg-white/55 px-4 shadow-[0_12px_50px_-30px_rgba(91,33,182,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_18px_80px_-40px_rgba(139,92,246,0.65)] sm:px-6">
        <NuxtLink :to="localePath('/')" class="flex items-center gap-3">
          <img
            src="/eagle-mascot-logo-128.png"
            alt="EmpregoOK"
            width="40"
            height="40"
            class="h-10 w-10 object-cover rounded-2xl border border-white/30 bg-white/70 shadow-[0_0_30px_rgba(139,92,246,0.22)] dark:border-white/15 dark:bg-white/[0.08]"
          >
          <div class="leading-tight">
            <p class="text-sm font-semibold tracking-[0.18em] text-slate-500 dark:text-violet-200/80">EMPREGO OK</p>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Sua agência de emprego</p>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-2">
          <a
            href="https://www.instagram.com/empregook"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            class="inline-flex size-10 items-center justify-center rounded-full border border-slate-900/8 bg-white/55 text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-white"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2" />
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </a>
          <a
            href="https://www.youtube.com/@EmpregoOk"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            class="inline-flex size-10 items-center justify-center rounded-full border border-slate-900/8 bg-white/55 text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-white"
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2.5" y="6" width="19" height="12" rx="4" stroke="currentColor" stroke-width="2" />
              <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="currentColor" />
            </svg>
          </a>
          <button
            class="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-slate-900/8 bg-white/55 text-slate-600 transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:text-white"
            :title="isDark ? 'Mudar para claro' : 'Mudar para escuro'"
            @click="toggleColorMode"
          >
            <Sun v-if="isDark" class="size-4" />
            <Moon v-else class="size-4" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
