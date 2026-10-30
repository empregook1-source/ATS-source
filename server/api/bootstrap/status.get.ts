import { isUserOwner, systemHasOwner } from '../../utils/bootstrap'

/**
 * Public bootstrap status used by auth/onboarding UI guards.
 *
 * - `hasOwner`: whether the system already has at least one owner membership
 * - `allowPublicSignUp`: only true on first-install bootstrap (no owners yet)
 * - `canCreateOrganization`: true for bootstrap phase or authenticated owners
 */
export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  const hasOwner = await systemHasOwner()

  let canCreateOrganization = false

  if (!hasOwner) {
    canCreateOrganization = Boolean(session)
  }
  else if (session) {
    canCreateOrganization = await isUserOwner(session.user.id)
  }

  return {
    hasOwner,
    allowPublicSignUp: !hasOwner,
    canCreateOrganization,
  }
})
