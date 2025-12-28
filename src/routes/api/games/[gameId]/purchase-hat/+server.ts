import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { games, characters, characterTypes, upgrades } from '$lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { getBossStats } from '$lib/server/db/bossStats.js';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const gameId = parseInt(params.gameId);
		if (isNaN(gameId)) {
			return json({ error: 'Invalid game ID' }, { status: 400 });
		}

		const body = await request.json();
		const { characterTypeId, hatId } = body;

		if (typeof characterTypeId !== 'number') {
			return json({ error: 'Invalid character type ID' }, { status: 400 });
		}

		// hatId can be null for characters without hats
		if (hatId !== null && typeof hatId !== 'number') {
			return json({ error: 'Invalid hat ID' }, { status: 400 });
		}

		// Verify the game exists
		const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);

		if (!game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		// Get character type
		const [characterType] = await db
			.select()
			.from(characterTypes)
			.where(eq(characterTypes.id, characterTypeId))
			.limit(1);

		if (!characterType) {
			return json({ error: 'Character type not found' }, { status: 404 });
		}

		let initialStats = { ...characterType.baseStats };
		initialStats.health = initialStats.maxHealth;

		// Apply hat stats if hatId is provided
		if (hatId !== null) {
			// Find hat upgrade by hatId
			const allUpgrades = await db.select().from(upgrades);
			const hatUpgrade = allUpgrades.find((u) => {
				const effect = u.effect as { type?: string; hatId?: number };
				return effect.type === 'hat' && effect.hatId === hatId;
			});

			if (!hatUpgrade) {
				return json({ error: 'Hat not found' }, { status: 404 });
			}

			const hatEffect = hatUpgrade.effect as {
				type: string;
				hatId: number;
				stat: string;
				amount?: number;
				health?: number;
				attack?: number;
			};

			// Apply hat stats
			if (hatEffect.stat === 'attack') {
				initialStats.attack = (initialStats.attack || 0) + (hatEffect.amount || 0);
			} else if (hatEffect.stat === 'maxHealth' || hatEffect.stat === 'health') {
				initialStats.maxHealth = (initialStats.maxHealth || 0) + (hatEffect.amount || 0);
				initialStats.health = initialStats.maxHealth;
			} else if (hatEffect.stat === 'balanced') {
				initialStats.maxHealth = (initialStats.maxHealth || 0) + (hatEffect.health || 0);
				initialStats.health = initialStats.maxHealth;
				initialStats.attack = (initialStats.attack || 0) + (hatEffect.attack || 0);
			}
		}

		// Create the new character
		const [newCharacter] = await db
			.insert(characters)
			.values({
				type: 'hero',
				characterTypeId: characterTypeId,
				stats: initialStats,
				level: 1,
				hatId: hatId
			})
			.returning();

		// Add character to game
		const updatedCharacterIds = [...game.characterIds, newCharacter.id];

		await db
			.update(games)
			.set({ characterIds: updatedCharacterIds })
			.where(eq(games.id, gameId));

		return json({ success: true, character: newCharacter });
	} catch (error) {
		console.error('Error purchasing hat/character:', error);
		return json({ error: 'Failed to purchase hat/character' }, { status: 500 });
	}
};

