import { and, count, desc, eq, ilike, inArray } from 'drizzle-orm'
import { application, company, job } from '../../database/schema'
import { companyListQuerySchema } from '../../utils/schemas/company'

type PipelineCounts = {
  new: number
  screening: number
  interview: number
  offer: number
  hired: number
  rejected: number
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const orgId = session.session.activeOrganizationId
  const query = await getValidatedQuery(event, companyListQuerySchema.parse)

  const offset = (query.page - 1) * query.limit
  const conditions = [eq(company.organizationId, orgId)]

  if (query.search) {
    const escaped = query.search.replace(/[%_\\]/g, '\\$&')
    conditions.push(ilike(company.name, `%${escaped}%`))
  }

  if (query.isActive !== undefined) {
    conditions.push(eq(company.isActive, query.isActive))
  }

  const where = and(...conditions)

  const [rows, total] = await Promise.all([
    db.query.company.findMany({
      where,
      orderBy: [desc(company.createdAt)],
      limit: query.limit,
      offset,
    }),
    db.$count(company, where),
  ])

  const companyIds = rows.map((row) => row.id)

  const totalJobsMap = new Map<string, number>()
  const pipelineMap = new Map<string, PipelineCounts>()

  if (companyIds.length > 0) {
    const [jobCountRows, pipelineRows] = await Promise.all([
      db
        .select({
          companyId: job.companyId,
          totalJobs: count(job.id).as('total_jobs'),
        })
        .from(job)
        .where(and(eq(job.organizationId, orgId), inArray(job.companyId, companyIds)))
        .groupBy(job.companyId),
      db
        .select({
          companyId: job.companyId,
          status: application.status,
          total: count(application.id).as('total'),
        })
        .from(application)
        .innerJoin(job, eq(job.id, application.jobId))
        .where(and(eq(application.organizationId, orgId), inArray(job.companyId, companyIds)))
        .groupBy(job.companyId, application.status),
    ])

    for (const row of jobCountRows) {
      if (!row.companyId) continue
      totalJobsMap.set(row.companyId, row.totalJobs)
    }

    for (const row of pipelineRows) {
      if (!row.companyId) continue
      const current = pipelineMap.get(row.companyId) ?? {
        new: 0,
        screening: 0,
        interview: 0,
        offer: 0,
        hired: 0,
        rejected: 0,
      }
      current[row.status as keyof PipelineCounts] = row.total
      pipelineMap.set(row.companyId, current)
    }
  }

  const data = rows.map((row) => ({
    ...row,
    totalJobs: totalJobsMap.get(row.id) ?? 0,
    pipeline: pipelineMap.get(row.id) ?? {
      new: 0,
      screening: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
    },
  }))

  return { data, total, page: query.page, limit: query.limit }
})
