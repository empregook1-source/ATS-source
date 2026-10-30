export { SYSTEM_TEMPLATES } from '~~/shared/system-templates'
export type { SystemTemplate } from '~~/shared/system-templates'

export const AVAILABLE_VARIABLES = [
  { key: '{{candidateName}}', desc: 'Nome completo' },
  { key: '{{candidateFirstName}}', desc: 'Primeiro nome' },
  { key: '{{candidateLastName}}', desc: 'Sobrenome' },
  { key: '{{candidateEmail}}', desc: 'Endereço de e-mail' },
  { key: '{{jobTitle}}', desc: 'Título da vaga' },
  { key: '{{interviewTitle}}', desc: 'Título da entrevista' },
  { key: '{{interviewDate}}', desc: 'Data da entrevista' },
  { key: '{{interviewTime}}', desc: 'Horário da entrevista' },
  { key: '{{interviewDuration}}', desc: 'Duração (min)' },
  { key: '{{interviewType}}', desc: 'Tipo de entrevista' },
  { key: '{{interviewLocation}}', desc: 'Local/link' },
  { key: '{{interviewers}}', desc: 'Nomes dos entrevistadores' },
  { key: '{{organizationName}}', desc: 'Nome da sua organização' },
] as const

export function renderTemplatePreview(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return key in variables ? variables[key]! : match
  })
}
