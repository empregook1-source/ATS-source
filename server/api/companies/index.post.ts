import { company } from '../../database/schema'
import { createCompanySchema } from '../../utils/schemas/company'
import { normalizePhoneForStorage } from '~~/shared/phone'

export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { company: ['create'] })
  const orgId = session.session.activeOrganizationId
  const body = await readValidatedBody(event, createCompanySchema.parse)
  const phone = normalizePhoneForStorage(body.phone)

  const [created] = await db.insert(company).values({
    organizationId: orgId,
    name: body.name,
    address: body.address,
    city: body.city,
    state: body.state,
    phone,
    email: body.email,
    responsibleName: body.responsibleName,
    description: body.description,
    isActive: body.isActive,
  }).returning()

  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to create company' })
  }

  recordActivity({
    organizationId: orgId,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'company',
    resourceId: created.id,
    metadata: { name: created.name },
  })

  setResponseStatus(event, 201)
  return created
})
