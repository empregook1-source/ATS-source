<script setup lang="ts">
import { Check, Cookie, Settings2, ShieldCheck } from 'lucide-vue-next'
import { useCookieConsent } from '~/composables/useCookieConsent'

const localePath = useLocalePath()

const {
  preferences,
  shouldShowBanner,
  isPreferencesOpen,
  acceptAll,
  rejectOptional,
  savePreferences,
  closePreferences,
} = useCookieConsent()

const draft = reactive({
  analytics: false,
  marketing: false,
})

function syncDraftWithStoredPreferences() {
  draft.analytics = preferences.value.analytics
  draft.marketing = preferences.value.marketing
}

function openCustomize() {
  syncDraftWithStoredPreferences()
  isPreferencesOpen.value = true
}

function handleAcceptAll() {
  acceptAll()
  closePreferences()
}

function handleRejectAll() {
  rejectOptional()
  closePreferences()
}

function handleSavePreferences() {
  savePreferences({
    analytics: draft.analytics,
    marketing: draft.marketing,
  })
  closePreferences()
}

onMounted(() => {
  syncDraftWithStoredPreferences()
})

watch(
  () => [preferences.value, isPreferencesOpen.value],
  ([, isOpen]) => {
    if (!isOpen) {
      syncDraftWithStoredPreferences()
    }
  },
  { deep: true },
)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-6 opacity-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="shouldShowBanner || isPreferencesOpen"
        class="fixed inset-x-0 bottom-0 z-[120] px-4 pb-4 sm:px-6"
      >
        <div
          class="mx-auto w-full max-w-5xl overflow-hidden rounded-[28px] border border-surface-200/90 bg-white/95 p-5 shadow-2xl backdrop-blur dark:border-surface-800 dark:bg-surface-900/95 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-consent-title"
        >
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex items-start gap-3">
                <div class="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
                  <Cookie class="size-5" />
                </div>

                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <h2
                      id="cookie-consent-title"
                      class="text-base font-semibold text-surface-900 dark:text-surface-100 sm:text-lg"
                    >
                      Controle sua privacidade
                    </h2>
                    <!-- <span class="rounded-full bg-surface-100 px-2 py-0.5 text-[11px] font-medium text-surface-500 dark:bg-surface-800 dark:text-surface-400">
                      Matrix
                    </span> -->
                  </div>

                  <p class="max-w-3xl text-sm leading-6 text-surface-600 dark:text-surface-400">
                    Usamos cookies para aprimorar sua experiência de uso do sistema.
                  </p>

                  <p class="text-xs leading-5 text-surface-500 dark:text-surface-400">
                    Consulte a nossa
                    <NuxtLink
                      :to="localePath('/politica-de-privacidade')"
                      class="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      Política de privacidade
                    </NuxtLink>
                    para mais detalhes.
                  </p>
                </div>
              </div>

              <div v-if="!isPreferencesOpen" class="grid min-w-0 grid-cols-3 gap-2 sm:min-w-[320px]">
                <button
                  class="inline-flex min-w-0 items-center justify-center rounded-xl border border-surface-300 bg-white px-2 py-3 text-xs font-semibold text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800 sm:px-4 sm:text-sm"
                  @click="handleRejectAll"
                >
                  Rejeitar
                </button>
                <button
                  class="inline-flex min-w-0 items-center justify-center rounded-xl bg-slate-900 px-2 py-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-surface-100 dark:text-surface-900 dark:hover:bg-white sm:px-4 sm:text-sm"
                  @click="handleAcceptAll"
                >
                  Aceitar
                </button>
                <button
                  class="inline-flex min-w-0 items-center justify-center gap-1 rounded-xl border border-brand-300 bg-brand-50 px-2 py-3 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20 sm:gap-2 sm:px-4 sm:text-sm"
                  @click="openCustomize"
                >
                  <Settings2 class="size-3.5 shrink-0 sm:size-4" />
                  Personalizar
                </button>
              </div>
            </div>

            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-2"
              leave-active-class="transition-all duration-150 ease-in"
              leave-to-class="opacity-0 translate-y-2"
            >
              <div
                v-if="isPreferencesOpen"
                class="max-h-[55vh] space-y-4 overflow-y-auto border-t border-surface-200 pt-5 pr-1 dark:border-surface-800 sm:max-h-[28rem]"
              >
                <div class="grid gap-3">
                  <div class="rounded-2xl border border-surface-200 bg-surface-50/80 p-4 dark:border-surface-800 dark:bg-surface-950/70">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div class="space-y-1.5">
                        <div class="flex items-center gap-2">
                          <ShieldCheck class="size-4 text-emerald-600 dark:text-emerald-400" />
                          <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
                            Cookies obrigatórios
                          </h3>
                        </div>
                        <p class="text-sm leading-6 text-surface-600 dark:text-surface-400">
                          Mantém a sessão ativa, reforçam a segurança do acesso e guardam a sua escolha
                          de consentimento.
                        </p>
                      </div>

                      <div class="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <Check class="size-3.5" />
                        Sempre ativos
                      </div>
                    </div>
                  </div>

                  <label class="rounded-2xl border border-surface-200 bg-white p-4 transition-colors hover:border-surface-300 dark:border-surface-800 dark:bg-surface-950/70 dark:hover:border-surface-700">
                    <div class="flex items-start justify-between gap-4">
                      <div class="space-y-1.5">
                        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
                          Cookies opcionais de análise
                        </h3>
                        <p class="text-sm leading-6 text-surface-600 dark:text-surface-400">
                          Permitem medir desempenho de páginas, entender navegação agregada e melhorar a experiência
                          do produto.
                        </p>
                      </div>

                      <button
                        type="button"
                        :aria-pressed="draft.analytics"
                        class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors"
                        :class="draft.analytics ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-700'"
                        @click.prevent="draft.analytics = !draft.analytics"
                      >
                        <span
                          class="inline-block size-5 rounded-full bg-white shadow-sm transition-transform"
                          :class="draft.analytics ? 'translate-x-6' : 'translate-x-1'"
                        />
                      </button>
                    </div>
                  </label>

                  <label class="rounded-2xl border border-surface-200 bg-white p-4 transition-colors hover:border-surface-300 dark:border-surface-800 dark:bg-surface-950/70 dark:hover:border-surface-700">
                    <div class="flex items-start justify-between gap-4">
                      <div class="space-y-1.5">
                        <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
                          Cookies opcionais de marketing
                        </h3>
                        <p class="text-sm leading-6 text-surface-600 dark:text-surface-400">
                          Controlam futuras integrações de campanhas e atribuição publicitária que dependam de
                          armazenamento opcional no navegador.
                        </p>
                      </div>

                      <button
                        type="button"
                        :aria-pressed="draft.marketing"
                        class="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors"
                        :class="draft.marketing ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-700'"
                        @click.prevent="draft.marketing = !draft.marketing"
                      >
                        <span
                          class="inline-block size-5 rounded-full bg-white shadow-sm transition-transform"
                          :class="draft.marketing ? 'translate-x-6' : 'translate-x-1'"
                        />
                      </button>
                    </div>
                  </label>
                </div>

                <div class="flex flex-col gap-2 border-t border-surface-200 pt-4 sm:flex-row sm:justify-end dark:border-surface-800">
                  <button
                    class="inline-flex items-center justify-center rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
                    @click="closePreferences"
                  >
                    Voltar
                  </button>
                  <button
                    class="inline-flex items-center justify-center rounded-xl border border-surface-300 bg-white px-4 py-3 text-sm font-semibold text-surface-700 transition-colors hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
                    @click="handleRejectAll"
                  >
                    Rejeitar opcionais
                  </button>
                  <button
                    class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
                    @click="handleSavePreferences"
                  >
                    Salvar preferências
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
