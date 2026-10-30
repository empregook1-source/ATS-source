import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), 'utf8')
}

describe('member AI access rules', () => {
  it('allows scoring permissions for member role', () => {
    const permissionsSource = read('shared/permissions.ts')
    expect(permissionsSource).toContain("scoring: ['create', 'read', 'update']")
  })

  it('keeps global ai-analysis route blocked by owner-admin middleware', () => {
    const dashboardAiPage = read('app/pages/dashboard/ai-analysis.vue')
    expect(dashboardAiPage).toContain("middleware: ['auth', 'require-org', 'owner-admin-access']")
  })

  it('allows job ai-analysis route without owner-admin middleware', () => {
    const jobAiPage = read('app/pages/dashboard/jobs/[id]/ai-analysis.vue')
    expect(jobAiPage).toContain("middleware: ['auth', 'require-org']")
    expect(jobAiPage).not.toContain('owner-admin-access')
  })

  it('keeps AI Analysis hidden in topbar main nav for member', () => {
    const topbarSource = read('app/components/AppTopBar.vue')
    expect(topbarSource).toContain("const hiddenForMember = new Set(['Timeline', 'Source Tracking', 'Análise IA', 'Empresas'])")
  })
})
