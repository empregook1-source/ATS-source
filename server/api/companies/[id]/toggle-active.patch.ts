import { and, eq } from 'drizzle-orm'
import { company, job } from '../../../database/schema'
import { companyIdParamSchema } from '../../../utils/schemas/company'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { company: ['update'] })
  const orgId = session.session.activeOrganizationId
  const { id } = await getValidatedRouterParams(event, companyIdParamSchema.parse)

  const existing = await db.query.company.findFirst({
    where: and(eq(company.id, id), eq(company.organizationId, orgId)),
    columns: { id: true, isActive: true, name: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Company not found' })
  }

  const nextIsActive = !existing.isActive
  const now = new Date()

  const updated = await db.transaction(async (tx) => {
    const [updatedCompany] = await tx.update(company)
      .set({
        isActive: nextIsActive,
        updatedAt: now,
      })
      .where(and(eq(company.id, id), eq(company.organizationId, orgId)))
      .returning()

    if (!updatedCompany) return null

    // When a company is deactivated, all currently open jobs must be closed.
    // When reactivating, job statuses must remain unchanged.
    if (!nextIsActive) {
      await tx.update(job)
        .set({
          status: 'closed',
          updatedAt: now,
        })
        .where(
          and(
            eq(job.organizationId, orgId),
            eq(job.companyId, id),
            eq(job.status, 'open'),
          ),
        )
    }

    return updatedCompany
  })

  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update company status' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'status_changed',
    resourceType: 'company',
    resourceId: updated.id,
    metadata: { isActive: updated.isActive, name: updated.name },
  })

  return updated
})
