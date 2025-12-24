import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { games, characters, characterTypes } from '$lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getBossStats } from '$lib/server/db/bossStats.js';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const gameId = parseInt(params.gameId);
		if (isNaN(gameId)) {
			return json({ error: 'Invalid game ID' }, { status: 400 });
		}

		// Fetch the game
		const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);

		if (!game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		// Fetch all characters for this game
		const gameCharacters = await db
			.select()
			.from(characters)
			.where(inArray(characters.id, game.characterIds));

		// Fetch character types for all characters
		const characterTypeIds = gameCharacters.map((c) => c.characterTypeId);
		const allCharacterTypes = await db
			.select()
			.from(characterTypes)
			.where(inArray(characterTypes.id, characterTypeIds));

		// Create a map for quick lookup
		const characterTypeMap = new Map(allCharacterTypes.map((ct) => [ct.id, ct]));

		// Combine characters with their types
		const gameCharactersWithTypes = gameCharacters.map((c) => ({
			...c,
			characterType: characterTypeMap.get(c.characterTypeId)
		}));

		// Separate heroes and enemies
		const heroes = gameCharactersWithTypes.filter((c) => c.type === 'hero');
		const enemies = gameCharactersWithTypes.filter((c) => c.type === 'enemy');

		// Scale boss stats based on boss level
		const scaledEnemies = enemies.map((e) => {
			// Check if this is a boss character (by character type name)
			if (e.characterType?.name === 'Boss') {
				const bossStats = getBossStats(game.bossLevel);
				return {
					...e,
					stats: {
						...e.stats,
						maxHealth: bossStats.maxHealth,
						health: Math.min(e.stats.health, bossStats.maxHealth), // Don't exceed new max
						attack: bossStats.attack
					}
				};
			}
			return e;
		});

		return json({
			id: game.id,
			name: game.name,
			characterIds: game.characterIds,
			bossLevel: game.bossLevel,
			heroes: heroes.map((h) => ({
				...h,
				level: h.level || 1
			})),
			enemies: scaledEnemies.map((e) => ({
				...e,
				level: e.level || 1
			}))
		});
	} catch (error) {
		console.error('Error fetching game:', error);
		return json({ error: 'Failed to fetch game' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const gameId = parseInt(params.gameId);
		if (isNaN(gameId)) {
			return json({ error: 'Invalid game ID' }, { status: 400 });
		}

		const body = await request.json();
		const { bossLevel } = body;

		if (typeof bossLevel !== 'number' || bossLevel < 1) {
			return json({ error: 'Invalid boss level' }, { status: 400 });
		}

		// Update game boss level
		const [updatedGame] = await db
			.update(games)
			.set({ bossLevel })
			.where(eq(games.id, gameId))
			.returning();

		if (!updatedGame) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		// Fetch all characters for this game
		const gameCharacters = await db
			.select()
			.from(characters)
			.where(inArray(characters.id, updatedGame.characterIds));

		// Fetch character types for all characters
		const characterTypeIds = gameCharacters.map((c) => c.characterTypeId);
		const allCharacterTypes = await db
			.select()
			.from(characterTypes)
			.where(inArray(characterTypes.id, characterTypeIds));

		// Create a map for quick lookup
		const characterTypeMap = new Map(allCharacterTypes.map((ct) => [ct.id, ct]));

		// Find boss character
		const bossCharacter = gameCharacters.find((c) => {
			const characterType = characterTypeMap.get(c.characterTypeId);
			return c.type === 'enemy' && characterType?.name === 'Boss';
		});

		if (bossCharacter) {
			const bossStats = getBossStats(bossLevel);

			await db
				.update(characters)
				.set({
					stats: bossStats
				})
				.where(eq(characters.id, bossCharacter.id));
		}

		return json({ success: true, bossLevel });
	} catch (error) {
		console.error('Error updating game:', error);
		return json({ error: 'Failed to update game' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		const gameId = parseInt(params.gameId);
		if (isNaN(gameId)) {
			return json({ error: 'Invalid game ID' }, { status: 400 });
		}

		const body = await request.json();
		const { characterId, level } = body;

		if (typeof characterId !== 'number' || typeof level !== 'number' || level < 1 || level > 2) {
			return json({ error: 'Invalid character ID or level (must be 1-2)' }, { status: 400 });
		}

		// Verify the character belongs to this game
		const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);

		if (!game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		if (!game.characterIds.includes(characterId)) {
			return json({ error: 'Character does not belong to this game' }, { status: 403 });
		}

		// Update character level
		const [updatedCharacter] = await db
			.update(characters)
			.set({ level })
			.where(eq(characters.id, characterId))
			.returning();

		if (!updatedCharacter) {
			return json({ error: 'Character not found' }, { status: 404 });
		}

		return json({ success: true, characterId, level });
	} catch (error) {
		console.error('Error updating character level:', error);
		return json({ error: 'Failed to update character level' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const gameId = parseInt(params.gameId);
		if (isNaN(gameId)) {
			return json({ error: 'Invalid game ID' }, { status: 400 });
		}

		const body = await request.json();
		const { characterTypeId } = body;

		if (typeof characterTypeId !== 'number') {
			return json({ error: 'Invalid character type ID' }, { status: 400 });
		}

		// Verify the game exists
		const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);

		if (!game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		// Check current hero count (max 5 heroes)
		const gameCharacters = await db
			.select()
			.from(characters)
			.where(inArray(characters.id, game.characterIds));

		const heroCount = gameCharacters.filter((c) => c.type === 'hero').length;

		if (heroCount >= 5) {
			return json({ error: 'Maximum of 5 heroes allowed' }, { status: 400 });
		}

		// Verify character type exists
		const [characterType] = await db
			.select()
			.from(characterTypes)
			.where(eq(characterTypes.id, characterTypeId))
			.limit(1);

		if (!characterType) {
			return json({ error: 'Character type not found' }, { status: 404 });
		}

		// Don't allow adding Boss as a hero
		if (characterType.name === 'Boss') {
			return json({ error: 'Cannot add Boss as a hero' }, { status: 400 });
		}

		// Create new hero character
		const [newCharacter] = await db
			.insert(characters)
			.values({
				type: 'hero',
				characterTypeId: characterType.id,
				stats: {
					...characterType.baseStats,
					health: characterType.baseStats.maxHealth
				},
				level: 1
			})
			.returning();

		// Add character ID to game's characterIds array and level up boss
		const updatedCharacterIds = [...game.characterIds, newCharacter.id];
		const newBossLevel = game.bossLevel + 1;

		const [updatedGame] = await db
			.update(games)
			.set({ 
				characterIds: updatedCharacterIds,
				bossLevel: newBossLevel
			})
			.where(eq(games.id, gameId))
			.returning();

		if (!updatedGame) {
			return json({ error: 'Failed to update game' }, { status: 500 });
		}

		// Update boss character stats based on new boss level
		const updatedGameCharacters = await db
			.select()
			.from(characters)
			.where(inArray(characters.id, updatedGame.characterIds));

		// Fetch character types for all characters
		const characterTypeIds = updatedGameCharacters.map((c) => c.characterTypeId);
		const allCharacterTypes = await db
			.select()
			.from(characterTypes)
			.where(inArray(characterTypes.id, characterTypeIds));

		// Create a map for quick lookup
		const characterTypeMap = new Map(allCharacterTypes.map((ct) => [ct.id, ct]));

		// Find boss character
		const bossCharacter = updatedGameCharacters.find((c) => {
			const characterType = characterTypeMap.get(c.characterTypeId);
			return c.type === 'enemy' && characterType?.name === 'Boss';
		});

		if (bossCharacter) {
			const bossStats = getBossStats(newBossLevel);

			await db
				.update(characters)
				.set({
					stats: bossStats
				})
				.where(eq(characters.id, bossCharacter.id));
		}

		return json({ success: true, characterId: newCharacter.id, bossLevel: newBossLevel });
	} catch (error) {
		console.error('Error adding character to game:', error);
		return json({ error: 'Failed to add character to game' }, { status: 500 });
	}
};
