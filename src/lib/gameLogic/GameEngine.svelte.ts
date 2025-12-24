import type { Character } from './characters/Character.svelte.js';
import type { AbilityContext, ContextType } from './types.js';
import { ContextType as CT } from './types.js';
import { Modifier } from './abilities/Modifier.js';
import { populateContext } from './populateContext.js';

export type GamePhase = 'round-start' | 'action' | 'round-end';

export class GameEngine {
	// Singleton instance
	private static instance: GameEngine | null = null;

	// Game phase state
	public phase = $state<GamePhase>('round-start');

	// Hero characters (5 length)
	public heroes = $state<Character[]>([]);

	// Enemy character
	public enemy = $state<Character | null>(null);

	// Current character index for action phase
	private currentHeroIndex = $state<number>(0);

	// Attack animation state: { attackerId: string, targetId: string } | null
	public currentAttack = $state<{ attackerId: string; targetId: string } | null>(null);

	// Track current ability being used (for display)
	public currentAbilityDisplay = $state<{ name: string; characterName: string } | null>(null);

	private constructor() {
		// Initialize with empty state
	}

	// Get singleton instance
	public static getInstance(): GameEngine {
		if (!GameEngine.instance) {
			GameEngine.instance = new GameEngine();
		}
		return GameEngine.instance;
	}

	// Initialize the game with heroes and enemy
	initialize(heroes: Character[], enemy: Character): void {
		if (heroes.length > 5) {
			throw new Error('Must have 5 maximum hero characters');
		}
		this.heroes = heroes;
		this.enemy = enemy;
		this.phase = 'round-start';
		this.currentHeroIndex = 0;
	}

	// Start a new round
	startRound(): void {
		this.phase = 'round-start';

		// Process round-start modifiers for all characters
		const allCharacters = [...this.heroes, this.enemy].filter((c): c is Character => c !== null);

		for (const character of allCharacters) {
			const turnStartContext: AbilityContext = {
				type: CT.TURN_START,
				characterId: character.id
			};
			character.processModifiers(turnStartContext);
		}

		// Move to action phase
		this.phase = 'action';
		this.currentHeroIndex = 0;
		this.bossActed = false;
	}

	// Track if boss has acted this round
	private bossActed = $state<boolean>(false);

	// Process the next action (hero or boss)
	processNextAction(): void {
		if (this.phase !== 'action') {
			return;
		}

		// Check if all heroes have acted
		if (this.currentHeroIndex >= this.heroes.length) {
			// All heroes have acted, now boss acts
			if (!this.bossActed && this.enemy && this.enemy.isAlive()) {
				this.processBossAction();
				this.bossActed = true;
			} else {
				// Boss has acted or is dead, end round
				this.endRound();
			}
			return;
		}

		const hero = this.heroes[this.currentHeroIndex];
		if (!hero.isAlive()) {
			// Skip dead heroes
			this.currentHeroIndex++;
			this.processNextAction();
			return;
		}

		// Find the ability with the highest cooldown that's ready
		const availableAbilities = hero.abilities.filter((a) => a.isReady());
		if (availableAbilities.length === 0) {
			// No abilities ready, skip this hero
			this.currentHeroIndex++;
			this.processNextAction();
			return;
		}

		// Sort by cooldown (highest first) and pick the first one
		const abilityToUse = availableAbilities.sort((a, b) => {
			const aCooldown = a.cooldown ?? 0;
			const bCooldown = b.cooldown ?? 0;
			return bCooldown - aCooldown;
		})[0];

		// Create initial context for the ability using populateContext
		// Heroes attack the enemy (boss)
		const initialContext = populateContext(abilityToUse, hero, this.enemy, this.heroes, this.enemy);

		// Trigger attack animation if this is an attack ability
		if (initialContext.type === CT.ATTACK && this.enemy) {
			this.currentAttack = {
				attackerId: hero.id,
				targetId: this.enemy.id
			};
			// Clear animation after a short delay
			setTimeout(() => {
				this.currentAttack = null;
			}, 600);
		}

		// Track ability usage for display (only if it has a cooldown)
		if (abilityToUse.cooldown && abilityToUse.cooldown > 0) {
			this.currentAbilityDisplay = {
				name: abilityToUse.name,
				characterName: hero.name
			};
			// Clear after animation duration
			setTimeout(() => {
				this.currentAbilityDisplay = null;
			}, 2000);
		}

		// Use the ability - it returns one or more modifiers
		const modifiers = hero.useAbility(abilityToUse.id, initialContext);
		const modifierArray = Array.isArray(modifiers) ? modifiers : [modifiers];

		// Apply each modifier to the appropriate target
		for (const modifier of modifierArray) {
			this.applyModifier(modifier, initialContext, hero);
		}

		// Move to next hero
		this.currentHeroIndex++;
	}

	// Process boss action
	private processBossAction(): void {
		if (!this.enemy || !this.enemy.isAlive()) {
			return;
		}

		// Find the ability with the highest cooldown that's ready
		const availableAbilities = this.enemy.abilities.filter((a) => a.isReady());
		if (availableAbilities.length === 0) {
			// No abilities ready, boss skips
			return;
		}

		// Sort by cooldown (highest first) and pick the first one
		const abilityToUse = availableAbilities.sort((a, b) => {
			const aCooldown = a.cooldown ?? 0;
			const bCooldown = b.cooldown ?? 0;
			return bCooldown - aCooldown;
		})[0];

		// Find first alive hero as target
		const targetHero = this.heroes.find((h) => h.isAlive());

		// Create initial context for the ability using populateContext
		// Boss attacks heroes
		const initialContext = populateContext(
			abilityToUse,
			this.enemy,
			targetHero || null,
			this.heroes,
			this.enemy
		);

		// Trigger attack animation if this is an attack ability
		if (initialContext.type === CT.ATTACK && targetHero) {
			this.currentAttack = {
				attackerId: this.enemy.id,
				targetId: targetHero.id
			};
			// Clear animation after a short delay
			setTimeout(() => {
				this.currentAttack = null;
			}, 600);
		}

		// Track ability usage for display (only if it has a cooldown)
		if (abilityToUse.cooldown && abilityToUse.cooldown > 0) {
			this.currentAbilityDisplay = {
				name: abilityToUse.name,
				characterName: this.enemy.name
			};
			// Clear after animation duration
			setTimeout(() => {
				this.currentAbilityDisplay = null;
			}, 2000);
		}

		// Use the ability - it returns one or more modifiers
		const modifiers = this.enemy.useAbility(abilityToUse.id, initialContext);
		const modifierArray = Array.isArray(modifiers) ? modifiers : [modifiers];

		// Apply each modifier to the appropriate target
		for (const modifier of modifierArray) {
			this.applyModifier(modifier, initialContext, this.enemy);
		}
	}

	// Apply a modifier to the appropriate target character
	private applyModifier(
		modifier: Modifier,
		context: AbilityContext,
		sourceCharacter: Character
	): void {
		// Determine target based on context type and source
		const isBossAction = sourceCharacter === this.enemy;

		if (context.type === CT.HEAL || context.type === CT.BUFF) {
			// Heals and buffs: if from hero, apply to hero; if from boss, apply to boss
			if (isBossAction) {
				// Boss healing/buffing itself
				if (this.enemy) {
					const modifiedModifier = this.enemy.processModifiersOnModifier(modifier, context);
					if (modifiedModifier.modifierType === 'one_time') {
						modifiedModifier.apply(context, this.enemy);
					} else {
						this.enemy.addModifier(modifiedModifier);
					}
				}
			} else {
				// Hero healing/buffing heroes
				const targetHero =
					this.heroes.find((h) => h.id === context.target) ?? this.heroes.find((h) => h.isAlive());
				if (targetHero) {
					const modifiedModifier = targetHero.processModifiersOnModifier(modifier, context);
					if (modifiedModifier.modifierType === 'one_time') {
						modifiedModifier.apply(context, targetHero);
					} else {
						targetHero.addModifier(modifiedModifier);
					}
				}
			}
		} else if (
			context.type === CT.DAMAGE ||
			context.type === CT.DEBUFF ||
			context.type === CT.ATTACK
		) {
			// Damage/debuffs/attacks: if from hero, apply to enemy; if from boss, apply to heroes
			if (isBossAction) {
				// Boss attacking heroes - find target hero
				const targetHero =
					this.heroes.find((h) => h.id === context.target) ?? this.heroes.find((h) => h.isAlive());
				if (targetHero) {
					const modifiedModifier = targetHero.processModifiersOnModifier(modifier, context);
					if (modifiedModifier.modifierType === 'one_time') {
						modifiedModifier.apply(context, targetHero);
					} else {
						targetHero.addModifier(modifiedModifier);
					}
				}
			} else {
				// Hero attacking enemy
				if (this.enemy) {
					const modifiedModifier = this.enemy.processModifiersOnModifier(modifier, context);
					if (modifiedModifier.modifierType === 'one_time') {
						modifiedModifier.apply(context, this.enemy);
					} else {
						this.enemy.addModifier(modifiedModifier);
					}
				}
			}
		}
	}

	// End the round
	endRound(): void {
		this.phase = 'round-end';

		// Process round-end modifiers for all characters
		const allCharacters = [...this.heroes, this.enemy].filter((c): c is Character => c !== null);

		for (const character of allCharacters) {
			const turnEndContext: AbilityContext = {
				type: CT.TURN_END,
				characterId: character.id
			};
			character.processModifiers(turnEndContext);

			// Process burn modifiers - deal damage and reduce stacks
			const burnModifiers = character.modifiers.filter((m) => m.id.startsWith('burn_'));
			for (const burnModifier of burnModifiers) {
				// Deal 1 damage per stack
				if (burnModifier.stacks > 0) {
					character.takeDamage(burnModifier.stacks, 'burn');
					// Reduce stacks by 1
					burnModifier.stacks--;
					// Remove modifier if stacks reach 0
					if (burnModifier.stacks <= 0) {
						character.removeModifier(burnModifier.id);
					}
				}
			}

			// Tick cooldowns
			character.tickCooldowns();
		}

		// Check win/lose conditions
		if (this.enemy && !this.enemy.isAlive()) {
			// Enemy defeated - could trigger win state
		}

		if (this.heroes.every((h) => !h.isAlive())) {
			// All heroes dead - could trigger lose state
		}
	}

	// Get current active hero (for UI)
	getCurrentHero(): Character | null {
		if (this.phase !== 'action' || this.currentHeroIndex >= this.heroes.length) {
			return null;
		}
		return this.heroes[this.currentHeroIndex] ?? null;
	}

	// Check if game is over
	isGameOver(): boolean {
		if (!this.enemy) return false;
		return !this.enemy.isAlive() || this.heroes.every((h) => !h.isAlive());
	}

	// Check if player won (enemy is dead)
	isVictory(): boolean {
		if (!this.enemy) return false;
		return !this.enemy.isAlive() && this.heroes.some((h) => h.isAlive());
	}

	// Get character by ID (searches both heroes and enemy)
	getCharacterById(characterId: string): Character | null {
		// Check heroes first
		const hero = this.heroes.find((h) => h.id === characterId);
		if (hero) {
			return hero;
		}

		// Check enemy
		if (this.enemy && this.enemy.id === characterId) {
			return this.enemy;
		}

		return null;
	}
}
