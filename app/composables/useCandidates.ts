import type { Ref } from 'vue'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'

/**
 * Composable for managing the candidates list with search, pagination, and mutations.
 * Wraps `useFetch('/api/candidates')` with a singleton key for shared state.
 */
export function useCandidates(options?: {
  search?: Ref<string | undefined> | string
  companyId?: Ref<string | undefined> | string
  page?: Ref<number> | number
  limit?: Ref<number> | number
}) {
  const { handlePreviewReadOnlyError } = usePreviewReadOnly()

  const query = computed(() => ({
    page: toValue(options?.page) ?? 1,
    limit: toValue(options?.limit) ?? 20,
    ...(toValue(options?.search) && { search: toValue(options?.search) }),
    ...(toValue(options?.companyId) && { companyId: toValue(options?.companyId) }),
  }))

  const { data, status: fetchStatus, error, refresh } = useFetch('/api/candidates', {
    key: 'candidates',
    query,
    headers: useRequestHeaders(['cookie']),
  })

  const candidates = computed(() => data.value?.data ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const page = computed(() => data.value?.page ?? (toValue(options?.page) ?? 1))
  const limit = computed(() => data.value?.limit ?? (toValue(options?.limit) ?? 20))

  /** Create a new candidate and refresh the list */
  async function createCandidate(payload: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }) {
    try {
      const created = await $fetch('/api/candidates', {
        method: 'POST',
        body: payload,
      })
      await refresh()
      return created
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  /** Delete a candidate by ID and refresh the list */
  async function deleteCandidate(id: string) {
    try {
      await $fetch(`/api/candidates/${id}`, { method: 'DELETE' })
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
    await refresh()
  }

  return {
    candidates,
    total,
    page,
    limit,
    fetchStatus,
    error,
    refresh,
    createCandidate,
    deleteCandidate,
  }
}
