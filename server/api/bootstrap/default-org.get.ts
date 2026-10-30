import { asc, eq } from 'drizzle-orm'
import { member } from '../../database/schema'

/**
 * Returns a deterministic default organization for the authenticated user.
 * Used to recover sessions that are valid but missing activeOrganizationId.
 */
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .orderBy(asc(member.createdAt))
    .limit(2)

  return {
    defaultOrganizationId: memberships[0]?.organizationId ?? null,
    organizationCount: memberships.length,
  }
})
