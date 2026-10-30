export const reportMetricKeys = [
  'companies',
  'jobs',
  'candidates',
  'applications',
  'interviews',
  'resumes',
] as const

export type ReportMetricKey = typeof reportMetricKeys[number]

export const reportDatePresets = ['7d', '15d', '30d', 'custom'] as const

export type ReportDatePreset = typeof reportDatePresets[number]

export type ReportSeries = {
  key: string
  label: string
  color: string
}

export type ReportStatPoint = {
  date: string
  label: string
  values: Record<string, number>
}

export type ReportsStatsResponse = {
  metric: ReportMetricKey
  dateRange: {
    preset: ReportDatePreset
    from: string
    to: string
  }
  series: ReportSeries[]
  points: ReportStatPoint[]
  totals: Record<string, number>
}
