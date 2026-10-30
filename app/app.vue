<script setup lang="ts">
useHead({
  htmlAttrs: { lang: "en" },
  script: [
    {
      src: '/theme-init.js',
      tagPosition: 'head',
    },
  ],
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CookieConsentBanner />
  </div>
</template>
