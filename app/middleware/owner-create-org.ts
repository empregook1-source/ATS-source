/**
 * Guards onboarding/create-org route access.
 * Auth is required, and users with an active org are redirected to dashboard.
 */
export default defineNuxtRouteMiddleware(async () => {
  const localePath = useLocalePath()
  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value) {
    return navigateTo(localePath('/auth/sign-in'))
  }

  // This onboarding route is also used to pick/join an org when the user has
  // no active organization. If there is an active org, only owners can access
  // this route to create additional organizations.
  if (!session.value.session.activeOrganizationId) {
    return
  }

  const { data, error } = await authClient.organization.getActiveMemberRole()
  if (error || data?.role !== 'owner') {
    return navigateTo(localePath('/dashboard'))
  }
})
