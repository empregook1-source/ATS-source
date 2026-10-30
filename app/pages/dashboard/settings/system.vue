<script setup lang="ts">
import {
  Server,
  Loader2,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Info,
  AlertTriangle,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'require-org', 'settings-access'],
})

useSeoMeta({
  title: 'Sistema — Emprego OK',
  description: 'System health information for your self-hosted instance',
})

const { data: systemInfo, pending: systemLoading } = await useFetch('/api/updates/system', {
  lazy: true,
})

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${Math.floor(seconds)}s`
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
        Sistema
      </h1>
      <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
        Monitoramento da instância do sistema.
      </p>
    </div>

    <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden shadow-sm">
      <div class="px-6 py-5 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">
            <Server class="size-5" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">
              Saúde do sistema
            </h2>
            <p class="text-sm text-surface-500 dark:text-surface-400">
              Status dos serviços da instância do sistema.
            </p>
          </div>
        </div>
      </div>

      <div v-if="systemLoading" class="px-6 py-8 text-center">
        <Loader2 class="size-5 animate-spin mx-auto text-surface-400" />
        <p class="text-sm text-surface-400 mt-2">
          Carregando informações do sistema…
        </p>
      </div>

      <div v-else-if="systemInfo" class="px-6 py-5 space-y-5">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="rounded-lg border border-surface-200 dark:border-surface-800 px-4 py-3">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="size-2 rounded-full bg-success-500" />
              <span class="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">App</span>
            </div>
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
              Running
            </p>
            <p class="text-xs text-surface-400 mt-0.5">
              v{{ systemInfo.version }}
            </p>
          </div>

          <div class="rounded-lg border border-surface-200 dark:border-surface-800 px-4 py-3">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="size-2 rounded-full" :class="systemInfo.database.connected ? 'bg-success-500' : 'bg-danger-500'" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Database</span>
            </div>
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {{ systemInfo.database.connected ? 'Connected' : 'Disconnected' }}
            </p>
            <p class="text-xs text-surface-400 mt-0.5">
              PostgreSQL
            </p>
          </div>

          <div class="rounded-lg border border-surface-200 dark:border-surface-800 px-4 py-3">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="size-2 rounded-full" :class="systemInfo.storage.connected ? 'bg-success-500' : 'bg-danger-500'" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Storage</span>
            </div>
            <p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
              {{ systemInfo.storage.connected ? 'Connected' : 'Disconnected' }}
            </p>
            <p class="text-xs text-surface-400 mt-0.5">
              MinIO / S3
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <Clock class="size-3 text-surface-400" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Uptime</span>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300">
              {{ formatUptime(systemInfo.uptime) }}
            </p>
          </div>

          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <Cpu class="size-3 text-surface-400" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Platform</span>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300">
              {{ systemInfo.platform }}/{{ systemInfo.arch }}
            </p>
          </div>

          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <MemoryStick class="size-3 text-surface-400" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Memory</span>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300">
              {{ systemInfo.memoryUsage.percentage }}% used
            </p>
          </div>

          <div>
            <div class="flex items-center gap-1.5 mb-1">
              <HardDrive class="size-3 text-surface-400" />
              <span class="text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wide">Deployment</span>
            </div>
            <p class="text-sm text-surface-700 dark:text-surface-300">
              {{ systemInfo.deployment.isRailway ? 'Railway' : systemInfo.deployment.method === 'docker' ? 'Docker' : 'Standalone' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-surface-400 dark:text-surface-500">
          <Info class="size-3 shrink-0" />
          Node.js {{ systemInfo.nodeVersion }}
        </div>
      </div>

      <div v-else class="px-6 py-8 text-center">
        <AlertTriangle class="size-5 mx-auto text-surface-400 mb-2" />
        <p class="text-sm text-surface-500 dark:text-surface-400">
          Falha ao carregar informações do sistema.
        </p>
      </div>
    </section>
  </div>
</template>
