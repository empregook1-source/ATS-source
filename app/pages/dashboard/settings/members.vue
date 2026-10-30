<script setup lang="ts">
import type { Component } from 'vue'
import {
  Users, UserPlus, Shield, ShieldCheck, Crown,
  MoreHorizontal, Trash2, ChevronDown, Loader2,
  Save, X, Check, AlertTriangle, UserCheck, UserX, MessageSquare, Search,
} from 'lucide-vue-next'

definePageMeta({
  middleware: ['auth', 'require-org', 'settings-access'],
})

useSeoMeta({
  title: 'Membros da equipe — Emprego OK',
  description: 'Gerencie os membros da sua equipe',
})

const { activeOrg } = useCurrentOrg()
const { data: session } = await authClient.useSession(useFetch)
const { allowed: canManageMembers, role: activeMemberRole } = usePermission({ member: ['create'] })
const { track } = useTrack()

// ─────────────────────────────────────────────
// Members list
// ─────────────────────────────────────────────
const members = ref<Array<{
  id: string
  userId: string
  role: string
  user: { name: string; email: string; image?: string }
  createdAt: Date
}>>([])
const isLoadingMembers = ref(true)
const membersError = ref('')

async function fetchMembers() {
  isLoadingMembers.value = true
  membersError.value = ''
  try {
    const result = await authClient.organization.listMembers()
    if (result.error) throw new Error(String(result.error.message ?? 'Falha ao carregar membros'))
    members.value = (result.data?.members ?? []) as typeof members.value
  }
  catch (err: unknown) {
    membersError.value = err instanceof Error ? err.message : 'Falha ao carregar membros'
  }
  finally {
    isLoadingMembers.value = false
  }
}

onMounted(fetchMembers)

// ─────────────────────────────────────────────
// Members search & pagination
// ─────────────────────────────────────────────
const memberSearch = ref('')
const membersPerPage = 20
const visibleCount = ref(membersPerPage)

const filteredMembers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase()
  if (!q) return members.value
  return members.value.filter(m =>
    m.user.name?.toLowerCase().includes(q)
    || m.user.email?.toLowerCase().includes(q)
    || m.role.toLowerCase().includes(q),
  )
})

const visibleMembers = computed(() => filteredMembers.value.slice(0, visibleCount.value))
const hasMoreMembers = computed(() => visibleCount.value < filteredMembers.value.length)

function showMoreMembers() {
  visibleCount.value += membersPerPage
}

// Reset visible count when search changes
watch(memberSearch, () => {
  visibleCount.value = membersPerPage
})

// ─────────────────────────────────────────────
// Invite member
// ─────────────────────────────────────────────
const showInviteForm = ref(false)
const inviteName = ref('')
const inviteEmail = ref('')
const inviteRole = ref<'admin' | 'member'>('member')
const invitePassword = ref('')
const inviteOrganizationId = ref('')
const isSavingUser = ref(false)
const isLoadingOrganizations = ref(false)
const inviteSuccess = ref('')
const inviteError = ref('')
const availableOrganizations = ref<Array<{ id: string; name: string; slug: string }>>([])

const isOwner = computed(() => activeMemberRole.value === 'owner')
const canChangeOrganization = computed(() => isOwner.value)

function resetInviteForm() {
  inviteName.value = ''
  inviteEmail.value = ''
  invitePassword.value = ''
  inviteRole.value = 'member'
  if (!canChangeOrganization.value) {
    inviteOrganizationId.value = activeOrg.value?.id ?? ''
  }
  inviteError.value = ''
  inviteSuccess.value = ''
}

async function fetchAvailableOrganizations() {
  if (!canManageMembers.value) return
  isLoadingOrganizations.value = true
  try {
    const data = await $fetch<Array<{ id: string; name: string; slug: string }>>('/api/members/organizations')
    availableOrganizations.value = data
    if (!inviteOrganizationId.value) {
      if (!canChangeOrganization.value && activeOrg.value?.id) {
        inviteOrganizationId.value = activeOrg.value.id
      }
      else if (data.length > 0) {
        inviteOrganizationId.value = data[0]!.id
      }
    }
  }
  catch (err: any) {
    inviteError.value = err?.data?.statusMessage || 'Falha ao carregar organizacoes'
  }
  finally {
    isLoadingOrganizations.value = false
  }
}

watch(
  () => activeOrg.value?.id,
  (orgId) => {
    if (!canChangeOrganization.value && orgId) {
      inviteOrganizationId.value = orgId
    }
  },
  { immediate: true },
)

watch(
  canManageMembers,
  (allowed) => {
    if (allowed) {
      fetchAvailableOrganizations()
    }
  },
  { immediate: true },
)

async function handleCreateUser() {
  if (!canManageMembers.value) return
  isSavingUser.value = true
  inviteError.value = ''
  inviteSuccess.value = ''

  try {
    if (!inviteName.value.trim()) {
      throw new Error('Name is required.')
    }
    if (!inviteEmail.value.trim()) {
      throw new Error('E-mail e obrigatorio.')
    }
    if (invitePassword.value.length < 8) {
      throw new Error('Password must be at least 8 characters.')
    }
    if (!inviteOrganizationId.value) {
      throw new Error('Organization is required.')
    }

    await $fetch('/api/members', {
      method: 'POST',
      body: {
        name: inviteName.value.trim(),
        email: inviteEmail.value.trim().toLowerCase(),
        password: invitePassword.value,
        role: inviteRole.value,
        organizationId: inviteOrganizationId.value,
      },
    })

    inviteSuccess.value = `User ${inviteEmail.value.trim()} saved successfully.`
    track('member_invited', { method: 'direct_create' })
    inviteName.value = ''
    inviteEmail.value = ''
    invitePassword.value = ''
    inviteRole.value = 'member'
    if (!canChangeOrganization.value && activeOrg.value?.id) {
      inviteOrganizationId.value = activeOrg.value.id
    }
    setTimeout(() => { inviteSuccess.value = '' }, 5000)
    await fetchMembers()
  }
  catch (err: any) {
    inviteError.value = err?.data?.statusMessage || err?.message || 'Falha ao salvar usuario'
  }
  finally {
    isSavingUser.value = false
  }
}

// ─────────────────────────────────────────────
// Join requests
// ─────────────────────────────────────────────
const joinRequests = ref<Array<{
  id: string
  message: string | null
  status: string
  createdAt: string
  userName: string
  userEmail: string
  userImage: string | null
}>>([])
const isLoadingJoinRequests = ref(true)
const joinRequestsError = ref('')
const approvingRequestId = ref<string | null>(null)
const rejectingRequestId = ref<string | null>(null)
const joinRequestActionError = ref('')

async function fetchJoinRequests() {
  isLoadingJoinRequests.value = true
  joinRequestsError.value = ''
  try {
    const data = await $fetch('/api/join-requests')
    joinRequests.value = data as typeof joinRequests.value
  }
  catch (err: unknown) {
    joinRequestsError.value = err instanceof Error ? err.message : 'Falha ao carregar solicitacoes de ingresso'
  }
  finally {
    isLoadingJoinRequests.value = false
  }
}

onMounted(fetchJoinRequests)

async function handleApproveRequest(requestId: string) {
  approvingRequestId.value = requestId
  joinRequestActionError.value = ''

  try {
    await $fetch(`/api/join-requests/${requestId}/approve`, { method: 'POST' })
    await Promise.all([fetchJoinRequests(), fetchMembers()])
  }
  catch (err: any) {
    joinRequestActionError.value = err?.data?.statusMessage || 'Falha ao aprovar solicitacao'
  }
  finally {
    approvingRequestId.value = null
  }
}

async function handleRejeitarRequest(requestId: string) {
  rejectingRequestId.value = requestId
  joinRequestActionError.value = ''

  try {
    await $fetch(`/api/join-requests/${requestId}/reject`, { method: 'POST' })
    await fetchJoinRequests()
  }
  catch (err: any) {
    joinRequestActionError.value = err?.data?.statusMessage || 'Falha ao rejeitar solicitacao'
  }
  finally {
    rejectingRequestId.value = null
  }
}

// ─────────────────────────────────────────────
// Role management
// ─────────────────────────────────────────────
const activeDropdown = ref<string | null>(null)
const isUpdatingRole = ref<string | null>(null)
const roleUpdateError = ref('')

function toggleDropdown(memberId: string) {
  activeDropdown.value = activeDropdown.value === memberId ? null : memberId
}

function closeDropdown() {
  activeDropdown.value = null
}

async function handleUpdateRole(memberId: string, newRole: 'admin' | 'member') {
  isUpdatingRole.value = memberId
  roleUpdateError.value = ''

  try {
    const result = await authClient.organization.updateMemberRole({
      memberId,
      role: newRole,
    })
    if (result.error) throw new Error(String(result.error.message ?? 'Falha ao atualizar perfil'))
    await fetchMembers()
  }
  catch (err: unknown) {
    roleUpdateError.value = err instanceof Error ? err.message : 'Falha ao atualizar perfil'
  }
  finally {
    isUpdatingRole.value = null
    closeDropdown()
  }
}

// ─────────────────────────────────────────────
// Remove member
// ─────────────────────────────────────────────
const memberToRemove = ref<{ id: string; name: string } | null>(null)
const isRemoving = ref(false)
const removeError = ref('')

async function handleRemoveMember() {
  if (!memberToRemove.value) return

  // Guard: prevent removing yourself even if called programmatically
  const currentUserId = session.value?.user?.id
  const targetMember = members.value.find(m => m.id === memberToRemove.value?.id)
  if (targetMember && currentUserId && targetMember.userId === currentUserId) {
    removeError.value = 'You cannot remove yourself from the organization.'
    return
  }

  isRemoving.value = true
  removeError.value = ''

  try {
    const result = await authClient.organization.removeMember({
      memberIdOrEmail: memberToRemove.value.id,
    })
    if (result.error) throw new Error(String(result.error.message ?? 'Falha ao remover membro'))
    memberToRemove.value = null
    await fetchMembers()
  }
  catch (err: unknown) {
    removeError.value = err instanceof Error ? err.message : 'Falha ao remover membro'
  }
  finally {
    isRemoving.value = false
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const roleConfig: Record<string, { label: string; color: string; bg: string; icon: Component }> = {
  owner: { label: 'Owner', color: 'text-warning-700 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-950', icon: Crown },
  admin: { label: 'Admin', color: 'text-brand-700 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950', icon: ShieldCheck },
  member: { label: 'Member', color: 'text-surface-700 dark:text-surface-300', bg: 'bg-surface-100 dark:bg-surface-800', icon: Shield },
}

function getRoleConfig(role: string) {
  return roleConfig[role] ?? roleConfig.member!
}

function isCurrentUser(userId: string) {
  return session.value?.user?.id === userId
}

function getInitials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

// Close dropdown on click outside — store reference for cleanup
function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('[data-member-actions]')) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <!-- Page title -->
    <div class="mb-6">
      <h1 class="text-lg font-semibold text-surface-900 dark:text-surface-50">
        Members
      </h1>
      <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
        Gerencie os membros da sua equipe.
      </p>
    </div>

    <!-- Invite member section -->
    <section v-if="canManageMembers" class="mb-6">
      <button
        v-if="!showInviteForm"
        class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
        @click="showInviteForm = true"
      >
        <UserPlus class="size-4" />
        Adicionar membro
      </button>

      <Transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-2"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div v-if="showInviteForm" class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-5">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <UserPlus class="size-5 text-brand-600 dark:text-brand-400" />
              <h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Criar membro da equipe</h3>
            </div>
            <button
              class="p-1 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              @click="showInviteForm = false; resetInviteForm()"
            >
              <X class="size-4" />
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="sm:col-span-2">
              <label for="invite-name" class="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Name</label>
              <input
                id="invite-name"
                v-model="inviteName"
                type="text"
                placeholder="Colleague name"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <div class="sm:col-span-2">
              <label for="invite-email" class="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Email</label>
              <input
                id="invite-email"
                v-model="inviteEmail"
                type="email"
                placeholder="colleague@company.com"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                @keydown.enter="handleCreateUser"
              />
            </div>

            <div class="relative">
              <label for="invite-password" class="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Password</label>
              <input
                id="invite-password"
                v-model="invitePassword"
                type="password"
                autocomplete="new-password"
                minlength="8"
                placeholder="At least 8 characters"
                class="w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 px-3 py-2 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>

            <div class="relative">
              <label for="invite-role" class="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Role</label>
              <select
                id="invite-role"
                v-model="inviteRole"
                class="appearance-none rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-3 pr-8 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors cursor-pointer"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown class="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-surface-400 pointer-events-none" />
            </div>

            <div class="relative sm:col-span-2">
              <label for="invite-organization" class="mb-1 block text-xs font-medium text-surface-600 dark:text-surface-400">Organization</label>
              <select
                id="invite-organization"
                v-model="inviteOrganizationId"
                :disabled="!canChangeOrganization || isLoadingOrganizations"
                class="w-full appearance-none rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-3 pr-8 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option v-if="isLoadingOrganizations" value="">Loading organizations…</option>
                <option v-else-if="availableOrganizations.length === 0" value="">No organizations available</option>
                <option
                  v-for="organization in availableOrganizations"
                  :key="organization.id"
                  :value="organization.id"
                >
                  {{ organization.name }} ({{ organization.slug }})
                </option>
              </select>
              <ChevronDown class="absolute right-2.5 top-[2.15rem] size-3.5 text-surface-400 pointer-events-none" />
            </div>

            <button
              :disabled="isSavingUser || !inviteName.trim() || !inviteEmail.trim() || !invitePassword || !inviteOrganizationId"
              class="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleCreateUser"
            >
              <Loader2 v-if="isSavingUser" class="size-4 animate-spin" />
              <Save v-else class="size-4" />
              {{ isSavingUser ? 'Salvando…' : 'Save user' }}
            </button>
          </div>

          <Transition
            enter-active-class="transition-opacity duration-300"
            leave-active-class="transition-opacity duration-300"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div v-if="inviteSuccess" class="mt-3 flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
              <Check class="size-4" />
              {{ inviteSuccess }}
            </div>
          </Transition>

          <div v-if="inviteError" class="mt-3 rounded-lg bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 px-3 py-2 text-sm text-danger-700 dark:text-danger-400">
            {{ inviteError }}
          </div>
        </div>
      </Transition>
    </section>

    <!-- Role update error banner -->
    <div v-if="roleUpdateError" class="mb-4 rounded-lg bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 px-4 py-3 text-sm text-danger-700 dark:text-danger-400 flex items-center justify-between">
      <span>{{ roleUpdateError }}</span>
      <button class="text-danger-500 hover:text-danger-700 transition-colors" @click="roleUpdateError = ''">
        <X class="size-4" />
      </button>
    </div>

    <!-- Join requests section -->
    <section v-if="canManageMembers && (isLoadingJoinRequests || joinRequests.length > 0)" class="mb-6 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 overflow-hidden">
      <div class="px-4 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-800">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-8 rounded-lg bg-warning-50 dark:bg-warning-950 text-warning-600 dark:text-warning-400">
            <UserCheck class="size-4" />
          </div>
          <div>
            <h2 class="text-sm font-semibold text-surface-900 dark:text-surface-100">Join requests</h2>
            <p class="text-xs text-surface-500 dark:text-surface-400">
              {{ isLoadingJoinRequests ? 'Carregando…' : `${joinRequests.length} pending request${joinRequests.length !== 1 ? 's' : ''}` }}
            </p>
          </div>
        </div>
      </div>

      <!-- Join request action error -->
      <div v-if="joinRequestActionError" class="px-4 sm:px-6 py-2 flex items-center justify-between text-sm text-danger-700 dark:text-danger-400 bg-danger-50 dark:bg-danger-950/40 border-b border-danger-200 dark:border-danger-900">
        <span>{{ joinRequestActionError }}</span>
        <button class="text-danger-500 hover:text-danger-700 transition-colors" @click="joinRequestActionError = ''">
          <X class="size-4" />
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="isLoadingJoinRequests" class="px-4 sm:px-6 py-6 text-center text-surface-400 text-sm">
        <Loader2 class="size-4 animate-spin mx-auto mb-1.5" />
        Loading join requests…
      </div>

      <!-- Error state -->
      <div v-else-if="joinRequestsError" class="px-4 sm:px-6 py-6 text-center">
        <AlertTriangle class="size-5 text-danger-400 mx-auto mb-1.5" />
        <p class="text-sm text-danger-600 dark:text-danger-400">{{ joinRequestsError }}</p>
        <button class="mt-1.5 text-sm text-brand-600 hover:text-brand-700 underline" @click="fetchJoinRequests">
          Retry
        </button>
      </div>

      <!-- Requests list -->
      <div v-else class="divide-y divide-surface-100 dark:divide-surface-800">
        <div
          v-for="req in joinRequests"
          :key="req.id"
          class="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
        >
          <!-- Avatar + Info -->
          <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div class="flex-shrink-0">
              <img
                v-if="req.userImage"
                :src="req.userImage"
                :alt="req.userName"
                class="size-9 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-800"
              />
              <div v-else class="size-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300 ring-2 ring-surface-100 dark:ring-surface-800">
                {{ req.userName?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '?' }}
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                {{ req.userName }}
              </div>
              <div class="text-xs text-surface-500 dark:text-surface-400 truncate">
                {{ req.userEmail }}
              </div>
              <div v-if="req.message" class="mt-1 text-xs text-surface-500 dark:text-surface-400 italic flex items-start gap-1">
                <MessageSquare class="size-3 mt-0.5 flex-shrink-0" />
                <span class="truncate">"{{ req.message }}"</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1.5 flex-shrink-0 pl-12 sm:pl-0">
            <button
              :disabled="approvingRequestId === req.id"
              class="inline-flex items-center gap-1.5 rounded-lg bg-success-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Approve — adds as Member"
              @click="handleApproveRequest(req.id)"
            >
              <Loader2 v-if="approvingRequestId === req.id" class="size-3 animate-spin" />
              <UserCheck v-else class="size-3" />
              Approve
            </button>
            <button
              :disabled="rejectingRequestId === req.id"
              class="inline-flex items-center gap-1.5 rounded-lg border border-danger-200 dark:border-danger-800 bg-white dark:bg-surface-800 px-3 py-1.5 text-xs font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rejeitar join request"
              @click="handleRejeitarRequest(req.id)"
            >
              <Loader2 v-if="rejectingRequestId === req.id" class="size-3 animate-spin" />
              <UserX v-else class="size-3" />
              Rejeitar
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Members list -->
    <section class="rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900">
      <div class="px-4 sm:px-6 py-5 border-b border-surface-200 dark:border-surface-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center size-10 shrink-0 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
              <Users class="size-5" />
            </div>
            <div>
              <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100">Membros da equipe</h2>
              <p class="text-sm text-surface-500 dark:text-surface-400">
                {{ isLoadingMembers ? 'Carregando…' : `${members.length} membro${members.length !== 1 ? 's' : ''}` }}
              </p>
            </div>
          </div>
          <div v-if="!isLoadingMembers && members.length > 5" class="flex-shrink-0">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-surface-400 pointer-events-none" />
              <input
                v-model="memberSearch"
                type="text"
                placeholder="Buscar membros…"
                class="w-full sm:w-48 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 pl-8.5 pr-3 py-1.5 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="isLoadingMembers" class="px-4 sm:px-6 py-8 text-center text-surface-400 text-sm">
        <Loader2 class="size-5 animate-spin mx-auto mb-2" />
        Loading members…
      </div>

      <!-- Error state -->
      <div v-else-if="membersError" class="px-4 sm:px-6 py-8 text-center">
        <AlertTriangle class="size-6 text-danger-400 mx-auto mb-2" />
        <p class="text-sm text-danger-600 dark:text-danger-400">{{ membersError }}</p>
        <button class="mt-2 text-sm text-brand-600 hover:text-brand-700 underline" @click="fetchMembers">
          Retry
        </button>
      </div>

      <!-- Members list -->
      <div v-else class="divide-y divide-surface-100 dark:divide-surface-800">
        <div
          v-for="m in visibleMembers"
          :key="m.id"
          class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
        >
          <!-- Avatar + Info row -->
          <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div class="flex-shrink-0">
              <img
                v-if="m.user.image"
                :src="m.user.image"
                :alt="m.user.name"
                class="size-10 rounded-full object-cover ring-2 ring-surface-100 dark:ring-surface-800"
              />
              <div v-else class="size-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-300 ring-2 ring-surface-100 dark:ring-surface-800">
                {{ getInitials(m.user.name) }}
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                  {{ m.user.name }}
                </span>
                <span v-if="isCurrentUser(m.userId)" class="text-xs text-surface-400 dark:text-surface-500">(you)</span>
              </div>
              <div class="text-sm text-surface-500 dark:text-surface-400 truncate">
                <a
                  :href="`mailto:${m.user.email}`"
                  target="_blank"
                  class="hover:text-brand-600 dark:hover:text-brand-400 hover:underline cursor-pointer transition-colors"
                >{{ m.user.email }}</a>
              </div>
            </div>
          </div>

          <!-- Role badge + Actions -->
          <div class="flex items-center gap-2 pl-[3.25rem] sm:pl-0 flex-shrink-0">
            <span
              :class="[getRoleConfig(m.role).bg, getRoleConfig(m.role).color]"
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            >
              <component :is="getRoleConfig(m.role).icon" class="size-3" />
              {{ getRoleConfig(m.role).label }}
            </span>

          <!-- Actions dropdown -->
          <div v-if="canManageMembers && !isCurrentUser(m.userId) && m.role !== 'owner'" class="relative" data-member-actions>
            <button
              class="p-1.5 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
              @click.stop="toggleDropdown(m.id)"
            >
              <MoreHorizontal class="size-4" />
            </button>

            <Transition
              enter-active-class="transition-all duration-150"
              leave-active-class="transition-all duration-100"
              enter-from-class="opacity-0 scale-95"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="activeDropdown === m.id"
                class="absolute right-0 top-full mt-1 w-48 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-lg z-50 overflow-hidden"
              >
                <!-- Role options -->
                <div class="py-1 border-b border-surface-100 dark:border-surface-800">
                  <div class="px-3 py-1.5 text-xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                    Change role
                  </div>
                  <button
                    v-if="m.role !== 'admin'"
                    :disabled="isUpdatingRole === m.id"
                    class="w-full px-3 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex items-center gap-2 disabled:opacity-50 bg-transparent border-0 cursor-pointer"
                    @click="handleUpdateRole(m.id, 'admin')"
                  >
                    <ShieldCheck class="size-3.5 text-brand-500" />
                    Make admin
                  </button>
                  <button
                    v-if="m.role !== 'member'"
                    :disabled="isUpdatingRole === m.id"
                    class="w-full px-3 py-2 text-left text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors flex items-center gap-2 disabled:opacity-50 bg-transparent border-0 cursor-pointer"
                    @click="handleUpdateRole(m.id, 'member')"
                  >
                    <Shield class="size-3.5 text-surface-400" />
                    Make member
                  </button>
                </div>

                <!-- Remove -->
                <div class="py-1">
                  <button
                    class="w-full px-3 py-2 text-left text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors flex items-center gap-2 bg-transparent border-0 cursor-pointer"
                    @click="memberToRemove = { id: m.id, name: m.user.name }; closeDropdown()"
                  >
                    <Trash2 class="size-3.5" />
                    Remove member
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Loading indicator for role update -->
          <div v-if="isUpdatingRole === m.id" class="flex-shrink-0">
            <Loader2 class="size-4 animate-spin text-brand-500" />
          </div>
          </div>
        </div>

        <!-- Show more button -->
        <div v-if="hasMoreMembers" class="px-4 sm:px-6 py-3 text-center border-t border-surface-100 dark:border-surface-800">
          <button
            class="text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            @click="showMoreMembers"
          >
            Show {{ Math.min(membersPerPage, filteredMembers.length - visibleCount) }} more
            ({{ filteredMembers.length - visibleCount }} remaining)
          </button>
        </div>
      </div>
    </section>

    <!-- Remove member confirmation modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        leave-active-class="transition-opacity duration-150"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="memberToRemove" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" @click.self="memberToRemove = null">
          <Transition
            enter-active-class="transition-all duration-200"
            leave-active-class="transition-all duration-150"
            enter-from-class="opacity-0 scale-95"
            leave-to-class="opacity-0 scale-95"
          >
            <div v-if="memberToRemove" class="w-full max-w-md bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-2xl p-6">
              <div class="flex items-center gap-3 mb-4">
                <div class="flex items-center justify-center size-10 rounded-full bg-danger-100 dark:bg-danger-950 text-danger-600 dark:text-danger-400">
                  <AlertTriangle class="size-5" />
                </div>
                <div>
                  <h3 class="text-base font-semibold text-surface-900 dark:text-surface-100">Remove member</h3>
                  <p class="text-sm text-surface-500 dark:text-surface-400">This action can be undone by re-inviting.</p>
                </div>
              </div>

              <p class="text-sm text-surface-600 dark:text-surface-400 mb-5">
                Are you sure you want to remove <strong class="text-surface-900 dark:text-surface-100">{{ memberToRemove.name }}</strong> from
                <strong class="text-surface-900 dark:text-surface-100">{{ activeOrg?.name }}</strong>?
                They will lose access to all organization data immediately.
              </p>

              <div v-if="removeError" class="mb-4 rounded-lg bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 px-3 py-2 text-sm text-danger-700 dark:text-danger-400">
                {{ removeError }}
              </div>

              <div class="flex items-center gap-3 justify-end">
                <button
                  class="rounded-lg px-4 py-2 text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  @click="memberToRemove = null; removeError = ''"
                >
                  Cancelar
                </button>
                <button
                  :disabled="isRemoving"
                  class="inline-flex items-center gap-2 rounded-lg bg-danger-600 px-4 py-2 text-sm font-medium text-white hover:bg-danger-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="handleRemoveMember"
                >
                  <Loader2 v-if="isRemoving" class="size-4 animate-spin" />
                  <Trash2 v-else class="size-4" />
                  {{ isRemoving ? 'Removing…' : 'Remove' }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Permissions notice for members -->
    <div v-if="!canManageMembers" class="mt-6 rounded-lg bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-800 px-4 py-3 text-sm text-surface-500 dark:text-surface-400">
      You don't have permission to manage team members. Contact an admin or owner to create members or change roles.
    </div>
  </div>
</template>
