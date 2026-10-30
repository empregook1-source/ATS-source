/**
 * Members cannot access the settings area.
 */
export default defineNuxtRouteMiddleware(async () => {
  const localePath = useLocalePath()
  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value) {
    return navigateTo(localePath('/auth/sign-in'))
  }

  if (!session.value.session.activeOrganizationId) {
    return navigateTo(localePath('/onboarding/create-org'))
  }

  const { data, error } = await authClient.organization.getActiveMemberRole()
  if (error || data?.role === 'member') {
    return navigateTo(localePath('/dashboard'))
  }
})
