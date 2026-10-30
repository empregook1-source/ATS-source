import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'
import { RESUME_TERMS_VERSION, schoolingHasCourse } from '~~/shared/resume'
import { resumeCreation, resumeSubmission } from '../../database/schema'

const ResumeDraftSchema = z.object({
  photo: z.object({
    dataUrl: z.string().catch(''),
    mime: z.string().catch(''),
  }).nullable().catch(null),
  personal: z.object({
    fullName: z.string().catch(''),
    email: z.string().catch(''),
    phone: z.string().catch(''),
    age: z.string().catch(''),
    city: z.string().catch(''),
    hasCnh: z.boolean().catch(false),
    cnhCategory: z.string().catch(''),
  }).catch({ fullName: '', email: '', phone: '', age: '', city: '', hasCnh: false, cnhCategory: '' }),
  schooling: z.array(z.object({
    title: z.string().catch(''),
    status: z.string().catch(''),
    course: z.string().catch(''),
    school: z.string().catch(''),
    graduationYear: z.string().catch(''),
    studying: z.boolean().catch(false),
  }).passthrough()).catch([]),
  courses: z.array(z.object({
    title: z.string().catch(''),
    institution: z.string().catch(''),
    completion: z.string().catch(''),
  }).passthrough()).catch([]),
  experiences: z.array(z.object({
    title: z.string().catch(''),
    company: z.string().catch(''),
    city: z.string().catch(''),
    start: z.string().catch(''),
    end: z.string().catch(''),
    period: z.string().catch(''),
    activities: z.string().catch(''),
  }).passthrough()).catch([]),
  consent: z.object({
    terms: z.boolean().catch(false),
    marketing: z.boolean().catch(false),
  }).catch({ terms: false, marketing: false }),
}).passthrough()

function experiencePeriod(exp: { start: string; end: string; period: string }): string {
  const start = exp.start.trim()
  const end = exp.end.trim()
  const legacy = exp.period.trim()
  const combined = [start, end].filter(Boolean).join(' - ')
  return combined || legacy
}

function sanitizePdfFilename(value: string): string {
  const raw = value.trim() || 'curriculo'
  const safe = raw.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
  return safe || 'curriculo'
}

export default defineEventHandler(async (event) => {
  const draft = await readValidatedBody(event, ResumeDraftSchema.parse)

  if (!draft.consent.terms) {
    throw createError({ statusCode: 400, statusMessage: 'Terms must be accepted' })
  }

  const [PdfRenderer, ReactModule] = await Promise.all([
    import('@react-pdf/renderer'),
    import('react'),
  ])
  const React = ReactModule.default
  const Pdf = PdfRenderer as any
  const { pdf, Document, Page, Text, View, StyleSheet, Svg, Path } = Pdf
  const Image = Pdf.Image as any
  const Link = Pdf.Link as any
  const sectionAccentColor = '#651689'

  const styles = StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 70,
      paddingHorizontal: 44,
      fontSize: 12,
      fontFamily: 'Helvetica',
      color: '#111111',
    },
    header: {
      marginBottom: 14,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    contactCol: {
      flex: 1,
      minWidth: 0,
      textAlign: 'left',
    },
    photoCol: {
      width: 90,
      alignItems: 'flex-end',
    },
    photo: {
      width: 81,
      height: 118,
      borderRadius: 2,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      objectFit: 'cover',
    },
    name: {
      fontSize: 25,
      fontWeight: 700,
      color: '#651689',
      textAlign: 'left',
    },
    ageLine: {
      marginTop: 2,
      fontSize: 14,
      fontWeight: 700,
      color: '#111111',
    },
    detailsBlock: {
      marginTop: 22,
    },
    detailLine: {
      marginBottom: 2,
      color: '#111111',
    },
    emailLink: {
      marginBottom: 2,
      color: sectionAccentColor,
      textDecoration: 'underline',
    },
    contactRow: {
      marginTop: 10,
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
    },
    contactItem: {
      marginHorizontal: 10,
      marginBottom: 2,
      color: '#444444',
    },
    section: {
      marginTop: 10,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: sectionAccentColor,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitleIcon: {
      width: 12,
      height: 12,
      marginRight: 6,
    },
    divider: {
      height: 1,
      backgroundColor: sectionAccentColor,
      marginTop: 6,
      marginBottom: 8,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    bullet: {
      width: 12,
      color: '#333333',
    },
    bulletContent: {
      flex: 1,
      minWidth: 0,
    },
    bulletTitle: {
      fontWeight: 600,
      lineHeight: 1.25,
    },
    muted: {
      marginTop: 1,
      color: '#555555',
      lineHeight: 1.25,
    },
    schoolingLine: {
      marginTop: 0.5,
      color: '#111111',
      lineHeight: 1.1,
    },
    schoolingLineFirst: {
      marginTop: 0,
    },
    schoolingLabel: {
      fontWeight: 700,
      color: '#111111',
    },
    courseLine: {
      marginTop: 0.5,
      color: '#111111',
      lineHeight: 1.1,
    },
    courseLineFirst: {
      marginTop: 0,
    },
    courseLabel: {
      fontWeight: 700,
      color: '#111111',
    },
    expLine: {
      marginTop: 0.5,
      color: '#111111',
      lineHeight: 1.1,
    },
    expLineFirst: {
      marginTop: 0,
    },
    expLabel: {
      fontWeight: 700,
      color: '#111111',
    },
    expTitle: {
      fontWeight: 600,
      lineHeight: 1.25,
    },
    expPeriod: {
      marginTop: 1,
      color: '#555555',
      lineHeight: 1.25,
    },
    expActivities: {
      marginTop: 2,
      lineHeight: 1.25,
    },
    footer: {
      position: 'absolute',
      left: 44,
      right: 44,
      bottom: 24,
      borderTopWidth: 1,
      borderTopColor: '#D1D5DB',
      paddingTop: 8,
    },
    footerText: {
      fontSize: 9,
      color: sectionAccentColor,
      textAlign: 'center',
    },
  })

  const GraduationCapIcon = () =>
    React.createElement(
      Svg,
      { width: 12, height: 12, viewBox: '0 0 24 24' },
      React.createElement(Path, { d: 'M22 10v6', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement(Path, { d: 'M6 12v5c3 3 9 3 12 0v-5', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement(Path, { d: 'M12 3L1 9l11 6 9-4.91V17', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement(Path, { d: 'M1 9v6', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
    )

  const GlobeIcon = () =>
    React.createElement(
      Svg,
      { width: 12, height: 12, viewBox: '0 0 24 24' },
      React.createElement(Path, { d: 'M12 22a10 10 0 1 0 0-20a10 10 0 0 0 0 20Z', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement(Path, { d: 'M2 12h20', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement(Path, { d: 'M12 2c3.2 2.7 5 6.3 5 10s-1.8 7.3-5 10c-3.2-2.7-5-6.3-5-10s1.8-7.3 5-10Z', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
    )

  const SuitcaseIcon = () =>
    React.createElement(
      Svg,
      { width: 12, height: 12, viewBox: '0 0 24 24' },
      React.createElement(Path, { d: 'M10 6V5a2 2 0 0 1 4 0v1', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement(Path, { d: 'M4 7h16v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
      React.createElement(Path, { d: 'M16 13H8', stroke: sectionAccentColor, strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }),
    )

  const ResumeDocument = () => {
    const fullName = draft.personal.fullName.trim()
    const email = draft.personal.email.trim()
    const phone = draft.personal.phone.trim()
    const age = (draft.personal.age ?? '').trim()
    const city = (draft.personal.city ?? '').trim()
    const hasCnh = !!draft.personal.hasCnh
    const cnhCategory = (draft.personal.cnhCategory ?? '').trim()
    const photoSrc = (draft.photo?.dataUrl ?? '').trim()
    const gmailComposeUrl = email ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}` : ''

    return React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4', style: styles.page },
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(
            View,
            { style: styles.headerRow },
            React.createElement(
              View,
              { style: styles.contactCol },
              React.createElement(Text, { style: styles.name }, fullName || 'Seu nome aqui'),
              ...(age ? [React.createElement(Text, { key: 'age', style: styles.ageLine }, `${age} anos`)] : []),
              ...(city || phone || email || hasCnh
                ? [
                    React.createElement(
                      View,
                      { key: 'details', style: styles.detailsBlock },
                      ...(city ? [React.createElement(Text, { key: 'city', style: styles.detailLine }, city)] : []),
                      ...(phone ? [React.createElement(Text, { key: 'phone', style: styles.detailLine }, phone)] : []),
                      ...(email
                        ? [
                            React.createElement(
                              Link,
                              { key: 'email', src: gmailComposeUrl, style: styles.emailLink },
                              email,
                            ),
                          ]
                        : []),
                      ...(hasCnh
                        ? [React.createElement(Text, { key: 'cnh', style: styles.detailLine }, `CNH ${cnhCategory || '—'}`)]
                        : []),
                    ),
                  ]
                : []),
            ),
            ...(photoSrc
              ? [
                  React.createElement(
                    View,
                    { key: 'photo', style: styles.photoCol },
                    React.createElement(Image, { src: photoSrc, style: styles.photo }),
                  ),
                ]
              : []),
          ),
        ),
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            View,
            { style: styles.sectionTitleRow },
            React.createElement(View, { style: styles.sectionTitleIcon }, React.createElement(GraduationCapIcon)),
            React.createElement(Text, { style: styles.sectionTitle }, 'FORMAÇÃO ACADÊMICA'),
          ),
          React.createElement(View, { style: styles.divider }),
          ...(draft.schooling.length > 0
            ? draft.schooling.map((i, idx) => {
                const level = i.title.trim()
                const status = i.status.trim()
                const title = [level, status].filter(Boolean).join(' — ') || '—'
                const course = schoolingHasCourse(level) ? i.course.trim() : ''
                const school = i.school.trim() || '—'
                const graduationYear = i.studying ? 'Cursando' : (i.graduationYear.trim() || '—')

                return React.createElement(
                  View,
                  { key: `schooling-${idx}`, style: styles.bulletRow },
                  React.createElement(Text, { style: styles.bullet }, '•'),
                  React.createElement(
                    View,
                    { style: styles.bulletContent },
                    React.createElement(
                      Text,
                      { style: [styles.schoolingLine, styles.schoolingLineFirst] },
                      React.createElement(Text, { style: styles.schoolingLabel }, 'Escolaridade: '),
                      title,
                    ),
                    ...(course
                      ? [
                          React.createElement(
                            Text,
                            { key: 'course', style: styles.schoolingLine },
                            React.createElement(Text, { style: styles.schoolingLabel }, 'Nome do curso: '),
                            course,
                          ),
                        ]
                      : []),
                    React.createElement(
                      Text,
                      { style: styles.schoolingLine },
                      React.createElement(Text, { style: styles.schoolingLabel }, 'Instituição: '),
                      school,
                    ),
                    React.createElement(
                      Text,
                      { style: styles.schoolingLine },
                      React.createElement(Text, { style: styles.schoolingLabel }, 'Conclusão: '),
                      graduationYear,
                    ),
                  ),
                )
              })
            : [
                React.createElement(
                  View,
                  { key: 'schooling-empty', style: styles.bulletRow },
                  React.createElement(Text, { style: styles.bullet }, '•'),
                  React.createElement(
                    View,
                    { style: styles.bulletContent },
                    React.createElement(
                      Text,
                      { style: [styles.schoolingLine, styles.schoolingLineFirst] },
                      React.createElement(Text, { style: styles.schoolingLabel }, 'Escolaridade: '),
                      '—',
                    ),
                    React.createElement(
                      Text,
                      { style: styles.schoolingLine },
                      React.createElement(Text, { style: styles.schoolingLabel }, 'Instituição: '),
                      '—',
                    ),
                    React.createElement(
                      Text,
                      { style: styles.schoolingLine },
                      React.createElement(Text, { style: styles.schoolingLabel }, 'Conclusão: '),
                      '—',
                    ),
                  ),
                ),
              ]),
        ),
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            View,
            { style: styles.sectionTitleRow },
            React.createElement(View, { style: styles.sectionTitleIcon }, React.createElement(GlobeIcon)),
            React.createElement(Text, { style: styles.sectionTitle }, 'CURSOS COMPLEMENTARES'),
          ),
          React.createElement(View, { style: styles.divider }),
          ...(draft.courses.length > 0
            ? draft.courses.map((i, idx) => {
                const title = i.title.trim() || '—'
                const institution = i.institution.trim() || '—'
                const hoursRaw = i.completion.trim().replace(/\D+/g, '')
                const hoursValue = hoursRaw || '—'
                const hoursLine = hoursValue === '—' ? '—' : `${hoursValue} horas`

                return React.createElement(
                  View,
                  { key: `course-${idx}`, style: styles.bulletRow },
                  React.createElement(Text, { style: styles.bullet }, '•'),
                  React.createElement(
                    View,
                    { style: styles.bulletContent },
                    React.createElement(
                      Text,
                      { style: [styles.courseLine, styles.courseLineFirst] },
                      React.createElement(Text, { style: styles.courseLabel }, 'Curso: '),
                      title,
                    ),
                    React.createElement(
                      Text,
                      { style: styles.courseLine },
                      React.createElement(Text, { style: styles.courseLabel }, 'Instituição: '),
                      institution,
                    ),
                    React.createElement(
                      Text,
                      { style: styles.courseLine },
                      React.createElement(Text, { style: styles.courseLabel }, 'Carga horária: '),
                      hoursLine,
                    ),
                  ),
                )
              })
            : [
                React.createElement(
                  View,
                  { key: 'courses-empty', style: styles.bulletRow },
                  React.createElement(Text, { style: styles.bullet }, '•'),
                  React.createElement(
                    View,
                    { style: styles.bulletContent },
                    React.createElement(
                      Text,
                      { style: [styles.courseLine, styles.courseLineFirst] },
                      React.createElement(Text, { style: styles.courseLabel }, 'Curso: '),
                      '—',
                    ),
                    React.createElement(
                      Text,
                      { style: styles.courseLine },
                      React.createElement(Text, { style: styles.courseLabel }, 'Instituição: '),
                      '—',
                    ),
                    React.createElement(
                      Text,
                      { style: styles.courseLine },
                      React.createElement(Text, { style: styles.courseLabel }, 'Carga horária: '),
                      '—',
                    ),
                  ),
                ),
              ]),
        ),
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(
            View,
            { style: styles.sectionTitleRow },
            React.createElement(View, { style: styles.sectionTitleIcon }, React.createElement(SuitcaseIcon)),
            React.createElement(Text, { style: styles.sectionTitle }, 'EXPERIÊNCIAS PROFISSIONAIS'),
          ),
          React.createElement(View, { style: styles.divider }),
          ...(draft.experiences.length > 0
            ? draft.experiences.map((i, idx) => {
                const role = i.title.trim() || '—'
                const company = i.company.trim() || '—'
                const start = i.start.trim()
                const end = i.end.trim()
                const legacy = i.period.trim()
                const period = start || end ? `${start || '—'} até ${end || '—'}` : (legacy || '—')
                const activities = i.activities.trim()

                return React.createElement(
                  View,
                  { key: `experience-${idx}`, style: styles.bulletRow },
                  React.createElement(Text, { style: styles.bullet }, '•'),
                  React.createElement(
                    View,
                    { style: styles.bulletContent },
                    React.createElement(
                      Text,
                      { style: [styles.expLine, styles.expLineFirst] },
                      React.createElement(Text, { style: styles.expLabel }, 'Cargo: '),
                      role,
                    ),
                    React.createElement(
                      Text,
                      { style: styles.expLine },
                      React.createElement(Text, { style: styles.expLabel }, 'Instituição: '),
                      company,
                    ),
                    React.createElement(
                      Text,
                      { style: styles.expLine },
                      React.createElement(Text, { style: styles.expLabel }, 'Período: '),
                      period,
                    ),
                    ...(activities
                      ? [
                          React.createElement(
                            Text,
                            { key: 'activities', style: styles.expLine },
                            React.createElement(Text, { style: styles.expLabel }, 'Atividades realizadas: '),
                            activities,
                          ),
                        ]
                      : []),
                  ),
                )
              })
            : [
                React.createElement(
                  View,
                  { key: 'exp-empty', style: styles.bulletRow },
                  React.createElement(Text, { style: styles.bullet }, '•'),
                  React.createElement(
                    View,
                    { style: styles.bulletContent },
                    React.createElement(
                      Text,
                      { style: [styles.expLine, styles.expLineFirst] },
                      React.createElement(Text, { style: styles.expLabel }, 'Cargo: '),
                      '—',
                    ),
                    React.createElement(
                      Text,
                      { style: styles.expLine },
                      React.createElement(Text, { style: styles.expLabel }, 'Instituição: '),
                      '—',
                    ),
                    React.createElement(
                      Text,
                      { style: styles.expLine },
                      React.createElement(Text, { style: styles.expLabel }, 'Período: '),
                      '—',
                    ),
                  ),
                ),
              ]),
        ),
        React.createElement(
          View,
          { style: styles.footer, fixed: true },
          React.createElement(Text, { style: styles.footerText }, 'Gerado por EmpregoOK - https://empregook.com.br'),
        ),
      ),
    )
  }

  const fileBase = sanitizePdfFilename(draft.personal.fullName || 'curriculo')
  // @react-pdf's toBuffer() resolves to a readable stream; collect it so it can also be uploaded to S3.
  const pdfOutput: Buffer | AsyncIterable<Uint8Array> = await pdf(React.createElement(ResumeDocument)).toBuffer()
  let pdfBytes: Buffer
  if (Buffer.isBuffer(pdfOutput)) {
    pdfBytes = pdfOutput
  } else {
    const chunks: Buffer[] = []
    for await (const chunk of pdfOutput) chunks.push(Buffer.from(chunk))
    pdfBytes = Buffer.concat(chunks)
  }

  try {
    const referrer = getRequestHeader(event, 'referer') ?? null
    const userAgent = getRequestHeader(event, 'user-agent') ?? null
    let returnTo: string | null = null
    let jobSlug: string | null = null

    if (referrer) {
      try {
        const url = new URL(referrer)
        returnTo = url.searchParams.get('returnTo')
        jobSlug = url.searchParams.get('jobSlug')
      } catch {}
    }

    await db.insert(resumeCreation).values({
      id: crypto.randomUUID(),
      returnTo,
      jobSlug,
      referrer,
      userAgent,
    })
  } catch {}

  if (draft.consent.marketing && draft.personal.email.trim()) {
    const email = draft.personal.email.trim().toLowerCase()
    let jobSlug: string | null = null
    try {
      jobSlug = new URL(getRequestHeader(event, 'referer') ?? '').searchParams.get('jobSlug')
    } catch {}
    try {
      // One stored resume per e-mail: a new download with consent replaces the previous one.
      const existing = await db.query.resumeSubmission.findFirst({
        where: and(eq(resumeSubmission.email, email), isNull(resumeSubmission.consentRevokedAt)),
        columns: { id: true, pdfKey: true },
      })
      const id = existing?.id ?? crypto.randomUUID()
      const pdfKey = existing?.pdfKey ?? `resumes/${id}.pdf`
      const values = {
        fullName: draft.personal.fullName.trim() || 'Sem nome',
        email,
        phone: draft.personal.phone.trim() || null,
        city: draft.personal.city.trim() || null,
        pdfKey,
        termsVersion: RESUME_TERMS_VERSION,
        marketingConsent: true,
        consentAt: new Date(),
        ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? null,
        userAgent: getRequestHeader(event, 'user-agent') ?? null,
        jobSlug,
      }

      await uploadToS3(pdfKey, pdfBytes, 'application/pdf')
      if (existing) {
        await db.update(resumeSubmission).set(values).where(eq(resumeSubmission.id, existing.id))
      } else {
        await db.insert(resumeSubmission).values({ id, ...values })
      }
    } catch (error) {
      logError('resume.submission_failed', { error: error instanceof Error ? error.message : String(error) })
    }
  }

  const encodedFilename = encodeURIComponent(`${fileBase}.pdf`)
  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  })

  return pdfBytes
})
