import type { Character } from './characters/Character.svelte.js';
import type { AbilityContext, ContextType } from './types.js';
import { ContextType as CT } from './types.js';

export type GamePhase = 'round-start' | 'action' | 'round-end';

type HatData = {
	hatId: number;
	filepath: string;
	[id: string]: unknown;
};

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

	// Hats cache - loaded once from database
	private hatsCache = $state<Map<number, HatData>>(new Map());
	private hatsLoaded = $state<boolean>(false);

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

	// Load all hats from database (called once on app startup)
	public async loadHats(): Promise<void> {
		if (this.hatsLoaded) {
			return; // Already loaded
		}

		try {
			const response = await fetch('/api/hats');
			if (!response.ok) {
				throw new Error('Failed to load hats');
			}
			const hats = await response.json();
			
			// Build cache map: hatId -> { hatId, filepath, ... }
			for (const hat of hats) {
				const effect = hat.effect as { hatId?: number; filepath?: string };
				if (effect.hatId && effect.filepath) {
					this.hatsCache.set(effect.hatId, {
						hatId: effect.hatId,
						filepath: effect.filepath,
						...hat
					});
				}
			}
			
			this.hatsLoaded = true;
			console.log(`Loaded ${this.hatsCache.size} hats into cache`);
		} catch (error) {
			console.error('Error loading hats:', error);
			// Don't throw - allow game to continue without hats
		}
	}

	// Get hat filepath by hatId
	public getHatFilepath(hatId: number | null | undefined): string | null {
		if (!hatId) return null;
		const hat = this.hatsCache.get(hatId);
		return hat?.filepath || null;
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

		// Heroes attack the enemy
		if (this.enemy && this.enemy.isAlive()) {
			// Trigger attack animation
			this.currentAttack = {
				attackerId: hero.id,
				targetId: this.enemy.id
			};
			// Clear animation after animation completes
			setTimeout(() => {
				this.currentAttack = null;
			}, 1500);

			// Create initial attack context with base damage
			const attackContext: AbilityContext = {
				type: CT.ATTACK,
				target: this.enemy.id,
				damage: hero.getEffectiveStats().attack
			};

			// Process ATTACK modifiers on the attacker (can modify attack context damage)
			hero.processModifiers(attackContext);

			// Apply damage to target (takeDamage will process DAMAGE modifiers)
			this.enemy.takeDamage(attackContext.damage, hero.id);
		}

		// Move to next hero
		this.currentHeroIndex++;
	}

	// Process boss action
	private processBossAction(): void {
		if (!this.enemy || !this.enemy.isAlive()) {
			return;
		}

		// Find first alive hero as target
		const targetHero = this.heroes.find((h) => h.isAlive());

		if (targetHero) {
			// Trigger attack animation
			this.currentAttack = {
				attackerId: this.enemy.id,
				targetId: targetHero.id
			};
			// Clear animation after animation completes
			setTimeout(() => {
				this.currentAttack = null;
			}, 1500);

			// Create initial attack context with base damage
			const attackContext: AbilityContext = {
				type: CT.ATTACK,
				target: targetHero.id,
				damage: this.enemy.getEffectiveStats().attack
			};

			// Process ATTACK modifiers on the boss (can modify attack context damage)
			this.enemy.processModifiers(attackContext);

			// Apply damage to target (takeDamage will process DAMAGE modifiers)
			targetHero.takeDamage(attackContext.damage, this.enemy.id);
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
		}

		// Check win/lose conditions
		if (this.enemy && !this.enemy.isAlive()) {
			// Enemy defeated - could trigger win state
		}

		if (this.heroes.every((h) => !h.isAlive())) {
			// All heroes dead - could trigger lose state
		}
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
