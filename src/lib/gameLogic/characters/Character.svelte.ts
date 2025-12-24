import type { Stats, AbilityContext, ContextType } from '../types.js';
import { ContextType as CT } from '../types.js';
import { Modifier } from '../abilities/Modifier.js';
import { Ability } from '../abilities/Ability.js';

export class Character {
	public id: string;
	public name: string;

	// Stats as Svelte state rune
	public stats = $state<Stats>({
		health: 100,
		maxHealth: 100,
		attack: 10
	});

	// Modifiers list as Svelte state rune
	public modifiers = $state<Modifier[]>([]);

	public abilities: Ability[] = [];

	constructor(id: string, name: string, baseStats: Stats, abilities: Ability[] = []) {
		this.id = id;
		this.name = name;
		// Update the state rune properties directly
		this.stats.health = baseStats.health;
		this.stats.maxHealth = baseStats.maxHealth;
		this.stats.attack = baseStats.attack;
		this.abilities = abilities;
	}

	// Add a modifier (or add stacks if it's a stackable modifier with the same ID)
	addModifier(modifier: Modifier): void {
		// Check if this is a stackable modifier and if we already have one with the same ID
		const existingModifier = this.modifiers.find((m) => m.id === modifier.id);
		if (existingModifier && modifier.id.startsWith('burn_')) {
			// Stack burn modifiers
			existingModifier.stacks += modifier.stacks;
		} else {
			// Add new modifier
			this.modifiers = [...this.modifiers, modifier];
		}
	}

	// Remove a modifier by id
	removeModifier(modifierId: string): void {
		this.modifiers = this.modifiers.filter((m: Modifier) => m.id !== modifierId);
	}

	// Get effective stats (base stats + permanent modifiers)
	// Note: This calculates stats with permanent modifiers applied
	// For actual stat mutations, permanent modifiers should be applied when the character is created/updated
	getEffectiveStats(): Stats {
		// For now, just return current stats
		// Permanent modifiers will mutate stats directly when applied
		return { ...this.stats };
	}

	// Process modifiers for a given context - modifiers mutate the character directly
	processModifiers(context: AbilityContext): void {
		for (const modifier of this.modifiers) {
			if (modifier.shouldTrigger(context)) {
				// Apply modifier effect - it mutates this character directly
				modifier.apply(context, this);
			}
		}
	}

	// Process modifiers on a new modifier - allows existing modifiers to modify new modifiers
	processModifiersOnModifier(newModifier: Modifier, context: AbilityContext): Modifier {
		let modifiedModifier = newModifier;

		// Allow existing modifiers with 'on_modifier_added' trigger to modify the new modifier
		for (const existingModifier of this.modifiers) {
			if (existingModifier.shouldTriggerOnModifierAdded()) {
				// Pass the modifier being modified as the "character" parameter
				// The effect function can mutate the modifier's properties
				existingModifier.apply(context, modifiedModifier as any);
			}
		}

		return modifiedModifier;
	}

	// Take damage
	takeDamage(amount: number, source: string = ''): void {
		const damageContext: AbilityContext = {
			type: CT.DAMAGE,
			target: this.id,
			damage: amount,
			source: source
		};

		// Process modifiers that trigger on damage - they mutate the character
		// The modifiers can modify the damage amount by changing the context's damage value
		// or by directly modifying stats
		this.processModifiers(damageContext);

		// After modifiers are processed, apply the damage from the context
		// (modifiers may have modified the context or stats directly)
		const finalDamage = damageContext.type === CT.DAMAGE ? damageContext.damage : amount;
		this.stats.health = Math.max(0, this.stats.health - finalDamage);
	}

	// Heal
	heal(amount: number): void {
		const healContext: AbilityContext = {
			type: CT.HEAL,
			target: this.id,
			amount: amount
		};

		// Process modifiers that trigger on heal - they mutate the character
		this.processModifiers(healContext);

		// After modifiers are processed, apply the heal from the context
		const finalHeal = healContext.type === CT.HEAL ? healContext.amount : amount;
		this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + finalHeal);
	}

	// Use an ability - returns modifiers
	useAbility(abilityId: string, context: AbilityContext): Modifier | Modifier[] {
		const ability = this.abilities.find((a) => a.id === abilityId);
		if (!ability) {
			throw new Error(`Ability ${abilityId} not found`);
		}

		return ability.use(context);
	}

	// Tick cooldowns (called at end of turn)
	tickCooldowns(): void {
		for (const ability of this.abilities) {
			ability.tickCooldown();
		}
	}

	// Check if character is alive
	isAlive(): boolean {
		return this.stats.health > 0;
	}
}
