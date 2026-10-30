<template>
  <div class="flex h-screen flex-col overflow-hidden bg-surface-50 dark:bg-surface-950">
    <AppTopBar />
    <AppToasts />
    <main class="relative flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <slot />
      <div class="mt-8 text-center"><SourceCodeLink /></div>
    </main>
  </div>
</template>
