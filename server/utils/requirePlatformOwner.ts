import type { H3Event } from 'h3'

export function isPlatformOwner(userId: string): boolean {
  const ownerId = env.MATRIX_PLATFORM_OWNER_USER_ID
  return !!ownerId && ownerId === userId
}

/**
 * Require the authenticated user to be the platform owner
 * (`MATRIX_PLATFORM_OWNER_USER_ID`). Used for cross-organization data such as
 * resumes stored by the public resume builder.
 */
export async function requirePlatformOwner(event: H3Event) {
  const session = await requireAuth(event)

  if (!isPlatformOwner(session.user.id)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  return session
}
