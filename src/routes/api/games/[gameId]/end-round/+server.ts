import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { games, characters } from '$lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

/**
 * End-of-round cleanup.
 * Currently: fully heal all heroes to maxHealth so the next round starts fresh.
 */
export const POST: RequestHandler = async ({ params }) => {
	try {
		const gameId = Number(params.gameId);
		if (!Number.isFinite(gameId)) {
			return json({ error: 'Invalid game ID' }, { status: 400 });
		}

		const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
		if (!game) return json({ error: 'Game not found' }, { status: 404 });

		if (!game.characterIds || game.characterIds.length === 0) {
			return json({ success: true, healed: 0 });
		}

		const gameChars = await db
			.select()
			.from(characters)
			.where(inArray(characters.id, game.characterIds));

		const heroes = gameChars.filter((c) => c.type === 'hero');

		const updates = await Promise.all(
			heroes.map(async (h) => {
				const healedStats = { ...h.stats, health: h.stats.maxHealth };
				const [updated] = await db
					.update(characters)
					.set({ stats: healedStats })
					.where(eq(characters.id, h.id))
					.returning();
				return updated;
			})
		);

		return json({ success: true, healed: updates.length, heroes: updates });
	} catch (error) {
		console.error('Error applying end-round heal:', error);
		return json({ error: 'Failed to apply end-round heal' }, { status: 500 });
	}
};
