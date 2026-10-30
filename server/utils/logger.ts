import type { H3Event } from 'h3'

function serializeAttributes(attributes?: Record<string, unknown>): string {
  if (!attributes || Object.keys(attributes).length === 0) {
    return ''
  }
  try {
    return ` ${JSON.stringify(attributes)}`
  } catch {
    return ' {"logger_error":"failed_to_serialize_attributes"}'
  }
}

export function logInfo(body: string, attributes?: Record<string, unknown>): void {
  console.info(`${body}${serializeAttributes(attributes)}`)
}

export function logWarn(body: string, attributes?: Record<string, unknown>): void {
  console.warn(`${body}${serializeAttributes(attributes)}`)
}

export function logError(body: string, attributes?: Record<string, unknown>): void {
  console.error(`${body}${serializeAttributes(attributes)}`)
}

export function logDebug(body: string, attributes?: Record<string, unknown>): void {
  console.debug(`${body}${serializeAttributes(attributes)}`)
}

export function requestAttributes(event: H3Event): Record<string, string | undefined> {
  const headers = getHeaders(event)
  return {
    http_method: getMethod(event),
    http_path: getRequestURL(event).pathname,
    user_agent: headers['user-agent'],
  }
}

interface SessionInfo {
  user: { id: string }
  session: { activeOrganizationId: string }
}

export function logApiRequest(
  event: H3Event,
  session: SessionInfo | null,
  body: string,
  extra?: Record<string, unknown>,
): void {
  void session
  logInfo(body, {
    ...requestAttributes(event),
    ...extra,
  })
}

export function logApiError(
  event: H3Event,
  session: SessionInfo | null,
  body: string,
  extra?: Record<string, unknown>,
): void {
  void session
  logError(body, {
    ...requestAttributes(event),
    ...extra,
  })
}
