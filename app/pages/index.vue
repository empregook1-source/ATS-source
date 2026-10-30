<script setup lang="ts">
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  CheckCheck,
  FileSearch,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-vue-next'
import { useCookieConsent } from '~/composables/useCookieConsent'

const localePath = useLocalePath()
const route = useRoute()
const { openPreferences: openCookiePreferences } = useCookieConsent()
const landingSearchTerm = ref('')

const landingSourceQuery = computed(() => {
  const q: Record<string, string> = {}
  if (route.query.ref) q.ref = route.query.ref as string
  if (route.query.utm_source) q.utm_source = route.query.utm_source as string
  if (route.query.utm_medium) q.utm_medium = route.query.utm_medium as string
  if (route.query.utm_campaign) q.utm_campaign = route.query.utm_campaign as string
  if (route.query.utm_term) q.utm_term = route.query.utm_term as string
  if (route.query.utm_content) q.utm_content = route.query.utm_content as string
  return q
})

const { data: latestJobsData } = await useFetch('/api/public/jobs', {
  key: 'landing-latest-public-jobs',
  query: {
    page: 1,
    limit: 4,
  },
})

const latestJobs = computed(() => latestJobsData.value?.data ?? [])

const candidateHighlights = [
  {
    icon: UserRound,
    title: 'Vagas alinhadas ao seu perfil',
    desc: 'Encontre oportunidades de acordo com suas habilidades e objetivos.',
  },
  {
    icon: Briefcase,
    title: 'Candidatura simplificada',
    desc: 'Candidate-se com poucos cliques e acompanhe o andamento dos processos.',
  },
  {
    icon: BadgeCheck,
    title: 'Feedback com qualidade',
    desc: 'Obtenha feedbacks de qualidade para evoluir na carreira.',
  },
]

const companyHighlights = [
  {
    icon: FileSearch,
    title: 'Seleção inteligente',
    desc: 'Nossa tecnologia identifica os melhores candidatos para a sua necessidade.',
  },
  {
    icon: Building2,
    title: 'Processo ágil e seguro',
    desc: 'Publique vagas, gerencie candidaturas e contrate com mais segurança.',
  },
  {
    icon: ShieldCheck,
    title: 'Candidatos qualificados',
    desc: 'Um banco de talentos preparado para diferentes áreas e niveis.',
  },
]

const steps = [
  {
    id: '01',
    title: 'Vagas',
    desc: 'Empresas publicam vagas com as melhores condições e benefícios.',
  },
  {
    id: '02',
    title: 'Candidaturas',
    desc: 'As pessoas se candidatam para as vagas publicadas por empresas.',
  },
  {
    id: '03',
    title: 'Conexão',
    desc: 'Nós conectamos as melhores oportunidades aos talentos com base em dados.',
  },
]

useHead({ title: 'Home' })
definePageMeta({ layout: false })

async function handleLandingSearch() {
  const term = landingSearchTerm.value.trim()

  await navigateTo({
    path: localePath('/vagas'),
    query: term ? { search: term } : undefined,
  })
}

function handleOpenCookiePreferences() {
  openCookiePreferences()
}
</script>

<template>
  <div class="landing-page relative min-h-screen overflow-x-clip bg-[#f6f2ff] text-slate-950 dark:bg-[#05010d] dark:text-slate-100">
    <div class="pointer-events-none absolute inset-0">
      <div class="landing-grid absolute inset-0 opacity-55 dark:opacity-80" />
      <div class="landing-noise absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" />
      <div class="landing-orb landing-orb-left" />
      <div class="landing-orb landing-orb-top" />
      <div class="landing-orb landing-orb-bottom" />
      <div class="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(246,242,255,0.93),rgba(246,242,255,0))] dark:bg-[linear-gradient(180deg,rgba(5,1,13,0.98),rgba(5,1,13,0))]" />
      <div class="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,rgba(246,242,255,0.95),rgba(246,242,255,0))] dark:bg-[linear-gradient(0deg,rgba(5,1,13,0.99),rgba(5,1,13,0))]" />
    </div>

    <PublicNavBar />

    <main class="relative mx-auto max-w-[1320px] px-4 pb-18 pt-28 sm:px-6 sm:pt-34 lg:pt-38">
      <section class="relative grid gap-12 pb-18 lg:grid-cols-2 lg:items-stretch lg:gap-16">
        <div class="relative flex h-full flex-col justify-center lg:py-8 lg:pr-4">

          <h1 class="mt-8 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-slate-950 sm:text-6xl xl:text-7xl dark:text-white">
            Seu próximo passo começa com a
            <span class="bg-[linear-gradient(135deg,#7c3aed_0%,#c084fc_50%,#ede9fe_100%)] bg-clip-text text-transparent dark:bg-[linear-gradient(135deg,#f5f3ff_0%,#c084fc_35%,#7c3aed_100%)]">
              oportunidade
            </span>
            certa.
          </h1>

          <p class="mt-8 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            A plataforma inteligente que conecta candidatos qualificados a empresas que buscam os melhores profissionais.
          </p>

          <div class="mt-6 flex flex-col gap-3 sm:flex-row">
            <NuxtLink
              :to="localePath('/vagas')"
              class="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/12 px-6 text-sm font-semibold text-violet-800 shadow-[0_0_40px_rgba(139,92,246,0.14)] backdrop-blur-xl transition hover:-translate-y-0.5 dark:text-violet-100"
            >
              Explorar vagas abertas
              <ArrowRight class="size-4" />
            </NuxtLink>
            <a
              href="https://wa.me/5591980238683?text=Sou%20empresa%20e%20quero%20contratar%20com%20a%20EmpregoOK"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-12 items-center justify-center rounded-full border border-slate-900/10 bg-white/55 px-6 text-sm font-semibold text-slate-700 backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:text-white"
            >
              Sou empresa e quero contratar
            </a>
          </div>
        </div>

        <aside class="relative pt-4 lg:flex lg:h-full lg:items-center lg:pt-0">
          <div class="absolute inset-x-8 top-0 h-40 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.38),transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(139,92,246,0.5),transparent_68%)]" />
          <div class="relative w-full overflow-hidden rounded-[34px] border border-white/35 bg-white/48 p-6 shadow-[0_30px_120px_-60px_rgba(76,29,149,0.55)] backdrop-blur-3xl dark:border-white/10 dark:bg-white/[0.035]">
            <div class="flex items-start justify-between gap-4">
              <div class="max-w-sm">
                <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200">
                  Painel de vagas
                </p>
                <h2 class="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">
                  Últimas vagas publicadas
                </h2>
              </div>

              <NuxtLink
                :to="localePath('/vagas')"
                class="inline-flex shrink-0 items-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6_0%,#7c3aed_40%,#4c1d95_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_18px_50px_-18px_rgba(109,40,217,0.8)] transition hover:scale-[1.01] hover:shadow-[0_22px_60px_-20px_rgba(109,40,217,0.9)]"
              >
                Ver todas
                <ArrowRight class="size-4" />
              </NuxtLink>
            </div>

            <div v-if="latestJobs.length" class="landing-jobs mt-6 space-y-3">
              <PublicJobListItem
                v-for="job in latestJobs"
                :key="job.id"
                :job="job"
                :to="{ path: localePath(`/vagas/${job.slug}`), query: landingSourceQuery }"
                compact
              />
            </div>

            <div
              v-else
              class="mt-6 rounded-[28px] border border-dashed border-white/35 bg-white/45 px-5 py-8 text-sm leading-7 text-slate-600 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
            >
              Nenhuma vaga publicada no momento. Acesse a página de vagas para acompanhar novas oportunidades.
            </div>
          </div>
        </aside>
      </section>

      <section class="relative pb-18">
        <div class="relative overflow-hidden rounded-[34px] border border-white/35 bg-white/45 p-6 shadow-[0_25px_90px_-60px_rgba(76,29,149,0.55)] backdrop-blur-3xl dark:border-white/10 dark:bg-white/[0.035] sm:p-8">
          <div class="absolute inset-x-10 top-0 h-32 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.32),transparent_70%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(139,92,246,0.45),transparent_68%)]" />
          <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700 dark:text-violet-200">
                Currículo
              </p>
              <h2 class="mt-3 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white sm:text-3xl">
                Crie seu currículo gratuitamente
              </h2>
            </div>

            <NuxtLink
              :to="{ path: localePath('/curriculo/criar'), query: { returnTo: route.fullPath } }"
              class="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8b5cf6_0%,#7c3aed_40%,#4c1d95_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_50px_-18px_rgba(109,40,217,0.8)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-20px_rgba(109,40,217,0.9)]"
            >
              Criar meu currículo
              <ArrowRight class="size-4" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <section class="relative grid gap-10 border-t border-slate-900/8 py-18 dark:border-white/8 lg:grid-cols-2">
        <article id="talentos" class="relative">
          <div class="max-w-xl">
            <div class="inline-flex rounded-2xl border border-violet-400/25 bg-violet-500/10 p-3 text-violet-700 shadow-[0_0_30px_rgba(139,92,246,0.14)] dark:text-violet-200">
              <Briefcase class="size-5" />
            </div>
            <h2 class="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
              Para quem busca vaga
            </h2>
            <p class="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
              Descubra oportunidades, desenvolva suas habilidades e dê o próximo passo na sua carreira.
            </p>
          </div>

          <div class="mt-10 grid gap-4">
            <div
              v-for="item in candidateHighlights"
              :key="item.title"
              class="flex gap-4 rounded-[28px] border border-white/35 bg-white/40 p-5 backdrop-blur-2xl transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-700 dark:text-violet-200">
                <component :is="item.icon" class="size-4.5" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-slate-950 dark:text-white">{{ item.title }}</h3>
                <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ item.desc }}</p>
              </div>
            </div>
          </div>

          <NuxtLink
            :to="localePath('/vagas')"
            class="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/12 px-6 text-sm font-semibold text-violet-800 backdrop-blur-xl transition hover:-translate-y-0.5 dark:text-violet-100"
          >
            Ver vagas disponíveis
            <ArrowRight class="size-4" />
          </NuxtLink>
        </article>

        <article id="empresas" class="relative">
          <div class="max-w-xl">
            <div class="inline-flex rounded-2xl border border-violet-400/25 bg-violet-500/10 p-3 text-violet-700 shadow-[0_0_30px_rgba(139,92,246,0.14)] dark:text-violet-200">
              <Building2 class="size-5" />
            </div>
            <h2 class="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
              Para empresas
            </h2>
            <p class="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
              Encontre os profissionais ideais para sua empresa com agilidade e assertividade.
            </p>
          </div>

          <div class="mt-10 grid gap-4">
            <div
              v-for="item in companyHighlights"
              :key="item.title"
              class="flex gap-4 rounded-[28px] border border-white/35 bg-white/40 p-5 backdrop-blur-2xl transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-500/10 text-violet-700 dark:text-violet-200">
                <component :is="item.icon" class="size-4.5" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-slate-950 dark:text-white">{{ item.title }}</h3>
                <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ item.desc }}</p>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/5591980238683?text=Sou%20empresa%20e%20quero%20falar%20com%20consultor"
            target="_blank"
            rel="noopener noreferrer"
            class="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-900/10 bg-white/55 px-6 text-sm font-semibold text-slate-700 backdrop-blur-xl transition hover:-translate-y-0.5 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:hover:text-white"
          >
            Falar com consultor
            <ArrowRight class="size-4" />
          </a>
        </article>
      </section>

      <section id="como-funciona" class="relative border-t border-slate-900/8 py-18 dark:border-white/8">
        <div class="max-w-3xl">
          <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500">Como funciona</p>
          <h2 class="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl dark:text-white">
            Um fluxo simples para acelerar decisões.
          </h2>
        </div>

        <div class="mt-12 grid gap-5 md:grid-cols-3">
          <article
            v-for="step in steps"
            :key="step.id"
            class="rounded-[30px] border border-white/35 bg-white/38 p-6 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div class="inline-flex items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-violet-700 dark:text-violet-200">
              {{ step.id }}
            </div>
            <h3 class="mt-6 text-xl font-bold tracking-[-0.03em] text-slate-950 dark:text-white">{{ step.title }}</h3>
            <p class="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ step.desc }}</p>
          </article>
        </div>
      </section>

      <section class="relative overflow-hidden border-t border-slate-900/8 py-18 dark:border-white/8">
        <div class="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.34),transparent_68%)] blur-3xl dark:bg-[radial-gradient(circle,rgba(139,92,246,0.42),transparent_68%)]" />
        <div class="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <h2 class="mt-4 text-4xl font-black leading-[0.96] tracking-[-0.05em] text-slate-950 sm:text-6xl dark:text-white">
              Sua nova oportunidade
              <span class="block text-violet-700 dark:text-violet-300">está a um clique.</span>
            </h2>
          </div>

          <div class="flex w-full max-w-md flex-col gap-3">
            <NuxtLink
              :to="localePath('/vagas')"
              class="inline-flex h-13 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6_0%,#7c3aed_40%,#4c1d95_100%)] px-6 text-sm font-semibold text-white shadow-[0_18px_60px_-22px_rgba(109,40,217,0.85)] transition hover:scale-[1.01]"
            >
              Quero me candidatar
            </NuxtLink>
            <a
              href="https://wa.me/5591980238683?text=Sou%20empresa%20e%20quero%20fazer%20parte"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex h-13 items-center justify-center rounded-full border border-white/35 bg-white/48 px-6 text-sm font-semibold text-slate-800 backdrop-blur-xl transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
            >
              Sou empresa
            </a>
          </div>
        </div>
      </section>

      <footer class="border-t border-slate-900/8 py-8 dark:border-white/8">
        <div class="flex flex-col gap-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
          <div class="flex items-center gap-2">
            <img src="/eagle-mascot-logo-128.png" alt="EmpregoOK" class="h-5 w-5 rounded-md">
            <span>Emprego OK</span>
          </div>
          <p>© 2026 Emprego OK. Todos os direitos reservados.</p>
          <div class="flex flex-wrap items-center gap-4">
            <button type="button" class="transition hover:text-slate-950 dark:hover:text-white" @click="handleOpenCookiePreferences">Cookies</button>
            <NuxtLink :to="localePath('/termos-de-uso')" class="transition hover:text-slate-950 dark:hover:text-white">Termos de uso</NuxtLink>
            <NuxtLink :to="localePath('/politica-de-privacidade')" class="transition hover:text-slate-950 dark:hover:text-white">Política de privacidade</NuxtLink>
            <SourceCodeLink />
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.landing-grid {
  background-image:
    linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-position: center;
  background-size: 72px 72px;
  mask-image: radial-gradient(circle at center, black 38%, transparent 85%);
}

.dark .landing-grid {
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.045) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.045) 1px, transparent 1px);
}

.landing-noise {
  background-image:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.7) 0.5px, transparent 0.5px),
    radial-gradient(circle at 80% 30%, rgba(255, 255, 255, 0.45) 0.5px, transparent 0.5px),
    radial-gradient(circle at 30% 70%, rgba(255, 255, 255, 0.4) 0.5px, transparent 0.5px);
  background-size: 26px 26px, 32px 32px, 38px 38px;
}

.landing-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(96px);
  opacity: 0.55;
  animation: float-orb 20s ease-in-out infinite;
}

.landing-orb-left {
  left: -12rem;
  top: 16rem;
  height: 24rem;
  width: 24rem;
  background:
    radial-gradient(circle, rgba(192, 132, 252, 0.2) 0%, rgba(124, 58, 237, 0.12) 36%, transparent 70%);
}

.landing-orb-top {
  right: -8rem;
  top: 1rem;
  height: 20rem;
  width: 20rem;
  background:
    radial-gradient(circle, rgba(167, 139, 250, 0.18) 0%, rgba(109, 40, 217, 0.11) 42%, transparent 72%);
  animation-delay: -4s;
}

.landing-orb-bottom {
  bottom: 4rem;
  left: 45%;
  height: 18rem;
  width: 18rem;
  background:
    radial-gradient(circle, rgba(216, 180, 254, 0.14) 0%, rgba(124, 58, 237, 0.09) 42%, transparent 72%);
  animation-delay: -8s;
}

.landing-search {
  border: 1px solid rgba(255, 255, 255, 0.42);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.3));
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.12),
    0 24px 100px -45px rgba(109, 40, 217, 0.8);
}

.dark .landing-search {
  border-color: rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.028));
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 30px 120px -50px rgba(109, 40, 217, 0.9);
}

.landing-jobs :deep(a) {
  border-radius: 24px;
  border-color: rgba(255, 255, 255, 0.35);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.28));
  box-shadow: 0 20px 60px -42px rgba(76, 29, 149, 0.42);
  backdrop-filter: blur(24px);
}

.landing-jobs :deep(a:hover) {
  border-color: rgba(139, 92, 246, 0.4);
  transform: translateY(-2px);
}

.dark .landing-jobs :deep(a) {
  border-color: rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.025));
  box-shadow: 0 24px 80px -48px rgba(139, 92, 246, 0.55);
}

.landing-jobs :deep(h2) {
  letter-spacing: -0.02em;
}

.landing-jobs :deep(svg) {
  transition: color 0.2s ease;
}

@keyframes float-orb {
  0%,
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  50% {
    transform: translate3d(0, -18px, 0) scale(1.06);
  }
}
</style>
