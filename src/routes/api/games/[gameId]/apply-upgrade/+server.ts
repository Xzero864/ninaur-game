import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { games, characters, upgrades, characterTypes } from '$lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const gameId = parseInt(params.gameId);
		if (isNaN(gameId)) {
			return json({ error: 'Invalid game ID' }, { status: 400 });
		}

		const body = await request.json();
		const { upgradeId, characterId } = body;

		if (typeof upgradeId !== 'string' || typeof characterId !== 'number') {
			return json({ error: 'Invalid upgrade ID or character ID' }, { status: 400 });
		}

		// Verify the game exists
		const [game] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);

		if (!game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		// Verify the character belongs to this game
		if (!game.characterIds.includes(characterId)) {
			return json({ error: 'Character does not belong to this game' }, { status: 403 });
		}

		// Get the character
		const [character] = await db
			.select()
			.from(characters)
			.where(eq(characters.id, characterId))
			.limit(1);

		if (!character) {
			return json({ error: 'Character not found' }, { status: 404 });
		}

		// Get the upgrade definition
		const [upgrade] = await db
			.select()
			.from(upgrades)
			.where(eq(upgrades.id, upgradeId))
			.limit(1);

		if (!upgrade) {
			return json({ error: 'Upgrade not found' }, { status: 404 });
		}

		// Get character type to recalculate from base stats
		const [characterType] = await db
			.select()
			.from(characterTypes)
			.where(eq(characterTypes.id, character.characterTypeId))
			.limit(1);

		if (!characterType) {
			return json({ error: 'Character type not found' }, { status: 404 });
		}

		// Apply the upgrade effect (only hats now)
		const effect = upgrade.effect as { type: string; [key: string]: unknown };
		
		// Recalculate stats from base stats + new hat (removes old hat stats)
		let newStats = { ...characterType.baseStats };
		newStats.health = newStats.maxHealth; // Start with full health
		let newHatId = effect.hatId as number;

		if (effect.type === 'hat') {
			const stat = effect.stat as string;
			if (stat === 'attack') {
				newStats.attack = (newStats.attack || 0) + (effect.amount as number);
			} else if (stat === 'maxHealth' || stat === 'health') {
				newStats.maxHealth = (newStats.maxHealth || 0) + (effect.amount as number);
				newStats.health = newStats.maxHealth;
			} else if (stat === 'balanced') {
				newStats.maxHealth = (newStats.maxHealth || 0) + (effect.health as number);
				newStats.health = newStats.maxHealth;
				newStats.attack = (newStats.attack || 0) + (effect.attack as number);
			}
			
			// Preserve current health if it's less than new max (don't heal when changing hats)
			if (character.stats.health < character.stats.maxHealth) {
				newStats.health = Math.min(character.stats.health, newStats.maxHealth);
			}
		}

		// Update character with new stats and hat ID
		const [updatedCharacter] = await db
			.update(characters)
			.set({
				stats: newStats,
				hatId: newHatId
			})
			.where(eq(characters.id, characterId))
			.returning();

		if (!updatedCharacter) {
			return json({ error: 'Failed to update character' }, { status: 500 });
		}

		return json({ success: true, character: updatedCharacter });
	} catch (error) {
		console.error('Error applying upgrade:', error);
		return json({ error: 'Failed to apply upgrade' }, { status: 500 });
	}
};

