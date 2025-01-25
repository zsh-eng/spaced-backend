import * as schema from '@/db/schema';
import { env } from 'cloudflare:test';
import { drizzle } from 'drizzle-orm/d1';

export const testUserPassword = 'test-user-password';
export const testUserEmail = 'test@email.com';

export const testUser = {
	id: 'test',
	email: testUserEmail,
	passwordHash: 'Xj+SO0CHAnpDOZyhr2+KAmz1n60hDmogm+9UkmLi4p0K78+RyxWVbqT0u/TsIOBP',
} satisfies schema.NewUser;

export const testClientId = 'test-1';
export const testClientId2 = 'test-2';

export async function createTestUser(): Promise<schema.User> {
	const db = drizzle(env.D1, {
		schema,
	});

	const [user] = await db
		.insert(schema.users)
		.values({
			...testUser,
		})
		.returning();

	if (!user) {
		throw new Error('Failed to create user');
	}

	await db.insert(schema.clients).values([
		{
			id: testClientId,
			userId: user.id,
		},
		{
			id: testClientId2,
			userId: user.id,
		},
	]);

	return user;
}
