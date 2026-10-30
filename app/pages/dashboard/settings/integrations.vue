<script setup lang="ts">
import {
  Calendar, Check, X, AlertTriangle, ExternalLink, Loader2,
  RefreshCw, Unplug, Shield, Clock,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'require-org', 'settings-access'],
})

useSeoMeta({
  title: 'Integrações — Emprego OK',
  description: 'Conectar com serviços externos para melhorar seu fluxo de recrutamento.',
})

const route = useRoute()
const { calendarStatus, isConnected, isAvailable, connect, disconnect, refresh, status } = useCalendarIntegration()

const isDisconnecting = ref(false)
const showDisconnectConfirm = ref(false)

// Handle OAuth callback query params
const successMessage = ref('')
const errorMessage = ref('')

onMounted(() => {
  const success = route.query.success as string | undefined
  const error = route.query.error as string | undefined

  if (success === 'connected') {
    successMessage.value = 'Google Calendar connected successfully! Your interviews will now sync automatically.'
    refresh()
  }
  else if (error === 'consent_denied') {
    errorMessage.value = 'Calendar connection was cancelled. You can try again anytime.'
  }
  else if (error === 'oauth_failed') {
    errorMessage.value = 'Falha ao conectar Google Calendar. Tente novamente.'
  }

  // Clear query params after reading
  if (success || error) {
    const newQuery = { ...route.query }
    delete newQuery.success
    delete newQuery.error
    navigateTo({ query: newQuery }, { replace: true })
  }
})

async function handleDisconnect() {
  isDisconnecting.value = true
  try {
    await disconnect()
    showDisconnectConfirm.value = false
    successMessage.value = 'Google Calendar disconnected.'
  }
  catch {
    errorMessage.value = 'Falha ao desconectar. Tente novamente.'
  }
  finally {
    isDisconnecting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
        Integrações
      </h1>
      <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
        Conectar com serviços externos para melhorar seu fluxo de recrutamento.
      </p>
    </div>

    <!-- Success/Error Messages -->
    <Transition name="fade">
      <div
        v-if="successMessage"
        class="mb-4 flex items-center gap-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3"
      >
        <Check class="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <p class="text-sm text-emerald-700 dark:text-emerald-300 flex-1">
          {{ successMessage }}
        </p>
        <button
          class="text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-200"
          @click="successMessage = ''"
        >
          <X class="size-4" />
        </button>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="errorMessage"
        class="mb-4 flex items-center gap-3 rounded-lg border border-danger-200 dark:border-danger-900 bg-danger-50 dark:bg-danger-950/30 px-4 py-3"
      >
        <AlertTriangle class="size-4 text-danger-500 shrink-0" />
        <p class="text-sm text-danger-700 dark:text-danger-300 flex-1">
          {{ errorMessage }}
        </p>
        <button
          class="text-danger-400 hover:text-danger-600 dark:hover:text-danger-200"
          @click="errorMessage = ''"
        >
          <X class="size-4" />
        </button>
      </div>
    </Transition>

    <!-- Google Calendar Integration Card -->
    <div class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center gap-4 px-4 sm:px-6 py-5 border-b border-surface-100 dark:border-surface-800">
        <div class="flex items-center justify-center size-10 rounded-lg bg-brand-50 dark:bg-brand-950/40">
          <Calendar class="size-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">
            Google Agenda
          </h2>
          <p class="text-sm text-surface-500 dark:text-surface-400">
            Sincronização bidirecional para agendamento de entrevistas
          </p>
        </div>

        <!-- Status Badge -->
        <div
          v-if="isConnected"
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
        >
          <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Conectado
        </div>
        <div
          v-else-if="!isAvailable"
          class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400"
        >
          Não-configurado
        </div>
      </div>

      <!-- Body -->
      <div class="px-4 sm:px-6 py-5">
        <!-- Loading state -->
        <div v-if="status === 'pending'" class="flex items-center justify-center py-4">
          <Loader2 class="size-5 text-surface-400 animate-spin" />
        </div>

        <!-- Not configured (admin needs to set env vars) -->
        <div v-else-if="!isAvailable" class="space-y-3">
          <p class="text-sm text-surface-600 dark:text-surface-400">
            A integração com o Google Agenda requer configuração do servidor. Um administrador do servidor deve definir as variáveis ​​de ambiente 
            <code class="text-xs bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded font-mono">GOOGLE_CLIENT_ID</code>
            e
            <code class="text-xs bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded font-mono">GOOGLE_CLIENT_SECRET</code>
            antes que os usuários possam se conectar.
          </p>
          <div class="flex items-center gap-4">
            <a
              :href="`${useRuntimeConfig().public.marketingUrl}/docs/features/google-calendar`"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline"
            >
              Guia de configuração
              <ExternalLink class="size-3.5" />
            </a>
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm text-surface-500 dark:text-surface-400 hover:underline"
            >
              Google Cloud Console
              <ExternalLink class="size-3.5" />
            </a>
          </div>
        </div>

        <!-- Connected state -->
        <div v-else-if="isConnected" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1">
              <div class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                Conta Google
              </div>
              <div class="text-sm text-surface-900 dark:text-surface-100">
                {{ calendarStatus.accountEmail || 'Unknown' }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                Calendar
              </div>
              <div class="text-sm text-surface-900 dark:text-surface-100">
                {{ calendarStatus.calendarId === 'primary' ? 'Primary calendar' : calendarStatus.calendarId }}
              </div>
            </div>
          </div>

          <!-- Sync status -->
          <div class="flex items-center gap-2 text-sm">
            <RefreshCw class="size-3.5 text-surface-400" />
            <span class="text-surface-600 dark:text-surface-400">
              Sincronização bidirecional::
              <span
                :class="calendarStatus.webhookActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-amber-600 dark:text-amber-400'"
              >
                {{ calendarStatus.webhookActive ? 'Active' : 'Pending setup' }}
              </span>
            </span>
          </div>

          <!-- Features list -->
          <div class="rounded-lg bg-surface-50 dark:bg-surface-800/50 p-4 space-y-2">
            <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <Check class="size-4 text-emerald-500 shrink-0" />
              Entrevistas serão adicionadas automaticamente ao seu Google Calendar
            </div>
            <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <Check class="size-4 text-emerald-500 shrink-0" />
              Candidatos receberão convites de agenda como participantes
            </div>
            <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <Check class="size-4 text-emerald-500 shrink-0" />
              Respostas de RSVP serão sincronizadas automaticamente ao seu Google Calendar
            </div>
            <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
              <Clock class="size-4 text-emerald-500 shrink-0" />
              Agendamento
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-between pt-2">
            <div class="flex items-center gap-1.5 text-xs text-surface-400 dark:text-surface-500">
              <Shield class="size-3.5" />
              Tokens criptografados em repouso
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="!showDisconnectConfirm"
                class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors"
                @click="showDisconnectConfirm = true"
              >
                <Unplug class="size-3.5" />
                Disconectado
              </button>

              <template v-else>
                <span class="text-sm text-surface-500 dark:text-surface-400">Tem certeza?</span>
                <button
                  :disabled="isDisconnecting"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-danger-700 disabled:opacity-50 transition-colors"
                  @click="handleDisconnect"
                >
                  <Loader2 v-if="isDisconnecting" class="size-3.5 animate-spin" />
                  Sim, desconectar
                </button>
                <button
                  class="rounded-lg px-3 py-1.5 text-sm font-medium text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  @click="showDisconnectConfirm = false"
                >
                  Cancelar
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- Disconnected / Ready to connect -->
        <div v-else class="space-y-4">
          <div class="space-y-3">
            <p class="text-sm text-surface-600 dark:text-surface-400">
              Conecte seu Google Agenda para sincronizar automaticamente os agendamentos de entrevistas.
Tanto você quanto o candidato verão o evento em suas agendas, com
confirmação de presença bidirecional.
            </p>

            <!-- Features preview -->
            <div class="rounded-lg bg-surface-50 dark:bg-surface-800/50 p-4 space-y-2">
              <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Calendar class="size-4 text-brand-500 shrink-0" />
                Criar automaticamente eventos no calendário para entrevistas agendadas.
              </div>
              <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <RefreshCw class="size-4 text-brand-500 shrink-0" />
                Sincronização bidirecional — as alterações em qualquer um dos sistemas permanecem sincronizadas.
              </div>
              <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Clock class="size-4 text-brand-500 shrink-0" />
                Gerenciamento adequado de fusos horários — chega de confusão com horários.
              </div>
              <div class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Shield class="size-4 text-brand-500 shrink-0" />
                Tokens OAuth criptografados em repouso — revogue a qualquer momento.
              </div>
            </div>
          </div>

          <button
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            @click="connect"
          >
            <Calendar class="size-4" />
            Conectar Google Agenda
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
