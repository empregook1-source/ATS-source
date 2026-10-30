import { and, eq } from 'drizzle-orm'
import { member } from '../database/schema'
import { db } from './db'

/**
 * Returns true when at least one owner membership exists in the system.
 */
export async function systemHasOwner() {
  const [result] = await db
    .select({ id: member.id })
    .from(member)
    .where(eq(member.role, 'owner'))
    .limit(1)

  return Boolean(result)
}

/**
 * Returns true when the given user is an owner in at least one organization.
 */
export async function isUserOwner(userId: string) {
  const [result] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.userId, userId),
        eq(member.role, 'owner'),
      ),
    )
    .limit(1)

  return Boolean(result)
}
