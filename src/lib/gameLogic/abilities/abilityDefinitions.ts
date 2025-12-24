import type { AbilityDefinition, AbilityExecuteFunction } from './AbilityDefinition.js';
import type { AbilityContext } from '../types.js';
import { ContextType as CT } from '../types.js';
import { Modifier } from './Modifier.js';

// All ability definitions (JSON-serializable)
export const abilityDefinitions: AbilityDefinition[] = [
	{
		id: 'basic_attack',
		name: 'Basic Attack',
		description: 'A simple attack dealing damage based on attack stat',
		contextType: CT.ATTACK,
		cooldown: 0
	},
	{
		id: 'heal',
		name: 'Heal',
		description: 'Restores health to an ally',
		contextType: CT.HEAL,
		cooldown: 3
	},
	{
		id: 'power_attack',
		name: 'Power Attack',
		description: 'A powerful attack with increased damage',
		contextType: CT.ATTACK,
		cooldown: 2
	},
	{
		id: 'buff_attack',
		name: 'Attack Buff',
		description: 'Increases attack stat',
		contextType: CT.BUFF,
		cooldown: 4
	},
	{
		id: 'debuff_attack',
		name: 'Weaken',
		description: 'Reduces enemy attack stat',
		contextType: CT.DEBUFF,
		cooldown: 3
	},
	{
		id: 'shield',
		name: 'Shield',
		description: 'Increases max health',
		contextType: CT.BUFF,
		cooldown: 4
	},
	{
		id: 'poison',
		name: 'Poison',
		description: 'Deals damage over time to enemy',
		contextType: CT.DEBUFF,
		cooldown: 3
	},
	{
		id: 'light_up',
		name: 'Light Up',
		description: 'Burns the enemy, applying 5 burn stacks',
		contextType: CT.DEBUFF,
		cooldown: 3
	}
];

// Registry of execute functions for each ability - produces modifiers
export const abilityExecutors: Record<string, AbilityExecuteFunction> = {
	basic_attack: (context: AbilityContext): Modifier => {
		// One-time modifier: deal damage immediately
		return new Modifier(
			`basic_attack_${Date.now()}`,
			'Basic Attack',
			'Deals damage',
			'one_time',
			{ type: CT.DAMAGE }, // Not used for one-time, but required
			(damageContext: AbilityContext, character: any) => {
				// Use the original context passed to the ability
				if (context.type === CT.ATTACK) {
					character.takeDamage(context.damage, context.target);
				}
			}
		);
	},

	heal: (context: AbilityContext): Modifier => {
		// One-time modifier: heal immediately
		return new Modifier(
			`heal_${Date.now()}`,
			'Heal',
			'Restores health',
			'one_time',
			{ type: CT.HEAL }, // Not used for one-time, but required
			(healContext: AbilityContext, character: any) => {
				// Use the original context passed to the ability
				if (context.type === CT.HEAL) {
					const healAmount = Math.floor(context.amount * 1.2); // 20% bonus
					character.heal(healAmount);
				}
			}
		);
	},

	power_attack: (context: AbilityContext): Modifier => {
		// One-time modifier: deal increased damage
		return new Modifier(
			`power_attack_${Date.now()}`,
			'Power Attack',
			'Deals increased damage',
			'one_time',
			{ type: CT.DAMAGE }, // Not used for one-time, but required
			(damageContext: AbilityContext, character: any) => {
				// Use the original context passed to the ability
				if (context.type === CT.ATTACK) {
					const damage = Math.floor(context.damage * 1.5); // 1.5x damage
					character.takeDamage(damage, context.target);
				}
			}
		);
	},

	buff_attack: (context: AbilityContext): Modifier => {
		// OnTrigger modifier: increases attack stat, triggers on permanent (always active)
		return new Modifier(
			`buff_attack_${Date.now()}`,
			'Attack Buff',
			'Increases attack stat',
			'on_trigger',
			{ type: 'permanent' },
			(buffContext: AbilityContext, character: any) => {
				if (context.type === CT.BUFF) {
					character.stats.attack += context.value || 10;
				}
			},
			3 // Duration: 3 turns
		);
	},

	debuff_attack: (context: AbilityContext): Modifier => {
		// OnTrigger modifier: reduces enemy attack stat
		return new Modifier(
			`debuff_attack_${Date.now()}`,
			'Weaken',
			'Reduces attack stat',
			'on_trigger',
			{ type: 'permanent' },
			(debuffContext: AbilityContext, character: any) => {
				if (context.type === CT.DEBUFF) {
					character.stats.attack = Math.max(0, character.stats.attack - (context.value || 5));
				}
			},
			2 // Duration: 2 turns
		);
	},

	shield: (context: AbilityContext): Modifier => {
		// OnTrigger modifier: increases max health
		return new Modifier(
			`shield_${Date.now()}`,
			'Shield',
			'Increases max health',
			'on_trigger',
			{ type: 'permanent' },
			(shieldContext: AbilityContext, character: any) => {
				if (context.type === CT.BUFF) {
					character.stats.maxHealth += context.value || 5;
					character.stats.health += context.value || 5; // Also increase current health
				}
			},
			3 // Duration: 3 turns
		);
	},

	poison: (context: AbilityContext): Modifier => {
		// OnTrigger modifier: deals damage over time
		return new Modifier(
			`poison_${Date.now()}`,
			'Poison',
			'Deals damage over time',
			'on_trigger',
			{ type: CT.DAMAGE },
			(poisonContext: AbilityContext, character: any) => {
				if (context.type === CT.DEBUFF) {
					// Use value from context (which should be based on attack stat)
					const poisonDamage = Math.floor((context.value || 5) * 0.5); // 50% of debuff value
					character.takeDamage(poisonDamage, context.target);
				}
			},
			3 // Duration: 3 turns
		);
	},

	light_up: (context: AbilityContext): Modifier => {
		// Creates a burn modifier with 5 stacks
		// Burn deals 1 damage per stack at end of turn, then removes 1 stack
		return new Modifier(
			'burn_light_up', // Use fixed ID so stacks accumulate
			'Burn',
			'Deals 1 damage per stack at end of turn',
			'on_trigger',
			{ type: CT.TURN_END }, // Triggers at turn end (though we handle it manually in GameEngine)
			() => {
				// Effect is handled in GameEngine.endRound() for burn modifiers
			},
			undefined, // No duration - stacks control when it expires
			5 // 5 stacks
		);
	}
};

// Helper function to get ability definition by ID
export function getAbilityDefinition(id: string): AbilityDefinition | undefined {
	return abilityDefinitions.find((def) => def.id === id);
}

// Helper function to get execute function by ID
export function getAbilityExecutor(id: string): AbilityExecuteFunction | undefined {
	return abilityExecutors[id];
}
