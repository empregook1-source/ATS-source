import type { MaybeRefOrGetter } from 'vue'

export interface CompanyPipelineMetrics {
  new: number
  screening: number
  interview: number
  offer: number
  hired: number
  rejected: number
}

export interface CompanyListItem {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  phone: string | null
  email: string | null
  responsibleName: string | null
  description: string | null
  isActive: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
  totalJobs: number
  pipeline: CompanyPipelineMetrics
}

interface CompanyListResponse {
  data: CompanyListItem[]
  total: number
  page: number
  limit: number
}

export function useCompanies(options?: {
  search?: MaybeRefOrGetter<string | undefined>
  isActive?: MaybeRefOrGetter<boolean | undefined>
  limit?: MaybeRefOrGetter<number | undefined>
}) {
  const { handlePreviewReadOnlyError } = usePreviewReadOnly()

  const query = computed(() => {
    const q: Record<string, string | number | boolean> = {}
    if (options?.search) {
      const search = toValue(options.search)
      if (search) q.search = search
    }
    if (options?.isActive !== undefined) {
      const isActive = toValue(options.isActive)
      if (typeof isActive === 'boolean') q.isActive = isActive
    }
    if (options?.limit) {
      const limit = toValue(options.limit)
      if (typeof limit === 'number') q.limit = limit
    }
    return q
  })

  const fetchKey = computed(() => {
    const parts = ['companies']
    const q = query.value
    for (const [key, value] of Object.entries(q)) {
      parts.push(`${key}:${String(value)}`)
    }
    return parts.join('-')
  })

  const { data, status, error, refresh } = useFetch<CompanyListResponse>('/api/companies', {
    key: fetchKey,
    query,
    headers: useRequestHeaders(['cookie']),
  })

  const companies = computed(() => data.value?.data ?? [])
  const total = computed(() => data.value?.total ?? 0)

  async function createCompany(payload: {
    name: string
    address?: string
    city?: string
    state?: string
    phone?: string
    email: string
    responsibleName?: string
    description?: string
    isActive?: boolean
  }) {
    try {
      const created = await $fetch('/api/companies', {
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

  async function updateCompany(id: string, payload: {
    name: string
    address?: string | null
    city?: string | null
    state?: string | null
    phone?: string | null
    email: string
    responsibleName?: string | null
    description?: string | null
    isActive?: boolean
  }) {
    try {
      const updated = await $fetch(`/api/companies/${id}`, {
        method: 'PUT',
        body: payload,
      })
      await refresh()
      return updated
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  async function deleteCompany(id: string) {
    try {
      await $fetch(`/api/companies/${id}`, { method: 'DELETE' })
      await refresh()
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  async function toggleCompanyActive(id: string) {
    try {
      const updated = await $fetch(`/api/companies/${id}/toggle-active`, { method: 'PATCH' })
      await refresh()
      return updated
    } catch (error) {
      handlePreviewReadOnlyError(error)
      throw error
    }
  }

  return {
    companies,
    total,
    status,
    error,
    refresh,
    createCompany,
    updateCompany,
    deleteCompany,
    toggleCompanyActive,
  }
}
