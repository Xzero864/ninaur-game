<script lang="ts">
	import Character from './Character.svelte';
	import AnimationStyles from './AnimationStyles.svelte';
	import AbilityDisplay from './AbilityDisplay.svelte';
	import type { Stats } from '$lib/gameLogic/types.js';
	import type { Ability } from '$lib/gameLogic/abilities/Ability.js';
	import type { GameEngine } from '$lib/gameLogic/GameEngine.svelte.js';
	import { AnimationEngine } from '$lib/gameLogic/animations/AnimationEngine.js';
	import type { AttackDirection } from '$lib/gameLogic/animations/AnimationEngine.js';

	type CharacterWithType = {
		id: number;
		type: 'hero' | 'enemy';
		characterTypeId: number;
		level?: number;
		stats: Stats;
		characterType: {
			id: number;
			name: string;
			imageUrl: string | null;
			levelTwoAbilityId: string | null;
			levelThreeAbilityId: string | null;
			baseStats: Stats;
		};
	};

	interface Props {
		gameName: string;
		heroes: CharacterWithType[];
		boss?: CharacterWithType;
		gameEngine?: GameEngine;
	}

	let { gameName, heroes, boss, gameEngine }: Props = $props();

	// Create empty ability arrays for now (characters start with only basic_attack)
	const emptyAbilities: Ability[] = [];

	// Get reactive stats from game engine if available
	function getHeroStats(heroId: number): Stats {
		if (gameEngine) {
			const gameHero = gameEngine.heroes.find((h) => h.id === heroId.toString());
			if (gameHero) {
				return gameHero.stats;
			}
		}
		// Fallback to database stats
		const dbHero = heroes.find((h) => h.id === heroId);
		return dbHero?.stats || { health: 0, maxHealth: 0, attack: 0 };
	}

	function getBossStats(): Stats | undefined {
		if (gameEngine && gameEngine.enemy) {
			return gameEngine.enemy.stats;
		}
		return boss?.stats;
	}
</script>

<AnimationStyles />

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-900 via-purple-800 to-indigo-900 p-8"
>
	<!-- Game Name Header -->
	<div class="mb-8 text-center">
		<h1 class="text-4xl font-bold text-white drop-shadow-lg">{gameName}</h1>
	</div>

	<!-- Game Scene Container -->
	<div class="flex w-full max-w-6xl flex-col gap-8">
		<!-- Heroes Section -->
		<div class="flex flex-wrap items-center justify-center gap-6">
			{#each heroes.slice(0, 5) as hero}
				<div class="transform transition-transform hover:scale-105">
					<Character
						stats={getHeroStats(hero.id)}
						imageUrl={hero.characterType.imageUrl || '/characters/cat.png'}
						abilities={emptyAbilities}
						characterId={hero.id.toString()}
						isAttacking={gameEngine?.currentAttack?.attackerId === hero.id.toString()}
						isBeingAttacked={gameEngine?.currentAttack?.targetId === hero.id.toString()}
						attackDirection="down"
						level={hero.level || 1}
					/>
				</div>
			{/each}
			<!-- Fill empty slots with placeholder -->
			{#each Array(Math.max(0, 5 - heroes.length)) as _}
				<div
					class="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-purple-400 opacity-50"
				>
					<span class="text-sm text-purple-300">Empty</span>
				</div>
			{/each}
		</div>

		<!-- VS Divider -->
		<div class="flex items-center justify-center gap-4">
			<div
				class="h-px flex-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
			></div>
			<div class="rounded-full bg-purple-600 px-6 py-2 text-2xl font-bold text-white shadow-lg">
				VS
			</div>
			<div
				class="h-px flex-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
			></div>
		</div>

		<!-- Enemy Section (Boss as normal character) -->
		<div class="flex items-center justify-center">
			{#if boss}
				{@const bossStats = getBossStats()}
				{#if bossStats}
					<div class="transform transition-transform hover:scale-105">
						<Character
							stats={bossStats}
							imageUrl={boss.characterType.imageUrl || '/characters/cat.png'}
							abilities={emptyAbilities}
							characterId={boss.id.toString()}
							isAttacking={gameEngine?.currentAttack?.attackerId === boss.id.toString()}
							isBeingAttacked={gameEngine?.currentAttack?.targetId === boss.id.toString()}
							attackDirection="up"
							level={boss.level || 1}
						/>
					</div>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Ability Display -->
	{#if gameEngine?.currentAbilityDisplay}
		<AbilityDisplay
			abilityName={gameEngine.currentAbilityDisplay.name}
			characterName={gameEngine.currentAbilityDisplay.characterName}
		/>
	{/if}
</div>
