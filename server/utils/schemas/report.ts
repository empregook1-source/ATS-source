import { z } from 'zod'
import { reportDatePresets, reportMetricKeys } from '~~/shared/reports'

export const reportStatsQuerySchema = z.object({
  metric: z.enum(reportMetricKeys),
  preset: z.enum(reportDatePresets).default('30d'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).superRefine((value, ctx) => {
  if (value.preset !== 'custom') {
    return
  }

  if (!value.from) {
    ctx.addIssue({
      code: 'custom',
      path: ['from'],
      message: 'Start date is required for custom range',
    })
  }

  if (!value.to) {
    ctx.addIssue({
      code: 'custom',
      path: ['to'],
      message: 'End date is required for custom range',
    })
  }

  if (value.from && value.to && value.from > value.to) {
    ctx.addIssue({
      code: 'custom',
      path: ['to'],
      message: 'End date must be on or after start date',
    })
  }
})
