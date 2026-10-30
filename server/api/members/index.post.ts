import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { member, organization, user } from '../../database/schema'

const createMemberUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  role: z.enum(['admin', 'member']).default('member'),
  organizationId: z.string().min(1),
})

/**
 * POST /api/members
 * Create a new user with email/password and attach to an organization.
 *
 * Rules:
 * - Requires `member:create`
 * - Admin can only create users in the active organization
 * - Owner can create users in any organization
 */
export default defineEventHandler(async (event) => {
  const session = await requirePermission(event, { member: ['create'] })
  const activeOrgId = session.session.activeOrganizationId
  const body = await readValidatedBody(event, createMemberUserSchema.parse)
  const normalizedEmail = body.email.trim().toLowerCase()

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

  if (requesterMember.role !== 'owner' && body.organizationId !== activeOrgId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admins can only create users in the active organization',
    })
  }

  const [targetOrg] = await db
    .select({ id: organization.id, name: organization.name })
    .from(organization)
    .where(eq(organization.id, body.organizationId))
    .orderBy(asc(organization.name))
    .limit(1)

  if (!targetOrg) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
  }

  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(sql`LOWER(${user.email}) = ${normalizedEmail}`)
    .limit(1)

  if (existingUser) {
    throw createError({
      statusCode: 409,
      statusMessage: 'A user with this email already exists',
    })
  }

  let createdUserId: string | undefined

  try {
    const signUpResult = await auth.api.signUpEmail({
      headers: new Headers(),
      body: {
        email: normalizedEmail,
        password: body.password,
        name: body.name,
      },
    })

    createdUserId = signUpResult.user.id
  }
  catch (error: any) {
    throw createError({
      statusCode: 400,
      statusMessage: error?.message || 'Failed to create user',
    })
  }

  if (!createdUserId) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to resolve created user' })
  }

  const [newMembership] = await db
    .insert(member)
    .values({
      id: crypto.randomUUID(),
      userId: createdUserId,
      organizationId: targetOrg.id,
      role: body.role,
    })
    .onConflictDoNothing({ target: [member.userId, member.organizationId] })
    .returning({ id: member.id })

  if (!newMembership) {
    throw createError({
      statusCode: 409,
      statusMessage: 'User is already a member of this organization',
    })
  }

  recordActivity({
    organizationId: targetOrg.id,
    actorId: session.user.id,
    action: 'created',
    resourceType: 'member',
    resourceId: newMembership.id,
    metadata: {
      source: 'settings_members',
      role: body.role,
      email: normalizedEmail,
      name: body.name,
    },
  })

  setResponseStatus(event, 201)
  return {
    success: true,
    email: normalizedEmail,
    organization: {
      id: targetOrg.id,
      name: targetOrg.name,
    },
  }
})
