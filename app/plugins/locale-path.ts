export default defineNuxtPlugin(() => {
  const localePath = (to: string | { path: string }) => {
    if (typeof to === "string") return to;
    return to.path;
  };

  return {
    provide: {
      localePath,
    },
  };
});

