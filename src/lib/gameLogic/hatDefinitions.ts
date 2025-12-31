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
		// Blue Baseball Hat - +20 health (permanent)
		description: '+20 Max Health',
		modifier: new Modifier(
			'hat_blue_baseball',
			'Blue Baseball Hat',
			'+20 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 20;
				character.stats.health += 20;
			}
		)
	},
	5: {
		// Red Baseball Hat - +20 health (permanent)
		description: '+20 Max Health',
		modifier: new Modifier(
			'hat_red_baseball',
			'Red Baseball Hat',
			'+20 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 20;
				character.stats.health += 20;
			}
		)
	},
	6: {
		// Bunny Ears - +2 attack (permanent)
		description: '+2 Attack',
		modifier: new Modifier(
			'hat_bunny_ears',
			'Bunny Ears',
			'+2 Attack',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 2;
			}
		)
	},
	7: {
		// Propeller Hat - +3 attack (permanent)
		description: '+3 Attack',
		modifier: new Modifier(
			'hat_propeller',
			'Propeller Hat',
			'+3 Attack',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 3;
			}
		)
	},
	8: {
		// Pretty Pink Bow - +15 health (permanent)
		description: '+15 Max Health',
		modifier: new Modifier(
			'hat_pink_bow',
			'Pretty Pink Bow',
			'+15 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 15;
				character.stats.health += 15;
			}
		)
	},
	9: {
		// Puke Penguin Hat - +25 health (permanent)
		description: '+25 Max Health',
		modifier: new Modifier(
			'hat_puke_penguin',
			'Puke Penguin Hat',
			'+25 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 25;
				character.stats.health += 25;
			}
		)
	},
	10: {
		// Blue Penguin Hat - +25 health (permanent)
		description: '+25 Max Health',
		modifier: new Modifier(
			'hat_blue_penguin',
			'Blue Penguin Hat',
			'+25 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 25;
				character.stats.health += 25;
			}
		)
	},
	11: {
		// Christmas Hat - +2 attack, +10 health (permanent)
		description: '+2 Attack, +10 Max Health',
		modifier: new Modifier(
			'hat_christmas',
			'Christmas Hat',
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
	12: {
		// Dove Hat - +3 attack (permanent)
		description: '+3 Attack',
		modifier: new Modifier(
			'hat_dove',
			'Dove Hat',
			'+3 Attack',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 3;
			}
		)
	},
	13: {
		// Small Red Bird - +2 attack (permanent)
		description: '+2 Attack',
		modifier: new Modifier(
			'hat_small_red_bird',
			'Small Red Bird',
			'+2 Attack',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 2;
			}
		)
	},
	14: {
		// Hard Hat - +30 health (permanent)
		description: '+30 Max Health',
		modifier: new Modifier(
			'hat_hard_hat',
			'Hard Hat',
			'+30 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.maxHealth += 30;
				character.stats.health += 30;
			}
		)
	},
	15: {
		// Leprechaun Hat - +4 attack (permanent)
		description: '+4 Attack',
		modifier: new Modifier(
			'hat_leprechaun',
			'Leprechaun Hat',
			'+4 Attack',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 4;
			}
		)
	},
	16: {
		// Dude Hat - +3 attack, +15 health (permanent)
		description: '+3 Attack, +15 Max Health',
		modifier: new Modifier(
			'hat_dude',
			'Dude Hat',
			'+3 Attack, +15 Max Health',
			'one_time',
			{ type: 'permanent' },
			(context, character) => {
				character.stats.attack += 3;
				character.stats.maxHealth += 15;
				character.stats.health += 15;
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

