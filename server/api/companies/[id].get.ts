import { and, count, desc, eq } from 'drizzle-orm'
import { application, candidate, company, job } from '../../database/schema'
import { companyIdParamSchema } from '../../utils/schemas/company'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const orgId = session.session.activeOrganizationId
  const { id } = await getValidatedRouterParams(event, companyIdParamSchema.parse)

  const found = await db.query.company.findFirst({
    where: and(eq(company.id, id), eq(company.organizationId, orgId)),
  })

  if (!found) {
    throw createError({ statusCode: 404, statusMessage: 'Company not found' })
  }

  const [jobs, totalApplicationsRows, totalHiredRows, totalRejectedRows, recentCandidatesRaw] = await Promise.all([
    db.query.job.findMany({
      where: and(eq(job.organizationId, orgId), eq(job.companyId, id)),
      orderBy: [desc(job.createdAt)],
      columns: {
        id: true,
        title: true,
        status: true,
        location: true,
        type: true,
        createdAt: true,
      },
    }),
    db
      .select({
        totalApplications: count(application.id).as('total_applications'),
      })
      .from(application)
      .innerJoin(job, eq(job.id, application.jobId))
      .where(and(eq(application.organizationId, orgId), eq(job.companyId, id))),
    db
      .select({
        totalHired: count(application.id).as('total_hired'),
      })
      .from(application)
      .innerJoin(job, eq(job.id, application.jobId))
      .where(and(eq(application.organizationId, orgId), eq(job.companyId, id), eq(application.status, 'hired'))),
    db
      .select({
        totalRejected: count(application.id).as('total_rejected'),
      })
      .from(application)
      .innerJoin(job, eq(job.id, application.jobId))
      .where(and(eq(application.organizationId, orgId), eq(job.companyId, id), eq(application.status, 'rejected'))),
    db
      .select({
        candidateId: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        appliedAt: application.createdAt,
        applicationStatus: application.status,
      })
      .from(application)
      .innerJoin(job, eq(job.id, application.jobId))
      .innerJoin(candidate, eq(candidate.id, application.candidateId))
      .where(and(eq(application.organizationId, orgId), eq(job.companyId, id)))
      .orderBy(desc(application.createdAt))
      .limit(50),
  ])

  const activeJobs = jobs.filter((j) => j.status === 'open')
  const inactiveJobs = jobs.filter((j) => j.status !== 'open')

  const candidateMap = new Map<string, {
    id: string
    firstName: string
    lastName: string
    email: string
    appliedAt: Date
    applicationStatus: string
  }>()
  for (const row of recentCandidatesRaw) {
    if (!candidateMap.has(row.candidateId)) {
      candidateMap.set(row.candidateId, {
        id: row.candidateId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        appliedAt: row.appliedAt,
        applicationStatus: row.applicationStatus,
      })
    }
  }
  const candidates = Array.from(candidateMap.values())

  return {
    ...found,
    metrics: {
      activeJobs: activeJobs.length,
      inactiveJobs: inactiveJobs.length,
      totalApplications: totalApplicationsRows[0]?.totalApplications ?? 0,
      totalHired: totalHiredRows[0]?.totalHired ?? 0,
      totalRejected: totalRejectedRows[0]?.totalRejected ?? 0,
    },
    jobs,
    candidates,
    recentJobs: jobs.slice(0, 4),
    recentCandidates: candidates.slice(0, 4),
  }
})
