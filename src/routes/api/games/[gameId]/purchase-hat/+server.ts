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
		const { characterTypeId, hatId, removeCharacterId } = body;

		if (typeof characterTypeId !== 'number') {
			return json({ error: 'Invalid character type ID' }, { status: 400 });
		}

		// hatId can be null for characters without hats
		if (hatId !== null && typeof hatId !== 'number') {
			return json({ error: 'Invalid hat ID' }, { status: 400 });
		}

		if (removeCharacterId !== undefined && typeof removeCharacterId !== 'number') {
			return json({ error: 'Invalid removeCharacterId' }, { status: 400 });
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

		// Enforce max 5 heroes. If already at 5, require selecting one to remove.
		const existingCharacters = await db
			.select()
			.from(characters)
			.where(inArray(characters.id, game.characterIds));

		const existingHeroIds = existingCharacters.filter((c) => c.type === 'hero').map((c) => c.id);
		if (existingHeroIds.length >= 5) {
			if (removeCharacterId === undefined) {
				return json({ error: 'You already have 5 heroes. Select one to remove.' }, { status: 400 });
			}
			if (!existingHeroIds.includes(removeCharacterId)) {
				return json(
					{ error: 'Selected character to remove is not a hero in this game' },
					{ status: 400 }
				);
			}
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

		// Remove selected hero if needed (swap)
		let updatedCharacterIds = [...game.characterIds];
		if (removeCharacterId !== undefined && existingHeroIds.length >= 5) {
			updatedCharacterIds = updatedCharacterIds.filter((id) => id !== removeCharacterId);
			await db.delete(characters).where(eq(characters.id, removeCharacterId));
		}

		// Add character to game
		updatedCharacterIds = [...updatedCharacterIds, newCharacter.id];

		await db.update(games).set({ characterIds: updatedCharacterIds }).where(eq(games.id, gameId));

		return json({ success: true, character: newCharacter });
	} catch (error) {
		console.error('Error purchasing hat/character:', error);
		return json({ error: 'Failed to purchase hat/character' }, { status: 500 });
	}
};
