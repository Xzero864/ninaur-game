import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { games, characters, characterTypes } from '$lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { getBossStats } from '$lib/server/db/bossStats.js';

const createGameSchema = z.object({
	name: z.string().min(1).max(100)
});

export const GET: RequestHandler = async () => {
	try {
		const allGames = await db.select().from(games);
		return json(allGames);
	} catch (error) {
		console.error('Error fetching games:', error);
		return json({ error: 'Failed to fetch games' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async () => {
	try {
		// Get all games first
		const allGames = await db.select().from(games);

		if (allGames.length === 0) {
			return json({ message: 'No games to delete' }, { status: 200 });
		}

		// Collect all character IDs from all games
		const allCharacterIds: number[] = [];
		for (const game of allGames) {
			allCharacterIds.push(...game.characterIds);
		}

		// Delete characters associated with games
		if (allCharacterIds.length > 0) {
			await db.delete(characters).where(inArray(characters.id, allCharacterIds));
		}

		// Delete all games
		await db.delete(games);

		return json({ message: `Deleted ${allGames.length} game(s)` }, { status: 200 });
	} catch (error) {
		console.error('Error deleting games:', error);
		return json({ error: 'Failed to delete games' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validatedData = createGameSchema.parse(body);

		// Get all character types
		const allCharacterTypes = await db.select().from(characterTypes);

		if (allCharacterTypes.length === 0) {
			return json({ error: 'No character types available' }, { status: 400 });
		}

		// Pick two random character types for the heroes
		const heroCharacterTypes = allCharacterTypes.filter((ct) => ct.name !== 'Boss');
		if (heroCharacterTypes.length === 0) {
			return json({ error: 'No hero character types available' }, { status: 400 });
		}
		if (heroCharacterTypes.length < 2) {
			return json({ error: 'Not enough hero character types available (need at least 2)' }, { status: 400 });
		}

		// Pick two different random character types
		const shuffled = [...heroCharacterTypes].sort(() => Math.random() - 0.5);
		const firstCharacterType = shuffled[0];
		const secondCharacterType = shuffled[1];

		// Create first hero character
		const [firstCharacter] = await db
			.insert(characters)
			.values({
				type: 'hero',
				characterTypeId: firstCharacterType.id,
				stats: {
					...firstCharacterType.baseStats,
					health: firstCharacterType.baseStats.maxHealth
				},
				level: 1
			})
			.returning();

		// Create second hero character
		const [secondCharacter] = await db
			.insert(characters)
			.values({
				type: 'hero',
				characterTypeId: secondCharacterType.id,
				stats: {
					...secondCharacterType.baseStats,
					health: secondCharacterType.baseStats.maxHealth
				},
				level: 1
			})
			.returning();

		// Find or create boss character type
		let bossCharacterType = allCharacterTypes.find((ct) => ct.name === 'Boss');
		if (!bossCharacterType) {
			// Create boss character type if it doesn't exist
			const [newBossType] = await db
				.insert(characterTypes)
				.values({
					name: 'Boss',
					imageUrl: null,
					baseStats: {
						health: 500,
						maxHealth: 500,
						attack: 20
					}
				})
				.returning();
			bossCharacterType = newBossType;
		}

		// Boss level starts at 1
		const initialBossLevel = 1;
		const bossStats = getBossStats(initialBossLevel);

		// Create boss character with stats scaled by level
		const [bossCharacter] = await db
			.insert(characters)
			.values({
				type: 'enemy',
				characterTypeId: bossCharacterType.id,
				stats: bossStats
			})
			.returning();

		// Create the game with both heroes and boss
		const [newGame] = await db
			.insert(games)
			.values({
				name: validatedData.name,
				characterIds: [firstCharacter.id, secondCharacter.id, bossCharacter.id],
				bossLevel: initialBossLevel
			})
			.returning();

		return json(newGame, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json({ error: 'Validation error', details: error.issues }, { status: 400 });
		}
		console.error('Error creating game:', error);
		return json({ error: 'Failed to create game' }, { status: 500 });
	}
};
