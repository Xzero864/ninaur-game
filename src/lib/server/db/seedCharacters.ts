import { db } from './index.js';
import { characterTypes } from './schema.js';
import type { CharacterType } from './schema.js';
import type { Stats } from '$lib/gameLogic/types.js';
import { eq } from 'drizzle-orm';

type CharacterDefinition = {
	name: string;
	imageUrl: string | null;
	baseStats: Stats;
	hatX: number;
	hatY: number;
};

// Shared hat position for: Spoob, Bloob, Pink Bloob, Medium Bloob
const SPOOB_BLOOB_HAT_POS = { hatX: 48, hatY: 72 };

const MEDIUM_BLOOB_HAT_POS = { hatX: 48, hatY: 104 };

// Shared hat position for: Socky, Pocky, Lochy
const SOCKY_POCKY_LOCHY_HAT_POS = { hatX: 72, hatY: 112 };
const SOCKY_HAT_POS = { hatX: 72, hatY: 114 };
const POCKY_HAT_POS = { hatX: 78, hatY: 112 };
const LOCHY_HAT_POS = { hatX: 78, hatY: 112 };

const STOOB_HAT_POS = { hatX: 48, hatY: 64 };
const SMALL_BLOOB_HAT_POS = { hatX: 48, hatY: 138 };
const CAT_HAT_POS = { hatX: 48, hatY: 44 };
const DEFORMED_DUCK_LAMP_HAT_POS = { hatX: 48, hatY: 84 };
const DUCK_HAT_POS = { hatX: 48, hatY: 44 };
const UGLY_SPOOB_HAT_POS = { hatX: 48, hatY: 84 };
const BOSS_HAT_POS = { hatX: 48, hatY: 32 };
const characters: CharacterDefinition[] = [
	{
		name: 'Spoob',
		imageUrl: '/characters/spoob.png',
		baseStats: {
			health: 20,
			maxHealth: 20,
			attack: 3
		},
		...SPOOB_BLOOB_HAT_POS
	},
	{
		name: 'Stoob',
		imageUrl: '/characters/stoob.png',
		baseStats: {
			health: 22,
			maxHealth: 22,
			attack: 3
		},
		...STOOB_HAT_POS
	},
	{
		name: 'Small Bloob',
		imageUrl: '/characters/small-bloob.png',
		baseStats: {
			health: 25,
			maxHealth: 25,
			attack: 2
		},
		...SMALL_BLOOB_HAT_POS
	},
	{
		name: 'Cat',
		imageUrl: '/characters/cat.png',
		baseStats: {
			health: 27,
			maxHealth: 27,
			attack: 2
		},
		...CAT_HAT_POS
	},
	{
		name: 'Deformed Duck Lamp',
		imageUrl: '/characters/deformed-duck-lamp.png',
		baseStats: {
			health: 30,
			maxHealth: 30,
			attack: 1
		},
		...DEFORMED_DUCK_LAMP_HAT_POS
	},
	{
		name: 'Medium Bloob',
		imageUrl: '/characters/medium-bloob.png',
		baseStats: {
			health: 23,
			maxHealth: 23,
			attack: 3
		},
		...MEDIUM_BLOOB_HAT_POS
	},
	{
		name: 'Pocky',
		imageUrl: '/characters/pocky.png',
		baseStats: {
			health: 24,
			maxHealth: 24,
			attack: 2
		},
		...POCKY_HAT_POS
	},
	{
		name: 'Socky',
		imageUrl: '/characters/socky.png',
		baseStats: {
			health: 26,
			maxHealth: 26,
			attack: 2
		},
		...SOCKY_HAT_POS
	},
	{
		name: 'Duck',
		imageUrl: '/characters/duck.png',
		baseStats: {
			health: 28,
			maxHealth: 28,
			attack: 2
		},
		...DUCK_HAT_POS
	},
	{
		name: 'Pink Bloob',
		imageUrl: '/characters/pink-bloob.png',
		baseStats: {
			health: 21,
			maxHealth: 21,
			attack: 3
		},
		...SPOOB_BLOOB_HAT_POS
	},
	{
		name: 'Bloob',
		imageUrl: '/characters/bloob.png',
		baseStats: {
			health: 24,
			maxHealth: 24,
			attack: 3
		},
		...SPOOB_BLOOB_HAT_POS
	},
	{
		name: 'Lochy',
		imageUrl: '/characters/lochy.png',
		baseStats: {
			health: 25,
			maxHealth: 25,
			attack: 2
		},
		...LOCHY_HAT_POS
	},
	{
		name: 'Ugly Spoob',
		imageUrl: '/characters/ugly-spoob.png',
		baseStats: {
			health: 19,
			maxHealth: 19,
			attack: 4
		},
		...UGLY_SPOOB_HAT_POS
	},
	{
		name: 'Boss',
		imageUrl: '/characters/boss.png',
		baseStats: {
			health: 30,
			maxHealth: 30,
			attack: 30
		},
		...BOSS_HAT_POS
	}
];

/**
 * Add or update a character type (idempotent by name)
 */
async function addCharacter(characterDef: CharacterDefinition): Promise<CharacterType> {
	const existing = await db
		.select()
		.from(characterTypes)
		.where(eq(characterTypes.name, characterDef.name))
		.limit(1);

	if (existing.length > 0) {
		const [updated] = await db
			.update(characterTypes)
			.set({
				imageUrl: characterDef.imageUrl,
				baseStats: characterDef.baseStats,
				hatX: characterDef.hatX,
				hatY: characterDef.hatY
			})
			.where(eq(characterTypes.id, existing[0].id))
			.returning();

		return updated;
	}

	const [inserted] = await db.insert(characterTypes).values(characterDef).returning();
	return inserted;
}

/**
 * Add all character types to the database
 * Iterates through the characters array and adds each one
 * Idempotent - safe to call multiple times
 */
export async function addCharacters(): Promise<CharacterType[]> {
	const results = await Promise.all(characters.map((char) => addCharacter(char)));

	console.log(`Successfully seeded ${results.length} character types`);
	return results;
}
