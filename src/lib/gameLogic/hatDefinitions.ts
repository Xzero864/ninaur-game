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
		// Wizard Hat - +3 attack (from DB) + Double Damage on attacks
		description: '+3 Attack + Double Damage',
		modifier: new Modifier(
			'hat_wizard',
			'Wizard Hat',
			'+3 Attack + Double Damage',
			'on_trigger',
			{ type: ContextType.ATTACK },
			(context, character) => {
				if (context.type === ContextType.ATTACK) {
					context.damage *= 2;
				}
			}
		)
	},
	2: {
		// Top Hat - +5 attack (from DB) + Heals when hit
		description: '+5 Attack + Heal 2 when hit',
		modifier: new Modifier(
			'hat_tophat',
			'Top Hat',
			'+5 Attack + Heal 2 when hit',
			'on_trigger',
			{ type: ContextType.DAMAGE },
			(context, character) => {
				// Heal 2 on taking damage (pre-damage; net effect still feels like "heal when hit")
				character.stats.health = Math.min(character.stats.maxHealth, character.stats.health + 2);
			}
		)
	},
	3: {
		// Cowboy Hat - +2 attack, +10 health (from DB) + Reduce incoming damage by 2
		description: '+2 Attack, +10 Max Health + -2 Damage taken',
		modifier: new Modifier(
			'hat_cowboy',
			'Cowboy Hat',
			'+2 Attack, +10 Max Health + -2 Damage taken',
			'on_trigger',
			{ type: ContextType.DAMAGE },
			(context, character) => {
				if (context.type === ContextType.DAMAGE) {
					context.damage = Math.max(0, context.damage - 2);
				}
			}
		)
	},
	4: {
		// Blue Baseball Hat - +20 health (from DB) + Heal 2 at turn start
		description: '+20 Max Health + Heal 2 at turn start',
		modifier: new Modifier(
			'hat_blue_baseball',
			'Blue Baseball Hat',
			'+20 Max Health + Heal 2 at turn start',
			'on_trigger',
			{ type: ContextType.TURN_START },
			(context, character) => {
				character.stats.health = Math.min(character.stats.maxHealth, character.stats.health + 2);
			}
		)
	},
	5: {
		// Red Baseball Hat - +20 health (from DB) + Big bonus damage if at full health
		description: '+20 Max Health + +5 Damage when full health',
		modifier: new Modifier(
			'hat_red_baseball',
			'Red Baseball Hat',
			'+20 Max Health + +5 Damage when full health',
			'on_trigger',
			{ type: ContextType.ATTACK },
			(context, character) => {
				if (
					context.type === ContextType.ATTACK &&
					character.stats.health >= character.stats.maxHealth
				) {
					context.damage += 5;
				}
			}
		)
	},
	6: {
		// Bunny Ears - +2 attack (from DB) + Berserk when low HP
		description: '+2 Attack + Double Damage below 50% HP',
		modifier: new Modifier(
			'hat_bunny_ears',
			'Bunny Ears',
			'+2 Attack + Double Damage below 50% HP',
			'on_trigger',
			{ type: ContextType.ATTACK },
			(context, character) => {
				if (
					context.type === ContextType.ATTACK &&
					character.stats.health <= Math.floor(character.stats.maxHealth / 2)
				) {
					context.damage *= 2;
				}
			}
		)
	},
	7: {
		// Propeller Hat - +3 attack (from DB) + Heal 1 at turn end
		description: '+3 Attack + Heal 1 at turn end',
		modifier: new Modifier(
			'hat_propeller',
			'Propeller Hat',
			'+3 Attack + Heal 1 at turn end',
			'on_trigger',
			{ type: ContextType.TURN_END },
			(context, character) => {
				character.stats.health = Math.min(character.stats.maxHealth, character.stats.health + 1);
			}
		)
	},
	8: {
		// Pretty Pink Bow - +15 health (from DB) + Heals are stronger
		description: '+15 Max Health + +3 extra healing',
		modifier: new Modifier(
			'hat_pink_bow',
			'Pretty Pink Bow',
			'+15 Max Health + +3 extra healing',
			'on_trigger',
			{ type: ContextType.HEAL },
			(context, character) => {
				if (context.type === ContextType.HEAL) {
					context.amount += 3;
				}
			}
		)
	},
	9: {
		// Puke Penguin Hat - +25 health (from DB) + Heal 1 when hit
		description: '+25 Max Health + Heal 1 when hit',
		modifier: new Modifier(
			'hat_puke_penguin',
			'Puke Penguin Hat',
			'+25 Max Health + Heal 1 when hit',
			'on_trigger',
			{ type: ContextType.DAMAGE },
			(context, character) => {
				character.stats.health = Math.min(character.stats.maxHealth, character.stats.health + 1);
			}
		)
	},
	10: {
		// Blue Penguin Hat - +25 health (from DB) + Reduce incoming damage by 1
		description: '+25 Max Health + -1 Damage taken',
		modifier: new Modifier(
			'hat_blue_penguin',
			'Blue Penguin Hat',
			'+25 Max Health + -1 Damage taken',
			'on_trigger',
			{ type: ContextType.DAMAGE },
			(context, character) => {
				if (context.type === ContextType.DAMAGE) {
					context.damage = Math.max(0, context.damage - 1);
				}
			}
		)
	},
	11: {
		// Christmas Hat - +2 attack, +10 health (from DB) + Bonus damage and small heal on attack
		description: '+2 Attack, +10 Max Health + +2 Damage + Heal 1 on attack',
		modifier: new Modifier(
			'hat_christmas',
			'Christmas Hat',
			'+2 Attack, +10 Max Health + +2 Damage + Heal 1 on attack',
			'on_trigger',
			{ type: ContextType.ATTACK },
			(context, character) => {
				if (context.type === ContextType.ATTACK) {
					context.damage += 2;
					character.stats.health = Math.min(character.stats.maxHealth, character.stats.health + 1);
				}
			}
		)
	},
	12: {
		// Dove Hat - +3 attack (from DB) + Big damage reduction on hit
		description: '+3 Attack + -3 Damage taken',
		modifier: new Modifier(
			'hat_dove',
			'Dove Hat',
			'+3 Attack + -3 Damage taken',
			'on_trigger',
			{ type: ContextType.DAMAGE },
			(context, character) => {
				if (context.type === ContextType.DAMAGE) {
					context.damage = Math.max(0, context.damage - 3);
				}
			}
		)
	},
	13: {
		// Small Red Bird - +2 attack (from DB) + Flat +3 bonus damage
		description: '+2 Attack + +3 Damage',
		modifier: new Modifier(
			'hat_small_red_bird',
			'Small Red Bird',
			'+2 Attack + +3 Damage',
			'on_trigger',
			{ type: ContextType.ATTACK },
			(context, character) => {
				if (context.type === ContextType.ATTACK) {
					context.damage += 3;
				}
			}
		)
	},
	14: {
		// Hard Hat - +30 health (from DB) + Huge damage reduction
		description: '+30 Max Health + -5 Damage taken',
		modifier: new Modifier(
			'hat_hard_hat',
			'Hard Hat',
			'+30 Max Health + -5 Damage taken',
			'on_trigger',
			{ type: ContextType.DAMAGE },
			(context, character) => {
				if (context.type === ContextType.DAMAGE) {
					context.damage = Math.max(0, context.damage - 5);
				}
			}
		)
	},
	15: {
		// Leprechaun Hat - +4 attack (from DB) + Heal 4 at turn start
		description: '+4 Attack + Heal 4 at turn start',
		modifier: new Modifier(
			'hat_leprechaun',
			'Leprechaun Hat',
			'+4 Attack + Heal 4 at turn start',
			'on_trigger',
			{ type: ContextType.TURN_START },
			(context, character) => {
				character.stats.health = Math.min(character.stats.maxHealth, character.stats.health + 4);
			}
		)
	},
	16: {
		// Dude Hat - +3 attack, +15 health (from DB) + Lifesteal on attack
		description: '+3 Attack, +15 Max Health + Heal 2 on attack',
		modifier: new Modifier(
			'hat_dude',
			'Dude Hat',
			'+3 Attack, +15 Max Health + Heal 2 on attack',
			'on_trigger',
			{ type: ContextType.ATTACK },
			(context, character) => {
				if (context.type === ContextType.ATTACK) {
					character.stats.health = Math.min(character.stats.maxHealth, character.stats.health + 2);
				}
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
