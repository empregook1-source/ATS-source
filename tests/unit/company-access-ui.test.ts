import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function read(relPath: string) {
  return readFileSync(join(process.cwd(), relPath), 'utf8')
}

describe('company access control configuration', () => {
  it('grants company CRUD for owner and admin, but denies member', () => {
    const permissionsSource = read('shared/permissions.ts')
    expect(permissionsSource).toContain("company: ['create', 'read', 'update', 'delete']")
    expect(permissionsSource).toContain('company: []')
  })

  it('keeps advanced features hidden for member in navbar', () => {
    const topbarSource = read('app/components/AppTopBar.vue')
    expect(topbarSource).toContain("{ label: 'Empresas', to: '/dashboard/empresas'")
    expect(topbarSource).toContain("const hiddenForMember = new Set(['Timeline', 'Rastreio de links', 'Análise IA', 'Empresas'])")
  })

  it('blocks member users from owner/admin routes in middleware', () => {
    const middlewareSource = read('app/middleware/owner-admin-access.ts')
    expect(middlewareSource).toContain("data?.role === 'member'")
    expect(middlewareSource).toContain("navigateTo(localePath('/dashboard'))")
  })
})

describe('company pages and frontend filters wiring', () => {
  it('contains all required empresas pages', () => {
    expect(existsSync(join(process.cwd(), 'app/pages/dashboard/empresas/index.vue'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'app/pages/dashboard/empresas/new.vue'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'app/pages/dashboard/empresas/[id]/index.vue'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'app/pages/dashboard/empresas/[id]/edit.vue'))).toBe(true)
  })

  it('includes companyId filter in list composables', () => {
    const jobs = read('app/composables/useJobs.ts')
    const candidates = read('app/composables/useCandidates.ts')
    const applications = read('app/composables/useApplications.ts')
    const interviews = read('app/composables/useInterviews.ts')

    expect(jobs).toContain('companyId')
    expect(candidates).toContain('companyId')
    expect(applications).toContain('companyId')
    expect(interviews).toContain('companyId')
  })
})
