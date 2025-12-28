import { Character } from './characters/Character.svelte.js';
import type { Stats } from './types.js';
import { getHatDefinition } from './hatDefinitions.js';
import { ContextType } from './types.js';

type DbCharacter = {
	id: number;
	type: 'hero' | 'enemy';
	characterTypeId: number;
	level?: number;
	hatId?: number | null;
	stats: Stats;
	characterType: {
		id: number;
		name: string;
		imageUrl: string | null;
		baseStats: Stats;
	};
};

/**
 * Convert a database character to a game logic Character instance
 * Boss stats are already scaled by bossLevel in the API response
 * Applies hat modifiers if the character has a hat
 */
export function createCharacterFromDb(dbCharacter: DbCharacter): Character {
	// Use the stats from the database (already scaled for boss if applicable)
	const character = new Character(
		dbCharacter.id.toString(),
		dbCharacter.characterType.name,
		dbCharacter.stats
	);

	// Apply hat modifier if character has a hat
	if (dbCharacter.hatId) {
		const hatDef = getHatDefinition(dbCharacter.hatId);
		if (hatDef) {
			// Add the modifier to the character's modifier list
			// Note: Stats already include hat bonuses from database, so we don't re-apply permanent modifiers
			// The modifier is added so it can be used for trigger-based effects in the future
			character.addModifier(hatDef.modifier);
			
			// For trigger-based modifiers (not permanent), they'll be applied when triggers occur
			// Permanent modifiers don't need to be applied since stats already reflect them
		}
	}

	return character;
}
