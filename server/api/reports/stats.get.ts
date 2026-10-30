import { and, eq, gte, lt, lte, sql } from 'drizzle-orm'
import { application, candidate, company, interview, job, member, resumeCreation, resumeSubmission } from '../../database/schema'
import { reportStatsQuerySchema } from '../../utils/schemas/report'
import type {
  ReportMetricKey,
  ReportSeries,
  ReportsStatsResponse,
} from '~~/shared/reports'

type AggregatedRow = {
  day: string
  count: number
}

type CompanyAggregatedRow = AggregatedRow & {
  isActive: boolean
}

function toStartOfUtcDay(value: Date) {
  return new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
  ))
}

function toEndOfUtcDay(value: Date) {
  return new Date(Date.UTC(
    value.getUTCFullYear(),
    value.getUTCMonth(),
    value.getUTCDate(),
    23,
    59,
    59,
    999,
  ))
}

function addUtcDays(value: Date, amount: number) {
  const next = new Date(value)
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

function toIsoDay(value: Date) {
  return value.toISOString().slice(0, 10)
}

function formatDayLabel(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1)))
}

function resolveRange(
  preset: ReportsStatsResponse['dateRange']['preset'],
  from?: string,
  to?: string,
) {
  if (preset === 'custom') {
    const startDate = toStartOfUtcDay(new Date(`${from}T00:00:00.000Z`))
    const endDate = toEndOfUtcDay(new Date(`${to}T00:00:00.000Z`))

    return {
      from: startDate,
      to: endDate,
    }
  }

  const days = {
    '7d': 7,
    '15d': 15,
    '30d': 30,
  }[preset]

  const today = toStartOfUtcDay(new Date())

  return {
    from: addUtcDays(today, -(days - 1)),
    to: toEndOfUtcDay(today),
  }
}

function buildDatePoints(
  from: Date,
  to: Date,
  series: ReportSeries[],
  valuesByDay: Map<string, Record<string, number>>,
  initialTotals: Record<string, number>,
) {
  const points = []
  let current = toStartOfUtcDay(from)
  const end = toStartOfUtcDay(to)
  const runningTotals = Object.fromEntries(
    series.map(item => [item.key, initialTotals[item.key] ?? 0]),
  ) as Record<string, number>

  while (current <= end) {
    const dayKey = toIsoDay(current)
    const dayValues = valuesByDay.get(dayKey) ?? {}

    for (const item of series) {
      runningTotals[item.key] = (runningTotals[item.key] ?? 0) + (dayValues[item.key] ?? 0)
    }

    points.push({
      date: dayKey,
      label: formatDayLabel(dayKey),
      values: { ...runningTotals },
    })

    current = addUtcDays(current, 1)
  }

  return points
}

function buildTotals(points: ReportsStatsResponse['points'], series: ReportSeries[]) {
  const lastPoint = points.at(-1)

  return Object.fromEntries(
    series.map(item => [
      item.key,
      lastPoint?.values[item.key] ?? 0,
    ]),
  )
}

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const orgId = session.session.activeOrganizationId
  const query = await getValidatedQuery(event, reportStatsQuerySchema.parse)

  const activeMembership = await db.query.member.findFirst({
    where: and(
      eq(member.userId, session.user.id),
      eq(member.organizationId, orgId),
    ),
    columns: {
      role: true,
    },
  })

  if (!activeMembership || activeMembership.role === 'member') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
    })
  }

  const range = resolveRange(query.preset, query.from, query.to)

  if (range.from > range.to) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid date range',
    })
  }

  const organizationColumnByMetric: Partial<Record<ReportMetricKey, unknown>> = {
    companies: company.organizationId,
    jobs: job.organizationId,
    candidates: candidate.organizationId,
    applications: application.organizationId,
    interviews: interview.organizationId,
  }

  const dateCondition = <TColumn>(column: TColumn) => and(
    ...(organizationColumnByMetric[query.metric]
      ? [eq(organizationColumnByMetric[query.metric] as any, orgId)]
      : []),
    gte(column as any, range.from),
    lte(column as any, range.to),
  )

  const beforeRangeCondition = <TColumn>(column: TColumn) => and(
    ...(organizationColumnByMetric[query.metric]
      ? [eq(organizationColumnByMetric[query.metric] as any, orgId)]
      : []),
    lt(column as any, range.from),
  )

  let series: ReportSeries[]
  const valuesByDay = new Map<string, Record<string, number>>()
  const initialTotals: Record<string, number> = {}

  if (query.metric === 'companies') {
    series = [
      { key: 'active', label: 'Empresas ativas', color: '#8b5cf6' },
      { key: 'inactive', label: 'Empresas inativas', color: '#f59e0b' },
    ]

    const initialRows = await db
      .select({
        isActive: company.isActive,
        count: sql<number>`count(*)::int`,
      })
      .from(company)
      .where(beforeRangeCondition(company.createdAt))
      .groupBy(company.isActive)

    const rows = await db
      .select({
        day: sql<string>`date_trunc('day', ${company.createdAt})::date::text`,
        isActive: company.isActive,
        count: sql<number>`count(*)::int`,
      })
      .from(company)
      .where(dateCondition(company.createdAt))
      .groupBy(sql`date_trunc('day', ${company.createdAt})::date`, company.isActive)
      .orderBy(sql`date_trunc('day', ${company.createdAt})::date`)

    for (const row of initialRows as Array<{ isActive: boolean; count: number }>) {
      initialTotals[row.isActive ? 'active' : 'inactive'] = row.count
    }

    for (const row of rows as CompanyAggregatedRow[]) {
      const current = valuesByDay.get(row.day) ?? {}
      current[row.isActive ? 'active' : 'inactive'] = row.count
      valuesByDay.set(row.day, current)
    }
  }
  else {
    const metricConfig: Record<Exclude<ReportMetricKey, 'companies'>, {
      series: ReportSeries
      table: any
      column: any
    }> = {
      jobs: {
        series: { key: 'total', label: 'Vagas criadas', color: '#8b5cf6' },
        table: job,
        column: job.createdAt,
      },
      candidates: {
        series: { key: 'total', label: 'Candidatos cadastrados', color: '#06b6d4' },
        table: candidate,
        column: candidate.createdAt,
      },
      applications: {
        series: { key: 'total', label: 'Candidaturas cadastradas', color: '#10b981' },
        table: application,
        column: application.createdAt,
      },
      interviews: {
        series: { key: 'total', label: 'Entrevistas criadas', color: '#f43f5e' },
        table: interview,
        column: interview.createdAt,
      },
      resumes: {
        series: { key: 'total', label: 'Currículos criados', color: '#a855f7' },
        table: resumeCreation,
        column: resumeCreation.createdAt,
      },
    }

    const currentMetric = metricConfig[query.metric]
    series = [currentMetric.series]

    const initialRows = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(currentMetric.table)
      .where(beforeRangeCondition(currentMetric.column))

    const rows = await db
      .select({
        day: sql<string>`date_trunc('day', ${currentMetric.column})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(currentMetric.table)
      .where(dateCondition(currentMetric.column))
      .groupBy(sql`date_trunc('day', ${currentMetric.column})::date`)
      .orderBy(sql`date_trunc('day', ${currentMetric.column})::date`)

    initialTotals.total = initialRows[0]?.count ?? 0

    for (const row of rows as AggregatedRow[]) {
      valuesByDay.set(row.day, {
        total: row.count,
      })
    }

    // Resumes split by storage consent: "com aceite" = stored with consent, "sem aceite" = the rest.
    if (query.metric === 'resumes') {
      series.push(
        { key: 'withConsent', label: 'Com aceite', color: '#10b981' },
        { key: 'withoutConsent', label: 'Sem aceite', color: '#f59e0b' },
      )

      const [initialConsentRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(resumeSubmission)
        .where(lt(resumeSubmission.createdAt, range.from))

      const consentRows = await db
        .select({
          day: sql<string>`date_trunc('day', ${resumeSubmission.createdAt})::date::text`,
          count: sql<number>`count(*)::int`,
        })
        .from(resumeSubmission)
        .where(and(gte(resumeSubmission.createdAt, range.from), lte(resumeSubmission.createdAt, range.to)))
        .groupBy(sql`date_trunc('day', ${resumeSubmission.createdAt})::date`)

      initialTotals.withConsent = initialConsentRow?.count ?? 0
      initialTotals.withoutConsent = Math.max(0, initialTotals.total - initialTotals.withConsent)

      for (const row of consentRows as AggregatedRow[]) {
        valuesByDay.set(row.day, { ...valuesByDay.get(row.day), withConsent: row.count })
      }

      for (const [day, values] of valuesByDay) {
        values.withoutConsent = Math.max(0, (values.total ?? 0) - (values.withConsent ?? 0))
        valuesByDay.set(day, values)
      }
    }
  }

  const points = buildDatePoints(range.from, range.to, series, valuesByDay, initialTotals)

  return {
    metric: query.metric,
    dateRange: {
      preset: query.preset,
      from: toIsoDay(range.from),
      to: toIsoDay(range.to),
    },
    series,
    points,
    totals: buildTotals(points, series),
  } satisfies ReportsStatsResponse
})
