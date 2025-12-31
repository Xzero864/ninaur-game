import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { games, characters } from '$lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const gameId = Number(params.gameId);
		if (!Number.isFinite(gameId)) {
			return json({ error: 'Invalid game ID' }, { status: 400 });
		}

		const body = (await request.json()) as { heroIds?: number[] };
		const heroIds = body.heroIds;

		if (!Array.isArray(heroIds) || heroIds.some((id) => typeof id !== 'number')) {
			return json({ error: 'heroIds must be an array of numbers' }, { status: 400 });
		}

		// Ensure unique
		const uniqueHeroIds = Array.from(new Set(heroIds));
		if (uniqueHeroIds.length !== heroIds.length) {
			return json({ error: 'heroIds must be unique' }, { status: 400 });
		}

		const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
		if (!game) return json({ error: 'Game not found' }, { status: 404 });

		if (!game.characterIds || game.characterIds.length === 0) {
			return json({ error: 'Game has no characters' }, { status: 400 });
		}

		// Load all game characters so we can validate types and preserve enemy ordering
		const gameChars = await db
			.select()
			.from(characters)
			.where(inArray(characters.id, game.characterIds));

		const typeById = new Map(gameChars.map((c) => [c.id, c.type] as const));
		const heroCount = gameChars.filter((c) => c.type === 'hero').length;

		if (heroIds.length !== heroCount) {
			return json({ error: `heroIds must contain exactly ${heroCount} heroes` }, { status: 400 });
		}

		// Validate heroIds are part of this game and are heroes
		for (const id of heroIds) {
			if (!typeById.has(id)) {
				return json({ error: `Character ${id} is not part of this game` }, { status: 400 });
			}
			if (typeById.get(id) !== 'hero') {
				return json({ error: `Character ${id} is not a hero` }, { status: 400 });
			}
		}

		// Preserve enemy ordering as it exists in characterIds
		const enemyIdsInOrder = game.characterIds.filter((id) => typeById.get(id) === 'enemy');

		const newCharacterIds = [...heroIds, ...enemyIdsInOrder];

		const [updatedGame] = await db
			.update(games)
			.set({ characterIds: newCharacterIds })
			.where(eq(games.id, gameId))
			.returning();

		return json({ success: true, game: updatedGame });
	} catch (error) {
		console.error('Error reordering heroes:', error);
		return json({ error: 'Failed to reorder heroes' }, { status: 500 });
	}
};
