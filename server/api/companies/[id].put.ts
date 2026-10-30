import { and, eq } from 'drizzle-orm'
import { company, job } from '../../database/schema'
import { companyIdParamSchema, updateCompanySchema } from '../../utils/schemas/company'
import { normalizePhoneForStorage } from '~~/shared/phone'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { company: ['update'] })
  const orgId = session.session.activeOrganizationId

  const { id } = await getValidatedRouterParams(event, companyIdParamSchema.parse)
  const body = await readValidatedBody(event, updateCompanySchema.parse)
  const phone = normalizePhoneForStorage(body.phone)
  const now = new Date()

  const updated = await db.transaction(async (tx) => {
    const existing = await tx.query.company.findFirst({
      where: and(eq(company.id, id), eq(company.organizationId, orgId)),
      columns: { id: true, isActive: true },
    })

    if (!existing) return null

    const [updatedCompany] = await tx.update(company)
      .set({
        name: body.name,
        address: body.address ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        phone: phone ?? null,
        email: body.email ?? null,
        responsibleName: body.responsibleName ?? null,
        description: body.description ?? null,
        isActive: body.isActive ?? undefined,
        updatedAt: now,
      })
      .where(and(eq(company.id, id), eq(company.organizationId, orgId)))
      .returning()

    if (!updatedCompany) return null

    const companyWasDeactivated = existing.isActive && body.isActive === false
    if (companyWasDeactivated) {
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
    throw createError({ statusCode: 404, statusMessage: 'Company not found' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'updated',
    resourceType: 'company',
    resourceId: updated.id,
    metadata: { name: updated.name },
  })

  return updated
})
