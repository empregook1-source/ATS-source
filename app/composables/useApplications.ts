import type { Ref } from 'vue'
import { usePreviewReadOnly } from '~/composables/usePreviewReadOnly'

/**
 * Composable for managing the applications list with filtering, pagination, and mutations.
 * Wraps `useFetch('/api/applications')` with a singleton key for shared state.
 */
export function useApplications(options?: {
  companyId?: Ref<string | undefined> | string
  jobId?: Ref<string | undefined> | string
  candidateId?: Ref<string | undefined> | string
  status?: Ref<string | undefined> | string
  search?: Ref<string | undefined> | string
  page?: Ref<number> | number
  limit?: Ref<number> | number
}) {
  const { handlePreviewReadOnlyError } = usePreviewReadOnly()

  const query = computed(() => ({
    page: toValue(options?.page) ?? 1,
    limit: toValue(options?.limit) ?? 20,
    ...(toValue(options?.companyId) && { companyId: toValue(options?.companyId) }),
    ...(toValue(options?.jobId) && { jobId: toValue(options?.jobId) }),
    ...(toValue(options?.candidateId) && { candidateId: toValue(options?.candidateId) }),
    ...(toValue(options?.status) && { status: toValue(options?.status) }),
    ...(toValue(options?.search) && { search: toValue(options?.search) }),
  }))

  const { data, status: fetchStatus, error, refresh } = useFetch('/api/applications', {
    key: 'applications',
    query,
    headers: useRequestHeaders(['cookie']),
  })

  const applications = computed(() => data.value?.data ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const page = computed(() => data.value?.page ?? (toValue(options?.page) ?? 1))
  const limit = computed(() => data.value?.limit ?? (toValue(options?.limit) ?? 20))

  /** Create a new application (link candidate → job) and refresh the list */
  async function createApplication(payload: {
    candidateId: string
    jobId: string
    notes?: string
  }) {
    try {
      const created = await $fetch('/api/applications', {
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

  return {
    applications,
    total,
    page,
    limit,
    fetchStatus,
    error,
    refresh,
    createApplication,
  }
}
