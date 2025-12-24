import { Character } from './characters/Character.svelte.js';
import { AbilityFactory } from './abilities/AbilityFactory.js';
import type { Stats } from './types.js';

type DbCharacter = {
	id: number;
	type: 'hero' | 'enemy';
	characterTypeId: number;
	level?: number;
	stats: Stats;
	characterType: {
		id: number;
		name: string;
		imageUrl: string | null;
		levelTwoAbilityId: string | null;
		levelThreeAbilityId: string | null;
		baseStats: Stats;
	};
};

/**
 * Convert a database character to a game logic Character instance
 * Characters start with only basic_attack ability
 * Boss stats are already scaled by bossLevel in the API response
 * Abilities are granted based on character level
 */
export function createCharacterFromDb(dbCharacter: DbCharacter): Character {
	// Characters always start with basic_attack
	const abilities = [AbilityFactory.createFromId('basic_attack')];

	const level = dbCharacter.level || 1;

	// Add level 2 ability if character is level 2 or higher
	if (level >= 2 && dbCharacter.characterType.levelTwoAbilityId) {
		const abilityId = String(dbCharacter.characterType.levelTwoAbilityId).trim();
		// Filter out basic_attack if it somehow got in there (shouldn't happen, but defensive)
		if (abilityId && abilityId !== 'basic_attack') {
			try {
				abilities.push(AbilityFactory.createFromId(abilityId));
			} catch (error) {
				console.error(
					`Failed to create ability ${abilityId} for character ${dbCharacter.characterType.name}:`,
					error
				);
			}
		}
	}

	// Add level 3 ability if character is level 3
	if (level >= 3 && dbCharacter.characterType.levelThreeAbilityId) {
		const abilityId = String(dbCharacter.characterType.levelThreeAbilityId).trim();
		// Filter out basic_attack if it somehow got in there
		if (abilityId && abilityId !== 'basic_attack') {
			try {
				abilities.push(AbilityFactory.createFromId(abilityId));
			} catch (error) {
				console.error(
					`Failed to create ability ${abilityId} for character ${dbCharacter.characterType.name}:`,
					error
				);
			}
		}
	}

	// Use the stats from the database (already scaled for boss if applicable)
	return new Character(
		dbCharacter.id.toString(),
		dbCharacter.characterType.name,
		dbCharacter.stats,
		abilities
	);
}
