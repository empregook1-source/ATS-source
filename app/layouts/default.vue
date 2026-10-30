<script setup lang="ts">
const route = useRoute()

const isBlogRoute = computed(() => /^\/blog(?:\/|$)/.test(route.path))
</script>

<template>
  <div class="layout-default">
    <slot />
    <div class="py-4 text-center"><SourceCodeLink /></div>
  </div>
</template>
