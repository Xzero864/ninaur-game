import type { AbilityContext, ContextType } from '../types.js';
import type { Modifier } from './Modifier.js';

export class Ability {
	constructor(
		public id: string,
		public name: string,
		public description: string,
		public execute: (context: AbilityContext) => Modifier | Modifier[],
		public contextType: ContextType,
		public cooldown?: number,
		public currentCooldown: number = 0
	) {}

	// Check if ability is ready to use
	isReady(): boolean {
		return this.currentCooldown === 0;
	}

	// Use the ability - returns modifiers to apply
	use(context: AbilityContext): Modifier | Modifier[] {
		if (!this.isReady()) {
			throw new Error(`Ability ${this.name} is on cooldown`);
		}

		const result = this.execute(context);

		// Set cooldown if applicable
		if (this.cooldown) {
			this.currentCooldown = this.cooldown;
		}

		return result;
	}

	// Reduce cooldown by 1 (called at end of turn)
	tickCooldown(): void {
		if (this.currentCooldown > 0) {
			this.currentCooldown--;
		}
	}
}

