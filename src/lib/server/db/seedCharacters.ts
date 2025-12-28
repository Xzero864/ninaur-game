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
