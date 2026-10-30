<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <div class="min-h-screen bg-white text-slate-900 dark:bg-[#080b10] dark:text-slate-100">
    <PublicNavBar />

    <main class="mx-auto max-w-3xl px-4 py-8 pt-28 sm:px-6">
      <slot />
    </main>

    <footer class="mt-12 border-t border-slate-200 dark:border-white/10">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        <p class="text-center text-xs text-slate-400">
          Powered by
          <NuxtLink :to="localePath('/')" class="underline hover:text-slate-600 dark:hover:text-slate-300">
            Emprego OK labs
          </NuxtLink>
        </p>
        <p class="mt-1 text-center"><SourceCodeLink /></p>
      </div>
    </footer>
  </div>
</template>
