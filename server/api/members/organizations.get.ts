import { and, asc, eq } from 'drizzle-orm'
import { member, organization } from '../../database/schema'

/**
 * GET /api/members/organizations
 * Returns organization options for the member creation form.
 *
 * Rules:
 * - Requires `member:create`
 * - Admin gets only active organization
 * - Owner gets all organizations
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { member: ['create'] })
  const activeOrgId = session.session.activeOrganizationId

  const [requesterMember] = await db
    .select({ role: member.role })
    .from(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, activeOrgId),
      ),
    )
    .limit(1)

  if (!requesterMember) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: membership not found' })
  }

  if (requesterMember.role === 'owner') {
    return await db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      })
      .from(organization)
      .orderBy(asc(organization.name))
  }

  const [activeOrganization] = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
    })
    .from(organization)
    .where(eq(organization.id, activeOrgId))
    .limit(1)

  return activeOrganization ? [activeOrganization] : []
})
