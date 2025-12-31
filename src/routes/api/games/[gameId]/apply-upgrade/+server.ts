import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { games, characters, upgrades, characterTypes } from '$lib/server/db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

type HatDelta = { attack: number; maxHealth: number };

function hatDeltaFromEffect(effect: any): HatDelta {
	if (!effect || effect.type !== 'hat') return { attack: 0, maxHealth: 0 };
	const stat = effect.stat as string;
	if (stat === 'attack') return { attack: Number(effect.amount ?? 0), maxHealth: 0 };
	if (stat === 'maxHealth' || stat === 'health')
		return { attack: 0, maxHealth: Number(effect.amount ?? 0) };
	if (stat === 'balanced')
		return { attack: Number(effect.attack ?? 0), maxHealth: Number(effect.health ?? 0) };
	return { attack: 0, maxHealth: 0 };
}

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
		const [upgrade] = await db.select().from(upgrades).where(eq(upgrades.id, upgradeId)).limit(1);

		if (!upgrade) {
			return json({ error: 'Upgrade not found' }, { status: 404 });
		}

		// Get character type (kept for validation/consistency)
		const [characterType] = await db
			.select()
			.from(characterTypes)
			.where(eq(characterTypes.id, character.characterTypeId))
			.limit(1);

		if (!characterType) {
			return json({ error: 'Character type not found' }, { status: 404 });
		}

		// Apply the upgrade effect (hats)
		const effect = upgrade.effect as { type: string; [key: string]: unknown };
		if (effect.type !== 'hat') {
			return json({ error: 'Only hat upgrades are supported' }, { status: 400 });
		}

		const newHatId = effect.hatId as number;

		// Preserve permanent gains (like battle-won bonuses) by adjusting ONLY the hat delta.
		const currentStats = character.stats;

		const allUpgrades = await db.select().from(upgrades);

		const oldHatId = character.hatId ?? null;
		let oldHatDelta: HatDelta = { attack: 0, maxHealth: 0 };
		if (oldHatId) {
			const oldHatUpgrade = allUpgrades.find((u) => {
				const e = u.effect as { type?: string; hatId?: number };
				return e.type === 'hat' && e.hatId === oldHatId;
			});
			if (oldHatUpgrade) {
				oldHatDelta = hatDeltaFromEffect(oldHatUpgrade.effect);
			}
		}

		const newHatDelta = hatDeltaFromEffect(effect);

		// Remove old hat delta from current stats, then add new hat delta.
		const baseAttack = currentStats.attack - oldHatDelta.attack;
		const baseMaxHealth = currentStats.maxHealth - oldHatDelta.maxHealth;

		const nextMaxHealth = baseMaxHealth + newHatDelta.maxHealth;
		const nextAttack = baseAttack + newHatDelta.attack;

		// Do NOT heal when swapping hats; only clamp if max health shrinks.
		const nextHealth = Math.min(currentStats.health, nextMaxHealth);

		const newStats = {
			...currentStats,
			attack: nextAttack,
			maxHealth: nextMaxHealth,
			health: nextHealth
		};

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
