import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'
import { resumeSubmission } from '../../database/schema'
import { createRateLimiter } from '../../utils/rateLimit'
import { sendResumeRecoveryEmail } from '../../utils/email'

/** Rate limit: max 3 recovery requests per IP per 15 minutes */
const recoverRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
  message: 'Muitas solicitações. Tente novamente em alguns minutos.',
})

const RecoverSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
})

/** Lowercase, strip accents and collapse spaces so "José  Silva" matches "jose silva". */
function normalizeName(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * POST /api/resume/recover
 * Public endpoint. E-mails the stored resume PDF to its owner when name + e-mail match.
 * Always returns the same response so it can't be used to discover who has a resume.
 */
export default defineEventHandler(async (event) => {
  await recoverRateLimit(event)
  const body = await readValidatedBody(event, RecoverSchema.parse)

  const stored = await db.query.resumeSubmission.findFirst({
    where: and(eq(resumeSubmission.email, body.email), isNull(resumeSubmission.consentRevokedAt)),
    columns: { fullName: true, email: true, pdfKey: true },
  })

  if (stored && normalizeName(stored.fullName) === normalizeName(body.fullName)) {
    const builderUrl = `${getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin}/curriculo/criar`
    // Not awaited: response time must not reveal whether a resume was found.
    void (async () => {
      const pdf = await downloadFromS3(stored.pdfKey)
      const filename = `${stored.fullName.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'curriculo'}.pdf`
      await sendResumeRecoveryEmail({ to: stored.email, fullName: stored.fullName, pdf, filename, builderUrl })
    })().catch((error) => {
      logError('resume.recovery_failed', { error: error instanceof Error ? error.message : String(error) })
    })
  }

  return { ok: true }
})
