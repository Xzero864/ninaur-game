import { Modifier } from './abilities/Modifier.js';
import { ContextType } from './types.js';
import type { ModifierTrigger } from './types.js';

export type HatDefinition = {
	modifier: Modifier;
	description: string;
};

// Hat definitions mapping hatId to modifier and description
export const hatDefinitions: Record<number, HatDefinition> = {
	1: {
		// Wizard Hat - +3 attack (permanent)
		description: '+3 Attack',
		modifier: new Modifier(
			'hat_wizard',
			'Wizard Hat',
			'+3 Attack',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 3;
			}
		)
	},
	2: {
		// Crown - +25 health (permanent)
		description: '+25 Max Health',
		modifier: new Modifier(
			'hat_crown',
			'Crown',
			'+25 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 25;
				character.stats.health += 25;
			}
		)
	},
	3: {
		// Cowboy Hat - +2 attack, +10 health (permanent)
		description: '+2 Attack, +10 Max Health',
		modifier: new Modifier(
			'hat_cowboy',
			'Cowboy Hat',
			'+2 Attack, +10 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 2;
				character.stats.maxHealth += 10;
				character.stats.health += 10;
			}
		)
	},
	4: {
		// Beret - +4 attack (permanent)
		description: '+4 Attack',
		modifier: new Modifier(
			'hat_beret',
			'Beret',
			'+4 Attack',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 4;
			}
		)
	},
	5: {
		// Helmet - +30 health (permanent)
		description: '+30 Max Health',
		modifier: new Modifier(
			'hat_helmet',
			'Helmet',
			'+30 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 30;
				character.stats.health += 30;
			}
		)
	},
	6: {
		// Party Hat - +1 attack, +15 health (permanent)
		description: '+1 Attack, +15 Max Health',
		modifier: new Modifier(
			'hat_party',
			'Party Hat',
			'+1 Attack, +15 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 1;
				character.stats.maxHealth += 15;
				character.stats.health += 15;
			}
		)
	},
	7: {
		// Top Hat - +5 attack (permanent)
		description: '+5 Attack',
		modifier: new Modifier(
			'hat_tophat',
			'Top Hat',
			'+5 Attack',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 5;
			}
		)
	},
	8: {
		// Baseball Cap - +20 health (permanent)
		description: '+20 Max Health',
		modifier: new Modifier(
			'hat_cap',
			'Baseball Cap',
			'+20 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 20;
				character.stats.health += 20;
			}
		)
	},
	9: {
		// Rock Hat - Heal 5 health when taking damage (trigger-based)
		description: 'Heal 5 HP when taking damage',
		modifier: new Modifier(
			'hat_rock',
			'Rock Hat',
			'Heal 5 HP when taking damage',
			'on_trigger',
			{ type: ContextType.DAMAGE },
			(context, character) => {
				// Heal 5 health when damage is taken
				character.stats.health = Math.min(
					character.stats.maxHealth,
					character.stats.health + 5
				);
			}
		)
	}
};

/**
 * Get hat definition by hatId
 */
export function getHatDefinition(hatId: number): HatDefinition | undefined {
	return hatDefinitions[hatId];
}

