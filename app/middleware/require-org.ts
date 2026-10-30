/**
 * Require-org middleware — redirects users without an active organization
 * to the org creation page. Must be used after the `auth` middleware.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)
  const localePath = useLocalePath()

  if (session.value && !session.value.session.activeOrganizationId) {
    try {
      const data = await $fetch<{ defaultOrganizationId: string | null }>('/api/bootstrap/default-org')

      if (data.defaultOrganizationId) {
        const result = await authClient.organization.setActive({
          organizationId: data.defaultOrganizationId,
        })

        if (!result.error) {
          clearNuxtData()
          return navigateTo(to.fullPath, { replace: true })
        }
      }
    }
    catch {
      // Fallback below keeps previous behavior.
    }

    return navigateTo(localePath('/onboarding/create-org'))
  }
})
