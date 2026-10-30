export default defineEventHandler((event) => {
  const path = getRouterParam(event, 'path')
  const rawQuery = getQuery(event)
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(rawQuery)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null) params.append(key, String(item))
      }
    } else if (value != null) {
      params.append(key, String(value))
    }
  }

  const suffix = path ? `/${path}` : ''
  const query = params.toString()
  const target = `/vagas${suffix}${query ? `?${query}` : ''}`

  return sendRedirect(event, target, 301)
})
