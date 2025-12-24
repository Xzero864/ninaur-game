import type { Ability } from './abilities/Ability.js';
import type { Character } from './characters/Character.svelte.js';
import type { AbilityContext, ContextType } from './types.js';
import { ContextType as CT } from './types.js';

/**
 * Populates the correct context for an ability based on its expected context type.
 * @param ability - The ability to create context for
 * @param sourceCharacter - The character using the ability
 * @param targetCharacter - The target character (optional, defaults to enemy for attacks/debuffs, first alive hero for heals/buffs)
 * @param allHeroes - All hero characters (for finding targets)
 * @param enemy - The enemy character (for finding targets)
 * @returns The populated AbilityContext matching the ability's expected context type
 */
export function populateContext(
	ability: Ability,
	sourceCharacter: Character,
	targetCharacter: Character | null = null,
	allHeroes: Character[] = [],
	enemy: Character | null = null
): AbilityContext {
	const effectiveStats = sourceCharacter.getEffectiveStats();

	switch (ability.contextType) {
		case CT.ATTACK:
			// Attack context needs target and damage
			const attackTarget = targetCharacter ?? enemy;
			if (!attackTarget) {
				throw new Error('No target available for ATTACK ability');
			}
			return {
				type: CT.ATTACK,
				target: attackTarget.id,
				damage: effectiveStats.attack
			};

		case CT.HEAL:
			// Heal context needs target and amount
			const healTarget = targetCharacter ?? allHeroes.find((h) => h.isAlive()) ?? sourceCharacter;
			// Default heal amount could be based on stats or a fixed value
			// Using a percentage of max health as default
			const healAmount = Math.floor(effectiveStats.maxHealth * 0.2);
			return {
				type: CT.HEAL,
				target: healTarget.id,
				amount: healAmount
			};

		case CT.BUFF:
			// Buff context needs target, stat, value, and optional duration
			const buffTarget = targetCharacter ?? allHeroes.find((h) => h.isAlive()) ?? sourceCharacter;
			// Default buff: increase attack by 20%
			return {
				type: CT.BUFF,
				target: buffTarget.id,
				stat: 'attack',
				value: Math.floor(effectiveStats.attack * 0.2),
				duration: 3 // Default duration of 3 turns
			};

		case CT.DEBUFF:
			// Debuff context needs target, stat, value, and optional duration
			const debuffTarget = targetCharacter ?? enemy;
			if (!debuffTarget) {
				throw new Error('No target available for DEBUFF ability');
			}
			// Default debuff: reduce attack by 20%
			return {
				type: CT.DEBUFF,
				target: debuffTarget.id,
				stat: 'attack',
				value: Math.floor(effectiveStats.attack * 0.2),
				duration: 3 // Default duration of 3 turns
			};

		case CT.DAMAGE:
			// Damage context needs target, damage, and source
			const damageTarget = targetCharacter ?? enemy;
			if (!damageTarget) {
				throw new Error('No target available for DAMAGE ability');
			}
			return {
				type: CT.DAMAGE,
				target: damageTarget.id,
				damage: effectiveStats.attack,
				source: sourceCharacter.id
			};

		case CT.TURN_START:
			// Turn start context needs characterId
			return {
				type: CT.TURN_START,
				characterId: sourceCharacter.id
			};

		case CT.TURN_END:
			// Turn end context needs characterId
			return {
				type: CT.TURN_END,
				characterId: sourceCharacter.id
			};

		default:
			// Fallback to ATTACK if context type is unknown
			const fallbackTarget = targetCharacter ?? enemy;
			if (!fallbackTarget) {
				throw new Error('No target available for ability');
			}
			return {
				type: CT.ATTACK,
				target: fallbackTarget.id,
				damage: effectiveStats.attack
			};
	}
}
