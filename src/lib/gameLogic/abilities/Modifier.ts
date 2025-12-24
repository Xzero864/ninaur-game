import type { ModifierTrigger, AbilityContext, ContextType, ModifierType } from '../types.js';
import { ContextType as CT } from '../types.js';

export class Modifier {
	public stacks: number = 1; // Number of stacks for stackable modifiers

	constructor(
		public id: string,
		public name: string,
		public description: string,
		public modifierType: ModifierType, // 'one_time' or 'on_trigger'
		public trigger: ModifierTrigger, // Only used for 'on_trigger' modifiers
		// Effect function receives context and mutates the character directly
		// Using 'any' for character type to avoid circular dependency - will be properly typed at usage
		public effect: (context: AbilityContext, character: any) => void,
		public duration?: number, // undefined means permanent (only for 'on_trigger' modifiers)
		stacks?: number // Optional initial stack count
	) {
		if (stacks !== undefined) {
			this.stacks = stacks;
		}
	}

	// Check if this modifier should trigger for the given context
	// Only applies to 'on_trigger' modifiers
	shouldTrigger(context: AbilityContext): boolean {
		if (this.modifierType === 'one_time') {
			return false; // One-time modifiers don't use triggers
		}

		if (this.trigger.type === 'permanent') {
			return false; // Permanent modifiers don't trigger, they're always applied
		}

		if (this.trigger.type === CT.TURN_START && context.type === CT.TURN_START) {
			return true;
		}

		if (this.trigger.type === CT.TURN_END && context.type === CT.TURN_END) {
			return true;
		}

		if (this.trigger.type === 'on_ability' && context.type === this.trigger.contextType) {
			return true;
		}

		if (this.trigger.type === CT.DAMAGE && context.type === CT.DAMAGE) {
			return true;
		}

		if (this.trigger.type === CT.HEAL && context.type === CT.HEAL) {
			return true;
		}

		return false;
	}

	// Check if this modifier should trigger when a modifier is being added
	shouldTriggerOnModifierAdded(): boolean {
		if (this.modifierType === 'one_time') {
			return false;
		}

		return this.trigger.type === 'on_modifier_added';
	}

	// Apply the modifier effect - mutates the character
	apply(context: AbilityContext, character: any): void {
		this.effect(context, character);
	}
}
