import { and, desc, eq } from 'drizzle-orm'
import { job, organization } from '../../../database/schema'
import { publicOrganizationSlugSchema } from '../../../utils/schemas/publicApplication'

/**
 * GET /api/public/organizations/:slug
 * Returns a public organization profile and its open jobs.
 * No auth required.
 */
export default defineEventHandler(async (event) => {
  const { slug } = await getValidatedRouterParams(event, publicOrganizationSlugSchema.parse)

  const org = await db.query.organization.findFirst({
    where: eq(organization.slug, slug),
    columns: {
      id: true,
      name: true,
      slug: true,
      logo: true,
    },
  })

  if (!org) {
    throw createError({ statusCode: 404, statusMessage: 'Organization not found' })
  }

  const jobs = await db.query.job.findMany({
    where: and(
      eq(job.organizationId, org.id),
      eq(job.status, 'open'),
    ),
    orderBy: [desc(job.createdAt)],
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      location: true,
      type: true,
      createdAt: true,
    },
  })

  return {
    organization: org,
    jobs,
  }
})
