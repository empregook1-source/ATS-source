<script setup lang="ts">
import { Building2, Save, AlertTriangle, Trash2, Loader2 } from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'require-org', 'settings-access'],
})

useSeoMeta({
  title: 'Configurações de organização — Emprego OK',
  description: 'Gerencie as configuracoes da sua organizacao',
})

const { activeOrg } = useCurrentOrg()
const { allowed: canUpdateOrg } = usePermission({ organization: ['update'] })
const { allowed: canDeleteOrg } = usePermission({ organization: ['delete'] })
const { track } = useTrack()

// ─────────────────────────────────────────────
// Org name/slug editing
// ─────────────────────────────────────────────
const orgName = ref('')
const orgSlug = ref('')
const isSaving = ref(false)
const saveSuccess = ref(false)
const saveError = ref('')

/** Slug must be lowercase alphanumeric + hyphens, 2-48 chars, no leading/trailing hyphen */
const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/

const slugError = computed(() => {
  const s = orgSlug.value.trim()
  if (!s) return ''
  if (!slugPattern.test(s)) return 'Only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.'
  return ''
})

watch(activeOrg, (org) => {
  if (org) {
    orgName.value = org.name ?? ''
    orgSlug.value = org.slug ?? ''
  }
}, { immediate: true })

async function handleSaveOrg() {
  if (!canUpdateOrg.value) return

  const trimmedName = orgName.value.trim()
  const trimmedSlug = orgSlug.value.trim().toLowerCase()

  // Prevent saving empty or invalid values
  if (!trimmedName) {
    saveError.value = 'Nome da organizacao não pode ser vazio.'
    return
  }
  if (!trimmedSlug || slugError.value) {
    saveError.value = 'URL slug da organizacao'
    return
  }
  if (!trimmedSlug || slugError.value) {
    saveError.value = slugError.value || 'URL slug não pode ser vazio.'
    return
  }

  isSaving.value = true
  saveError.value = ''
  saveSuccess.value = false

  try {
    await authClient.organization.update({
      data: {
        name: trimmedName,
        slug: trimmedSlug,
      },
    })
    track('org_settings_saved')
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  }
  catch (err: unknown) {
    saveError.value = err instanceof Error ? err.message : 'Falha ao atualizar organizacao'
  }
  finally {
    isSaving.value = false
  }
}

// ─────────────────────────────────────────────
// Delete org
// ─────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const deleteConfirmText = ref('')
const isDeleting = ref(false)
const deleteError = ref('')

const canConfirmDelete = computed(() => {
  const name = activeOrg.value?.name
  return !!name && deleteConfirmText.value === name
})

async function handleDeleteOrg() {
  if (!canDeleteOrg.value || !canConfirmDelete.value) return
  isDeleting.value = true
  deleteError.value = ''

  try {
    track('org_deleted')
    await authClient.organization.delete({
      organizationId: activeOrg.value!.id,
    })
    // Use navigateTo for Nuxt-managed navigation, then force reload
    // so all cached org state is cleared.
    const localePath = useLocalePath()
    await navigateTo(localePath('/onboarding/create-org'), { external: true })
  }
  catch (err: unknown) {
    deleteError.value = err instanceof Error ? err.message : 'Falha ao excluir organization'
  }
  finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <!-- Page title -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-surface-900 dark:text-surface-50">
        Visão geral
      </h1>
      <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
        Gerencie o perfil e as configurações da sua organização.
      </p>
    </div>

    <!-- Organization profile -->
    <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
      <div class="px-4 sm:px-6 py-5 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 shrink-0 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
            <Building2 class="size-5" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">Perfil da organização</h2>
            <p class="text-sm text-surface-500 dark:text-surface-400">Informações básicas sobre a sua organização.</p>
          </div>
        </div>
      </div>

      <div class="px-4 sm:px-6 py-5 space-y-5">
        <div>
          <label for="org-name" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            Nome da organizacao
          </label>
          <input
            id="org-name"
            v-model="orgName"
            type="text"
            :disabled="!canUpdateOrg"
            class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="My Company"
          />
        </div>

        <div>
          <label for="org-slug" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            URL slug
          </label>
          <div class="flex items-center rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-brand-500 transition-colors">
            <span class="px-3 text-sm text-surface-400 dark:text-surface-500 select-none bg-surface-50 dark:bg-surface-800/50 border-r border-surface-200 dark:border-surface-700 py-2">
              empregook.com.br/
            </span>
            <input
              id="org-slug"
              v-model="orgSlug"
              type="text"
              :disabled="!canUpdateOrg"
              class="flex-1 bg-transparent px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="my-company"
            />
          </div>
          <p class="mt-1.5 text-xs text-surface-400 dark:text-surface-500">
            URL da sua área de trabalho publica. Somente letras minúsculas, números e hífen são permitidos.
          </p>
          <p v-if="slugError" class="mt-1 text-xs text-danger-500">
            {{ slugError }}
          </p>
        </div>

        <!-- Save button & feedback -->
        <div class="flex items-center gap-3 pt-2">
          <button
            :disabled="!canUpdateOrg || isSaving"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSaveOrg"
          >
            <Loader2 v-if="isSaving" class="size-4 animate-spin" />
            <Save v-else class="size-4" />
            {{ isSaving ? 'Salvando…' : 'Salvar alterações' }}
          </button>

          <Transition
            enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <span v-if="saveSuccess" class="text-sm text-success-600 dark:text-success-400 font-medium">
              Changes saved
            </span>
          </Transition>
        </div>

        <div v-if="saveError" class="rounded-lg bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 px-4 py-3 text-sm text-danger-700 dark:text-danger-400">
          {{ saveError }}
        </div>
      </div>
    </section>

    <!-- Danger zone -->
    <section v-if="canDeleteOrg" class="mt-8 rounded-xl border border-danger-200 dark:border-danger-900 bg-white dark:bg-surface-900 overflow-hidden">
      <div class="px-4 sm:px-6 py-5 border-b border-danger-200 dark:border-danger-900 bg-danger-50/50 dark:bg-danger-950/20">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 shrink-0 rounded-lg bg-danger-100 dark:bg-danger-950 text-danger-600 dark:text-danger-400">
            <AlertTriangle class="size-5" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-danger-700 dark:text-danger-300">Zona perigosa</h2>
            <p class="text-sm text-danger-600/80 dark:text-danger-400/80">Ações irreversíveis e destrutíveis</p>
          </div>
        </div>
      </div>

      <div class="px-4 sm:px-6 py-5">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Excluir organização</h3>
            <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
              Excluir a organização permanentemente. Esta ação não pode ser desfeita.
            </p>
          </div>
          <button
            class="shrink-0 inline-flex items-center gap-2 rounded-lg border border-danger-300 dark:border-danger-800 bg-white dark:bg-surface-900 px-3.5 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors"
            @click="showDeleteConfirm = true"
          >
            <Trash2 class="size-4" />
            Excluir
          </button>
        </div>

        <!-- Delete confirmation -->
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="showDeleteConfirm" class="mt-5 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50/50 dark:bg-danger-950/30 px-4 py-4 space-y-3">
            <p class="text-sm text-surface-700 dark:text-surface-300">
              Tipo <strong class="text-surface-900 dark:text-surface-100 font-semibold">{{ activeOrg?.name }}</strong> to confirm deletion:
            </p>
            <input
              v-model="deleteConfirmText"
              type="text"
              class="w-full rounded-lg border border-danger-300 dark:border-danger-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-danger-500 focus:border-danger-500 transition-colors"
              :placeholder="activeOrg?.name"
            />
            <div class="flex items-center gap-2">
              <button
                :disabled="!canConfirmDelete || isDeleting"
                class="inline-flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="handleDeleteOrg"
              >
                <Loader2 v-if="isDeleting" class="size-4 animate-spin" />
                <Trash2 v-else class="size-4" />
                {{ isDeleting ? 'Excluindo…' : 'Permanently delete' }}
              </button>
              <button
                class="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
                @click="showDeleteConfirm = false; deleteConfirmText = ''"
              >
                Cancelar
              </button>
            </div>
            <div v-if="deleteError" class="text-sm text-danger-600 dark:text-danger-400">
              {{ deleteError }}
            </div>
          </div>
        </Transition>
      </div>
    </section>

    <!-- Read-only notice for non-admin users -->
    <div v-if="!canUpdateOrg" class="mt-6 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-800 px-4 py-3 text-sm text-surface-500 dark:text-surface-400">
      You don't have permission to modify organization settings. Contact an admin or owner for changes.
    </div>
  </div>
</template>
