export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  return { allowed: isPlatformOwner(session.user.id) }
})
