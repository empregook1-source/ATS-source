import { z } from 'zod'

export const companyIdParamSchema = z.object({
  id: z.string().min(1),
})

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email('Invalid email').max(320),
  responsibleName: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  isActive: z.boolean().optional().default(true),
})

export const updateCompanySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  address: z.string().max(300).nullish(),
  city: z.string().max(120).nullish(),
  state: z.string().max(120).nullish(),
  phone: z.string().max(50).nullish(),
  email: z.string().email('Invalid email').max(320),
  responsibleName: z.string().max(200).nullish(),
  description: z.string().max(5000).nullish(),
  isActive: z.boolean().optional(),
})

export const companyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((v: string) => v === 'true')
    .optional(),
})
