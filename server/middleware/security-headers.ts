import { randomBytes } from 'node:crypto'

function buildMainCsp(nonce: string) {
  const isDev = process.env.NODE_ENV !== 'production'
  const scriptSrc = ["'self'", `'nonce-${nonce}'`]
  const connectSrc = ["'self'"]

  if (isDev) {
    scriptSrc.push("'unsafe-eval'")
    connectSrc.push('ws:', 'http:', 'https:')
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://use.typekit.net",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://use.typekit.net https://p.typekit.net",
    `connect-src ${connectSrc.join(' ')}`,
    "frame-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

function buildPdfPreviewCsp() {
  return [
    "default-src 'none'",
    "img-src 'self' data: blob:",
    "style-src 'unsafe-inline'",
    "script-src 'none'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "base-uri 'none'",
  ].join('; ')
}

export default defineEventHandler((event) => {
  const nonce = randomBytes(16).toString('base64')
  ;(event.context as { cspNonce?: string }).cspNonce = nonce

  const pathname = getRequestURL(event).pathname
  const isPdfPreview = /^\/api\/documents\/[^/]+\/preview$/.test(pathname)

  setResponseHeader(
    event,
    'Content-Security-Policy',
    isPdfPreview ? buildPdfPreviewCsp() : buildMainCsp(nonce),
  )
})
