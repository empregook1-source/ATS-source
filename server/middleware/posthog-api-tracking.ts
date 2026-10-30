// Paths that generate high volume with zero debugging value.
const EXCLUDED_PATHS = new Set(['/api/health', '/api/healthz', '/api/ping'])

export default defineEventHandler(async (event) => {
  const path = event.path || event.node.req.url || ''

  // Only track API routes — skip static assets, ingest proxy, etc.
  if (!path.startsWith('/api/')) return

  // Exclude high-frequency health checks / load balancer pings
  if (EXCLUDED_PATHS.has(path)) return

  const start = Date.now()

  event.node.res.on('finish', () => {
    try {
      const duration = Date.now() - start
      const statusCode = event.node.res.statusCode
      const method = getMethod(event)

      const isError = statusCode >= 400
      const isSlow = duration > 3000

      const logAttrs: Record<string, string | number | boolean | null | undefined> = {
        ...requestAttributes(event),
        http_status: statusCode,
        duration_ms: duration,
      }

      if (isSlow) logAttrs.slow_request = true

      if (isError) {
        logError(`${method} ${path} ${statusCode}`, logAttrs)
      }
      else if (isSlow) {
        logWarn(`${method} ${path} slow ${duration}ms`, logAttrs)
      }
      else {
        logInfo(`${method} ${path} ${statusCode}`, logAttrs)
      }

    }
    catch {
      // Tracking must never break the response
    }
  })
})
