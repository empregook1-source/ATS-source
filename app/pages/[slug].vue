<script setup lang="ts">
import { ArrowLeft, Briefcase, ChevronRight, MapPin } from 'lucide-vue-next'

definePageMeta({
  layout: 'public',
})

const route = useRoute()
const localePath = useLocalePath()
const organizationSlug = route.params.slug as string

type PublicOrganizationJobsResponse = {
  organization: {
    id: string
    name: string
    slug: string
    logo: string | null
  }
  jobs: Array<{
    id: string
    title: string
    slug: string
    description: string | null
    location: string | null
    type: string
    createdAt: string
  }>
}

/** Forward source-tracking query params (?ref=, utm_*) through navigation */
const sourceQuery = computed(() => {
  const q: Record<string, string> = {}
  if (route.query.ref) q.ref = route.query.ref as string
  if (route.query.utm_source) q.utm_source = route.query.utm_source as string
  if (route.query.utm_medium) q.utm_medium = route.query.utm_medium as string
  if (route.query.utm_campaign) q.utm_campaign = route.query.utm_campaign as string
  if (route.query.utm_term) q.utm_term = route.query.utm_term as string
  if (route.query.utm_content) q.utm_content = route.query.utm_content as string
  return q
})

const { data, status, error } = await useFetch<PublicOrganizationJobsResponse>(`/api/public/organizations/${organizationSlug}`, {
  key: `public-organization-jobs-${organizationSlug}`,
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: error.value.statusMessage ?? 'Organization not found',
  })
}

const org = computed(() => data.value?.organization)
const jobs = computed(() => data.value?.jobs ?? [])

const typeLabels: Record<string, string> = {
  full_time: 'Tempo integral',
  part_time: 'Meio período',
  contract: 'Temporário',
  internship: 'Estágio',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

useSeoMeta({
  title: computed(() => org.value ? `Vagas da ${org.value.name}` : 'Vagas da organização'),
  description: computed(() => org.value
    ? `Veja as vagas abertas da organização ${org.value.name}.`
    : 'Veja as vagas abertas desta organização.'),
  ogTitle: computed(() => org.value ? `Vagas da ${org.value.name}` : 'Vagas da organização'),
  ogDescription: computed(() => org.value
    ? `Confira as oportunidades abertas na ${org.value.name}.`
    : 'Confira as oportunidades abertas desta organização.'),
  ogType: 'website',
})
</script>

<template>
  <div>
    <NuxtLink
      :to="localePath('/vagas')"
      class="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-800 dark:hover:text-surface-200 transition-colors mb-5"
    >
      <ArrowLeft class="size-3.5" />
      Todas as vagas
    </NuxtLink>

    <div class="mb-7">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
        {{ org?.name ?? 'Organização' }}
      </h1>
      <p class="text-sm text-surface-500 mt-1">
        Vagas abertas desta organização.
      </p>
    </div>

    <div v-if="status === 'pending'" class="text-center py-16 text-surface-400">
      Carregando vagas...
    </div>

    <div
      v-else-if="jobs.length === 0"
      class="rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-12 text-center"
    >
      <Briefcase class="size-10 text-surface-300 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-surface-700 dark:text-surface-300 mb-1">Sem vagas abertas no momento</h3>
      <p class="text-sm text-surface-500">
        Essa organização ainda não possui vagas publicadas.
      </p>
    </div>

    <div v-else class="space-y-3">
      <NuxtLink
        v-for="job in jobs"
        :key="job.id"
        :to="{ path: localePath(`/vagas/${job.slug}`), query: sourceQuery }"
        class="block rounded-lg border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 px-5 py-4 hover:border-surface-300 dark:hover:border-surface-700 hover:shadow-sm transition-all group"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <h2 class="text-base font-semibold text-surface-900 dark:text-surface-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {{ job.title }}
            </h2>

            <div class="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-surface-500">
              <span class="inline-flex items-center gap-1">
                <Briefcase class="size-3.5" />
                {{ typeLabels[job.type] ?? job.type }}
              </span>
              <span v-if="job.location" class="inline-flex items-center gap-1">
                <MapPin class="size-3.5" />
                {{ job.location }}
              </span>
              <span class="text-surface-400">
                Publicada em {{ formatDate(job.createdAt) }}
              </span>
            </div>
          </div>

          <ChevronRight class="size-5 text-surface-300 group-hover:text-brand-500 shrink-0 mt-1 transition-colors" />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
