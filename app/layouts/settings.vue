<template>
  <div class="flex min-h-screen flex-col bg-surface-50 dark:bg-surface-950">
    <!-- AppTopBar: desktop only -->
    <AppTopBar class="hidden lg:block" />
    <AppToasts />

    <div class="flex flex-1 flex-col lg:flex-row min-w-0">
      <!-- Desktop sidebar -->
      <div class="hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 z-10">
        <SettingsSidebar />
      </div>
      <!-- Mobile top nav -->
      <div class="lg:hidden sticky top-0 z-10">
        <SettingsMobileNav />
      </div>
      <!-- Page content -->
      <main class="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <slot />
        <div class="mt-8 text-center"><SourceCodeLink /></div>
      </main>
    </div>
  </div>
</template>
