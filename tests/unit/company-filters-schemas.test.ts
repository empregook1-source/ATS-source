import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { candidateQuerySchema } from '../../server/utils/schemas/candidate'
import { interviewQuerySchema } from '../../server/utils/schemas/interview'

describe('companyId filters in list schemas', () => {
  it('declares companyId in jobs list query schema', () => {
    const source = readFileSync(join(process.cwd(), 'server/utils/schemas/job.ts'), 'utf8')
    expect(source).toContain('companyId: z.string().min(1).optional()')
  })

  it('accepts companyId in candidates list query', () => {
    const result = candidateQuerySchema.parse({ companyId: 'company-123' })
    expect(result.companyId).toBe('company-123')
  })

  it('declares companyId in applications list query schema', () => {
    const source = readFileSync(join(process.cwd(), 'server/utils/schemas/application.ts'), 'utf8')
    expect(source).toContain('companyId: z.string().min(1).optional()')
  })

  it('accepts companyId in interviews list query (uuid)', () => {
    const uuid = '9b8fa323-9d03-4f3f-8c2f-d0b97dc8f848'
    const result = interviewQuerySchema.parse({ companyId: uuid })
    expect(result.companyId).toBe(uuid)
  })

  it('rejects invalid interview companyId when not uuid', () => {
    expect(() => interviewQuerySchema.parse({ companyId: 'company-123' })).toThrow()
  })
})
