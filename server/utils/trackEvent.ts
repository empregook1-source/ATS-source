import type { H3Event } from 'h3'

interface TrackSession {
  user: { id: string }
  session: { activeOrganizationId: string }
}

export function trackEvent(
  event: H3Event,
  session: TrackSession | null,
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  void event
  void session
  void eventName
  void properties
}

export function trackApiError(
  event: H3Event,
  statusCode: number,
  properties?: Record<string, unknown>,
): void {
  void event
  void statusCode
  void properties
}

export function trackServerError(
  event: H3Event,
  session: TrackSession | null,
  error: unknown,
  properties?: Record<string, unknown>,
): void {
  void event
  void session
  void error
  void properties
}
