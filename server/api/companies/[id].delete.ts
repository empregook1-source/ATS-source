import { and, eq } from 'drizzle-orm'
import { company } from '../../database/schema'
import { companyIdParamSchema } from '../../utils/schemas/company'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { company: ['delete'] })
  const orgId = session.session.activeOrganizationId
  const { id } = await getValidatedRouterParams(event, companyIdParamSchema.parse)

  const [deleted] = await db.update(company)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(and(eq(company.id, id), eq(company.organizationId, orgId)))
    .returning({ id: company.id })

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Company not found' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'deleted',
    resourceType: 'company',
    resourceId: deleted.id,
  })

  setResponseStatus(event, 204)
  return null
})
