import { and, eq, isNull } from 'drizzle-orm'
import { resumeSubmission } from '../../../../database/schema'

export default defineEventHandler(async (event) => {
  await requirePlatformOwner(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const row = await db.query.resumeSubmission.findFirst({
    where: and(eq(resumeSubmission.id, id), isNull(resumeSubmission.consentRevokedAt)),
    columns: { fullName: true, pdfKey: true },
  })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Not found' })

  const bytes = await downloadFromS3(row.pdfKey)
  const filename = encodeURIComponent(`${row.fullName.replace(/[\/:*?"<>|]+/g, '-').trim() || 'curriculo'}.pdf`)

  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${filename}`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  })

  return bytes
})
