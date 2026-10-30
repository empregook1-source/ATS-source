/**
 * Guest middleware — redirects authenticated users away from auth pages.
 * Apply to sign-in, sign-up, etc. to prevent logged-in users from seeing them.
 *
 * If the user arrived with a pending invitation (via ?invitation=<id>),
 * redirect to the accept-invitation page so it auto-accepts.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.useSession(useFetch)
  const localePath = useLocalePath()
  const isSignInRoute = to.path.endsWith('/auth/sign-in')
  const isSignUpRoute = to.path.endsWith('/auth/sign-up')

  if (session.value) {
    const pendingInvitation = to.query.invitation as string | undefined
    if (pendingInvitation) {
      return navigateTo(localePath(`/auth/accept-invitation/${pendingInvitation}`))
    }
    return navigateTo(localePath('/dashboard'))
  }

  try {
    const setup = await $fetch<{ hasOwner: boolean }>('/api/bootstrap/status')

    // First install: force account bootstrap via sign-up.
    if (!setup.hasOwner && isSignInRoute) {
      return navigateTo(localePath('/auth/sign-up'))
    }

    // After bootstrap: prevent new public registrations.
    if (setup.hasOwner && isSignUpRoute) {
      return navigateTo(localePath('/auth/sign-in'))
    }
  }
  catch {
    // If setup check fails, keep default guest behavior.
  }
})
