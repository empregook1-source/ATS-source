import { eq, and, or, ilike, desc, sql } from 'drizzle-orm'
import { candidate, application, job, document } from '../../database/schema'
import { candidateQuerySchema } from '../../utils/schemas/candidate'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { candidate: ['read'] })
  const orgId = session.session.activeOrganizationId

  const query = await getValidatedQuery(event, candidateQuerySchema.parse)

  const offset = (query.page - 1) * query.limit
  const conditions = [eq(candidate.organizationId, orgId)]
  const hasSearch = Boolean(query.search?.trim())
  const searchTerm = query.search?.trim()
  const escaped = searchTerm ? searchTerm.replace(/[%_\\]/g, '\\$&') : ''
  const pattern = searchTerm ? `%${escaped}%` : undefined

  const resumeText = sql<string>`coalesce(${document.parsedContent}->>'text', '')`
  const resumeTextMatchesSearch = searchTerm
    ? sql<boolean>`to_tsvector('simple', ${resumeText}) @@ websearch_to_tsquery('simple', ${searchTerm})`
    : sql<boolean>`false`

  const relevanceScore = searchTerm
    ? sql<number>`(
        (case when ${candidate.firstName} ilike ${pattern} then 3 else 0 end) +
        (case when ${candidate.lastName} ilike ${pattern} then 3 else 0 end) +
        (case when ${candidate.email} ilike ${pattern} then 2 else 0 end) +
        coalesce(
          max(
            ts_rank_cd(
              to_tsvector('simple', ${resumeText}),
              websearch_to_tsquery('simple', ${searchTerm})
            )
          ),
          0
        )
      )::float`
    : sql<number>`0::float`

  if (searchTerm && pattern) {
    conditions.push(
      or(
        ilike(candidate.firstName, pattern),
        ilike(candidate.lastName, pattern),
        ilike(candidate.email, pattern),
        resumeTextMatchesSearch,
      )!,
    )
  }
  if (query.companyId) {
    conditions.push(eq(job.companyId, query.companyId))
  }

  const where = and(...conditions)

  const [data, total] = await Promise.all([
    db
      .select({
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
        applicationCount: sql<number>`count(distinct ${application.id})::int`,
        relevanceScore,
      })
      .from(candidate)
      .leftJoin(application, eq(application.candidateId, candidate.id))
      .leftJoin(job, eq(job.id, application.jobId))
      .leftJoin(
        document,
        and(
          eq(document.candidateId, candidate.id),
          eq(document.organizationId, orgId),
          eq(document.type, 'resume'),
        ),
      )
      .where(where)
      .groupBy(candidate.id)
      .orderBy(
        ...(hasSearch ? [desc(relevanceScore)] : []),
        desc(candidate.createdAt),
      )
      .limit(query.limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(distinct ${candidate.id})::int` })
      .from(candidate)
      .leftJoin(application, eq(application.candidateId, candidate.id))
      .leftJoin(job, eq(job.id, application.jobId))
      .leftJoin(
        document,
        and(
          eq(document.candidateId, candidate.id),
          eq(document.organizationId, orgId),
          eq(document.type, 'resume'),
        ),
      )
      .where(where)
      .then((rows) => rows[0]?.total ?? 0),
  ])

  return { data, total, page: query.page, limit: query.limit }
})
