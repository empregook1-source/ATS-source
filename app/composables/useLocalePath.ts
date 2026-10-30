export function useLocalePath() {
  const app = useNuxtApp();
  return app.$localePath;
}

