import { z } from 'zod'
import { and, count, desc, ilike, isNull, or } from 'drizzle-orm'
import { resumeSubmission } from '../../../database/schema'

const querySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export default defineEventHandler(async (event) => {
  await requirePlatformOwner(event)
  const query = await getValidatedQuery(event, querySchema.parse)

  const active = isNull(resumeSubmission.consentRevokedAt)
  const term = query.search ? `%${query.search}%` : null
  const where = term
    ? and(active, or(
        ilike(resumeSubmission.fullName, term),
        ilike(resumeSubmission.email, term),
        ilike(resumeSubmission.phone, term),
        ilike(resumeSubmission.city, term),
      ))
    : active

  const [items, [filtered]] = await Promise.all([
    db.select({
      id: resumeSubmission.id,
      fullName: resumeSubmission.fullName,
      email: resumeSubmission.email,
      phone: resumeSubmission.phone,
      city: resumeSubmission.city,
      updatedAt: resumeSubmission.consentAt,
    })
      .from(resumeSubmission)
      .where(where)
      .orderBy(desc(resumeSubmission.consentAt))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
    db.select({ total: count() }).from(resumeSubmission).where(where),
  ])

  return {
    items,
    total: filtered?.total ?? 0,
    page: query.page,
    limit: query.limit,
  }
})
