export const SCHOOLING_LEVELS = ['Ensino Fundamental', 'Ensino Médio', 'Ensino Técnico', 'Ensino Superior'] as const

export const SCHOOLING_STATUSES = ['Completo', 'Incompleto'] as const

/** Only technical and higher education have a course name. */
export function schoolingHasCourse(level: string): boolean {
  const normalized = level.trim()
  return normalized === 'Ensino Técnico' || normalized === 'Ensino Superior'
}

/** Maps free-text schooling from older drafts (e.g. "Superior — Incompleto") to level + status. */
export function parseLegacySchooling(value: string): { level: string; status: string } {
  const text = value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const level = text.includes('superior')
    ? 'Ensino Superior'
    : text.includes('tecnico')
      ? 'Ensino Técnico'
      : text.includes('medio')
        ? 'Ensino Médio'
        : text.includes('fundamental')
          ? 'Ensino Fundamental'
          : ''
  const status = text.includes('incompleto') ? 'Incompleto' : text.includes('completo') ? 'Completo' : ''
  return { level, status }
}

/** Bump when the resume builder terms change; stored with each consent. */
export const RESUME_TERMS_VERSION = '1.0'
