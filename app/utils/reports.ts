import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  Users,
} from 'lucide-vue-next'
import type { ReportMetricKey } from '~~/shared/reports'

export type ReportSectionItem = {
  key: ReportMetricKey
  label: string
  subtitle: string
  icon: typeof Building2
}

export const reportSectionItems: ReportSectionItem[] = [
  {
    key: 'companies',
    label: 'Empresas',
    subtitle: 'Crescimento e status de cadastro',
    icon: Building2,
  },
  {
    key: 'jobs',
    label: 'Vagas',
    subtitle: 'Volume de vagas criadas',
    icon: Briefcase,
  },
  {
    key: 'candidates',
    label: 'Candidatos',
    subtitle: 'Entrada de novos perfis',
    icon: Users,
  },
  {
    key: 'applications',
    label: 'Candidaturas',
    subtitle: 'Fluxo de candidaturas recebidas',
    icon: FileText,
  },
  {
    key: 'interviews',
    label: 'Entrevistas',
    subtitle: 'Agendamentos criados ao longo do tempo',
    icon: Calendar,
  },
  {
    key: 'resumes',
    label: 'Currículos Criados',
    subtitle: 'Criação de novos currículos',
    icon: FileText,
  },
]

export function getReportSectionItem(key: ReportMetricKey) {
  return reportSectionItems.find(item => item.key === key) ?? reportSectionItems[0]!
}

export const reportsSectionIcon = BarChart3
