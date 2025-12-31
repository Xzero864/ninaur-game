import { db } from './index.js';
import { characterTypes } from './schema.js';
import type { CharacterType } from './schema.js';
import type { Stats } from '$lib/gameLogic/types.js';
import { eq } from 'drizzle-orm';

type CharacterDefinition = {
	name: string;
	imageUrl: string | null;
	baseStats: Stats;
};

const characters: CharacterDefinition[] = [
	{
		name: 'Spoob',
		imageUrl: '/characters/spoob.png',
		baseStats: {
			health: 20,
			maxHealth: 20,
			attack: 3
		}
	},
	{
		name: 'Stoob',
		imageUrl: '/characters/stoob.png',
		baseStats: {
			health: 22,
			maxHealth: 22,
			attack: 3
		}
	},
	{
		name: 'Small Bloob',
		imageUrl: '/characters/small-bloob.png',
		baseStats: {
			health: 25,
			maxHealth: 25,
			attack: 2
		}
	},
	{
		name: 'Cat',
		imageUrl: '/characters/cat.png',
		baseStats: {
			health: 27,
			maxHealth: 27,
			attack: 2
		}
	},
	{
		name: 'Deformed Duck Lamp',
		imageUrl: '/characters/deformed-duck-lamp.png',
		baseStats: {
			health: 30,
			maxHealth: 30,
			attack: 1
		}
	},
	{
		name: 'Medium Bloob',
		imageUrl: '/characters/medium-bloob.png',
		baseStats: {
			health: 23,
			maxHealth: 23,
			attack: 3
		}
	},
	{
		name: 'Pocky',
		imageUrl: '/characters/pocky.png',
		baseStats: {
			health: 24,
			maxHealth: 24,
			attack: 2
		}
	},
	{
		name: 'Socky',
		imageUrl: '/characters/socky.png',
		baseStats: {
			health: 26,
			maxHealth: 26,
			attack: 2
		}
	},
	{
		name: 'Duck',
		imageUrl: '/characters/duck.png',
		baseStats: {
			health: 28,
			maxHealth: 28,
			attack: 2
		}
	},
	{
		name: 'Pink Bloob',
		imageUrl: '/characters/pink-bloob.png',
		baseStats: {
			health: 21,
			maxHealth: 21,
			attack: 3
		}
	},
	{
		name: 'Bloob',
		imageUrl: '/characters/bloob.png',
		baseStats: {
			health: 24,
			maxHealth: 24,
			attack: 3
		}
	},
	{
		name: 'Lochy',
		imageUrl: '/characters/lochy.png',
		baseStats: {
			health: 25,
			maxHealth: 25,
			attack: 2
		}
	},
	{
		name: 'Ugly Spoob',
		imageUrl: '/characters/ugly-spoob.png',
		baseStats: {
			health: 19,
			maxHealth: 19,
			attack: 4
		}
	},
	{
		name: 'Boss',
		imageUrl: null,
		baseStats: {
			health: 30,
			maxHealth: 30,
			attack: 30
		}
	}
];

/**
 * Add a character type (idempotent - only adds if doesn't exist)
 */
async function addCharacter(characterDef: CharacterDefinition): Promise<CharacterType> {
	const existing = await db
		.select()
		.from(characterTypes)
		.where(eq(characterTypes.name, characterDef.name))
		.limit(1);

	if (existing.length > 0) {
		return existing[0];
	}

	const [characterType] = await db.insert(characterTypes).values(characterDef).returning();

	return characterType;
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
