import type { Ref } from 'vue'

/**
 * Composable for managing the jobs list with filtering, pagination, and mutations.
 * Wraps `useFetch('/api/jobs')` with a singleton key for shared state.
 */
export function useJobs(options?: {
  status?: Ref<string | undefined> | string
  companyId?: Ref<string | undefined> | string
  search?: Ref<string | undefined> | string
  page?: Ref<number> | number
  limit?: Ref<number> | number
}) {
  const { handlePreviewReadOnlyError } = usePreviewReadOnly()

  const query = computed(() => ({
    page: toValue(options?.page) ?? 1,
    limit: toValue(options?.limit) ?? 20,
    ...(toValue(options?.status) && { status: toValue(options?.status) }),
    ...(toValue(options?.companyId) && { companyId: toValue(options?.companyId) }),
    ...(toValue(options?.search) && { search: toValue(options?.search) }),
  }))

  const { data, status: fetchStatus, error, refresh } = useFetch('/api/jobs', {
    key: 'jobs',
    query,
    headers: useRequestHeaders(['cookie']),
  })

  const jobs = computed(() => data.value?.data ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const page = computed(() => data.value?.page ?? (toValue(options?.page) ?? 1))
  const limit = computed(() => data.value?.limit ?? (toValue(options?.limit) ?? 20))

  /** Create a new job and refresh the list */
  async function createJob(payload: {
    title: string
    companyId?: string
    description?: string
    location?: string
    type?: 'full_time' | 'part_time' | 'contract' | 'internship'
    remoteStatus?: 'remote' | 'hybrid' | 'onsite'
    requireResume?: boolean
    requireCoverLetter?: boolean
    autoScoreOnApply?: boolean
  }) {
    try {
      const created = await $fetch('/api/jobs', {
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

  /** Delete a job by ID and refresh the list */
  async function deleteJob(id: string) {
    try {
      await $fetch(`/api/jobs/${id}`, { method: 'DELETE' })
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
    await refresh()
  }

  return {
    jobs,
    total,
    page,
    limit,
    fetchStatus,
    error,
    refresh,
    createJob,
    deleteJob,
  }
}
