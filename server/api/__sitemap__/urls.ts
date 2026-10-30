import type { SitemapUrlInput } from '#sitemap/types'
import { desc, eq } from 'drizzle-orm'
import { defineSitemapEventHandler } from '#imports'
import { job } from '../../database/schema'

export default defineSitemapEventHandler(async () => {
  const jobs = await db.query.job.findMany({
    where: eq(job.status, 'open'),
    columns: {
      slug: true,
      updatedAt: true,
      createdAt: true,
    },
    orderBy: [desc(job.updatedAt), desc(job.createdAt)],
  })

  return jobs
    .filter((j) => Boolean(j.slug))
    .map((j) => ({
      loc: `/vagas/${j.slug}`,
      lastmod: j.updatedAt ?? j.createdAt,
    })) satisfies SitemapUrlInput[]
})
