import { eq, and, desc, ilike, or, sql } from 'drizzle-orm'
import { application, candidate, company, job } from '../../database/schema'
import { applicationQuerySchema } from '../../utils/schemas/application'

/**
 * GET /api/applications
 * List applications for the current organization.
 * Filterable by jobId, candidateId, and status. Paginated.
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { application: ['read'] })
  const orgId = session.session.activeOrganizationId

  const query = await getValidatedQuery(event, applicationQuerySchema.parse)

  const offset = (query.page - 1) * query.limit
  const conditions = [eq(application.organizationId, orgId)]

  if (query.jobId) {
    conditions.push(eq(application.jobId, query.jobId))
  }
  if (query.companyId) {
    conditions.push(eq(job.companyId, query.companyId))
  }
  if (query.candidateId) {
    conditions.push(eq(application.candidateId, query.candidateId))
  }
  if (query.status) {
    conditions.push(eq(application.status, query.status))
  }
  if (query.search) {
    const term = query.search.trim()
    const pattern = `%${term}%`
    conditions.push(
      or(
        ilike(candidate.firstName, pattern),
        ilike(candidate.lastName, pattern),
        ilike(candidate.email, pattern),
        ilike(job.title, pattern),
      )!,
    )
  }

  const where = and(...conditions)

  const [data, total] = await Promise.all([
    db
      .select({
        id: application.id,
        status: application.status,
        score: application.score,
        notes: application.notes,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        candidateId: application.candidateId,
        candidateFirstName: candidate.firstName,
        candidateLastName: candidate.lastName,
        candidateEmail: candidate.email,
        jobId: application.jobId,
        jobTitle: job.title,
        jobStatus: job.status,
        companyId: job.companyId,
        companyName: company.name,
      })
      .from(application)
      .innerJoin(candidate, eq(candidate.id, application.candidateId))
      .innerJoin(job, eq(job.id, application.jobId))
      .leftJoin(company, eq(company.id, job.companyId))
      .where(where)
      .orderBy(desc(application.createdAt))
      .limit(query.limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(application)
      .innerJoin(candidate, eq(candidate.id, application.candidateId))
      .innerJoin(job, eq(job.id, application.jobId))
      .leftJoin(company, eq(company.id, job.companyId))
      .where(where)
      .then((rows) => rows[0]?.total ?? 0),
  ])

  return { data, total, page: query.page, limit: query.limit }
})
