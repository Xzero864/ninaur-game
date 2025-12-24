import { Ability } from './Ability.js';
import type { AbilityDefinition } from './AbilityDefinition.js';
import { getAbilityDefinition, getAbilityExecutor } from './abilityDefinitions.js';

export class AbilityFactory {
	/**
	 * Create an Ability instance from an AbilityDefinition
	 * Looks up the execute function from the registry
	 */
	static create(definition: AbilityDefinition): Ability {
		const executor = getAbilityExecutor(definition.id);

		if (!executor) {
			throw new Error(`No executor function found for ability: ${definition.id}`);
		}

		return new Ability(
			definition.id,
			definition.name,
			definition.description,
			executor,
			definition.contextType,
			definition.cooldown
		);
	}

	/**
	 * Create an Ability instance from an ability ID
	 * Looks up both the definition and executor
	 */
	static createFromId(abilityId: string): Ability {
		const definition = getAbilityDefinition(abilityId);

		if (!definition) {
			throw new Error(`No ability definition found for ID: ${abilityId}`);
		}

		return this.create(definition);
	}

	/**
	 * Create multiple Ability instances from an array of definitions
	 */
	static createMany(definitions: AbilityDefinition[]): Ability[] {
		return definitions.map((def) => this.create(def));
	}

	/**
	 * Create multiple Ability instances from an array of ability IDs
	 */
	static createManyFromIds(abilityIds: string[]): Ability[] {
		return abilityIds.map((id) => this.createFromId(id));
	}
}

