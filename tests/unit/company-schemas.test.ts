import { describe, expect, it } from 'vitest'
import {
  companyIdParamSchema,
  companyListQuerySchema,
  createCompanySchema,
  updateCompanySchema,
} from '../../server/utils/schemas/company'

describe('company schemas', () => {
  it('accepts create payload with required fields only', () => {
    const result = createCompanySchema.parse({ name: 'Acme' })
    expect(result.name).toBe('Acme')
    expect(result.isActive).toBe(true)
  })

  it('accepts create payload with all optional fields', () => {
    const result = createCompanySchema.parse({
      name: 'Acme',
      address: 'Street 1',
      city: 'Recife',
      state: 'PE',
      phone: '+55 81 99999-0000',
      responsibleName: 'Maria',
      description: 'Top client',
      isActive: false,
    })
    expect(result.isActive).toBe(false)
    expect(result.responsibleName).toBe('Maria')
  })

  it('rejects empty company name', () => {
    expect(() => createCompanySchema.parse({ name: '' })).toThrow()
  })

  it('accepts update payload with nullable fields', () => {
    const result = updateCompanySchema.parse({
      name: 'Renamed Co',
      address: null,
      city: null,
      description: null,
    })
    expect(result.name).toBe('Renamed Co')
    expect(result.address).toBeNull()
  })

  it('coerces list query defaults', () => {
    const result = companyListQuerySchema.parse({})
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
    expect(result.isActive).toBeUndefined()
  })

  it('transforms isActive string into boolean in list query', () => {
    const active = companyListQuerySchema.parse({ isActive: 'true' })
    const inactive = companyListQuerySchema.parse({ isActive: 'false' })
    expect(active.isActive).toBe(true)
    expect(inactive.isActive).toBe(false)
  })

  it('accepts company id param', () => {
    const result = companyIdParamSchema.parse({ id: 'company-1' })
    expect(result.id).toBe('company-1')
  })
})
