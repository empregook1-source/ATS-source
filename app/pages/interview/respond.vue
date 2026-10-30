<script setup lang="ts">
definePageMeta({
  layout: 'public',
})

const route = useRoute()
const token = computed(() => {
  const t = route.query.token
  return typeof t === 'string' ? t : ''
})

const { data, error: fetchError, status: fetchStatus } = await useFetch('/api/public/interviews/respond', {
  query: { token },
  immediate: !!token.value,
})

const actionLabels: Record<string, string> = {
  accepted: 'Aceita',
  declined: 'Recusada',
  tentative: 'Tentativa',
}

const actionColors: Record<string, string> = {
  accepted: 'bg-green-600 hover:bg-green-700',
  declined: 'bg-red-600 hover:bg-red-700',
  tentative: 'bg-yellow-600 hover:bg-yellow-700',
}

const responseLabels: Record<string, string> = {
  accepted: 'Aceita',
  declined: 'Recusada',
  tentative: 'Tentativa',
  pending: 'Pendente',
}

const interviewTypeLabels: Record<string, string> = {
  video: 'Chamada de video',
  phone: 'Chamada de telefone',
  in_person: 'Presencial',
  technical: 'Entrevista técnica',
  panel: 'Panel Entrevista',
  take_home: 'Tarefa em casa',
}

const confirming = ref(false)
const confirmed = ref(false)
const confirmError = ref('')

async function confirmResponse() {
  if (!token.value) return
  confirming.value = true
  confirmError.value = ''

  try {
    await $fetch('/api/public/interviews/respond', {
      method: 'POST',
      body: { token: token.value },
    })
    confirmed.value = true
  }
  catch (err: unknown) {
    const message = err && typeof err === 'object' && 'data' in err
      ? (err as { data?: { statusMessage?: string } }).data?.statusMessage
      : undefined
    confirmError.value = message || 'Algo deu errado. Tente novamente.'
  }
  finally {
    confirming.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

useHead({
  title: 'Entrevista Response',
})
</script>

<template>
  <div class="max-w-lg mx-auto py-12">
    <!-- No token -->
    <div v-if="!token" class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
        <span class="text-2xl">⚠</span>
      </div>
      <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
        Link inválido
      </h1>
      <p class="text-surface-500">
        Link inválido. Por favor, use o link do seu email de convite.
      </p>
    </div>

    <!-- Loading -->
    <div v-else-if="fetchStatus === 'pending'" class="text-center py-12">
      <div class="animate-spin inline-block w-8 h-8 border-2 border-surface-300 border-t-blue-600 rounded-full mb-4" />
      <p class="text-surface-500">
        Carregando detalhes da entrevista...
      </p>
    </div>

    <!-- Error fetching -->
    <div v-else-if="fetchError" class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
        <span class="text-2xl">⚠</span>
      </div>
      <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
        {{ fetchError.statusCode === 400 ? 'Link Expired' : 'Something went wrong' }}
      </h1>
      <p class="text-surface-500">
        {{ fetchError.statusCode === 400
          ? 'This response link has expired or is no longer valid. Please contact the hiring team for a new invitation.'
          : 'We couldn\'t load the interview details. Please try again later.'
        }}
      </p>
    </div>

    <!-- Confirmed successfully -->
    <div v-else-if="confirmed" class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
           :class="data?.action === 'accepted' ? 'bg-green-100 dark:bg-green-900/30' : data?.action === 'declined' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'">
        <span class="text-2xl">
          {{ data?.action === 'accepted' ? '✓' : data?.action === 'declined' ? '✗' : '?' }}
        </span>
      </div>
      <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
        Resposta registrada
      </h1>
      <p class="text-surface-500 mb-6">
        <template v-if="data?.action === 'accepted'">
          Você aceitou a entrevista. Ela deve aparecer em seu calendário se você aceitou o convite de calendário do email.
        </template>
        <template v-else-if="data?.action === 'declined'">
          Você recusou a entrevista. O time de recrutamento foi notificado.
        </template>
        <template v-else>
          Você marcou esta entrevista como tentativa. O time de recrutamento foi notificado.
        </template>
      </p>
    </div>

    <!-- Entrevista details + confirm action -->
    <div v-else-if="data">
      <!-- Already responded -->
      <div v-if="data.interview.candidateResponse !== 'pending'" class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
          <span class="text-2xl">ℹ</span>
        </div>
        <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
          Já respondida
        </h1>
        <p class="text-surface-500">
          Você já {{ responseLabels[data.interview.candidateResponse]?.toLowerCase() ?? 'respondido para' }} esta entrevista.
          Se você precisar alterar sua resposta, contate o time de recrutamento diretamente.
        </p>
      </div>

      <!-- Entrevista is no longer scheduled -->
      <div v-else-if="data.interview.status !== 'scheduled'" class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 mb-4">
          <span class="text-2xl">ℹ</span>
        </div>
        <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-2">
          Entrevista {{ data.interview.status === 'cancelled' ? 'Cancelada' : data.interview.status === 'completed' ? 'Concluída' : 'Não está disponível' }}
        </h1>
        <p class="text-surface-500">
          Você não pode responder a esta entrevista.
        </p>
      </div>

      <!-- Ready to respond -->
      <div v-else>
        <h1 class="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-6 text-center">
          Convite da entrevista
        </h1>

        <!-- Entrevista details card -->
        <div class="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 mb-6">
          <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-4">
            {{ data.interview.title }}
          </h2>

          <dl class="space-y-3 text-sm">
            <div v-if="data.organizationName" class="flex justify-between">
              <dt class="text-surface-500">
                Organização
              </dt>
              <dd class="text-surface-900 dark:text-surface-100 font-medium">
                {{ data.organizationName }}
              </dd>
            </div>
            <div v-if="data.jobTitle" class="flex justify-between">
              <dt class="text-surface-500">
                Função
              </dt>
              <dd class="text-surface-900 dark:text-surface-100 font-medium">
                {{ data.jobTitle }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-surface-500">
                Data
              </dt>
              <dd class="text-surface-900 dark:text-surface-100 font-medium">
                {{ formatDate(data.interview.scheduledAt) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-surface-500">
                Horário
              </dt>
              <dd class="text-surface-900 dark:text-surface-100 font-medium">
                {{ formatTime(data.interview.scheduledAt) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-surface-500">
                Duração
              </dt>
              <dd class="text-surface-900 dark:text-surface-100 font-medium">
                {{ data.interview.duration }} minutos
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-surface-500">
                Tipo
              </dt>
              <dd class="text-surface-900 dark:text-surface-100 font-medium">
                {{ interviewTypeLabels[data.interview.type] ?? data.interview.type }}
              </dd>
            </div>
            <div v-if="data.interview.location" class="flex justify-between">
              <dt class="text-surface-500">
                Localização
              </dt>
              <dd class="text-surface-900 dark:text-surface-100 font-medium break-all">
                {{ data.interview.location }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Confirm action -->
        <div class="text-center">
          <p class="text-sm text-surface-500 mb-4">
            You are about to <strong>{{ actionLabels[data.action]?.toLowerCase() }}</strong> this interview.
          </p>

          <div v-if="confirmError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {{ confirmError }}
          </div>

          <button
            :disabled="confirming"
            :class="actionColors[data.action]"
            class="w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="confirmResponse"
          >
            <span v-if="confirming">Processando...</span>
            <span v-else>{{ actionLabels[data.action] }} Entrevista</span>
          </button>

          <p class="text-xs text-surface-400 mt-4">
            Clicar neste botão irá registrar sua resposta e notificar a equipe de recrutamento.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
