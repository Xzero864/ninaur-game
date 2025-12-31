<script lang="ts">
	import Character from './Character.svelte';
	import Boss from './Boss.svelte';
	import AnimationStyles from './AnimationStyles.svelte';
	import type { Stats } from '$lib/gameLogic/types.js';
	import type { GameEngine } from '$lib/gameLogic/GameEngine.svelte.js';
	import grassyBg from '$lib/assets/grassy.png';
	import snowyBg from '$lib/assets/snowy.png';
	import castleBg from '$lib/assets/castle.png';
	import spaceBg from '$lib/assets/space.png';

	type CharacterWithType = {
		id: number;
		type: 'hero' | 'enemy';
		characterTypeId: number;
		level?: number;
		hatId?: number | null;
		stats: Stats;
		characterType: {
			id: number;
			name: string;
			imageUrl: string | null;
			baseStats: Stats;
			hatX: number;
			hatY: number;
		};
	};

	interface Props {
		gameName: string;
		heroes: CharacterWithType[];
		boss?: CharacterWithType;
		gameEngine?: GameEngine;
		bossLevel?: number;
	}

	let { gameName, heroes, boss, gameEngine, bossLevel = 1 }: Props = $props();

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

	// Check if a hero is alive
	function isHeroAlive(heroId: number): boolean {
		if (gameEngine) {
			const gameHero = gameEngine.heroes.find((h) => h.id === heroId.toString());
			if (gameHero) {
				return gameHero.isAlive();
			}
		}
		// Fallback to database stats
		const heroStats = getHeroStats(heroId);
		return heroStats.health > 0;
	}

	// Get background image based on boss level
	function getBackgroundImage(): string {
		if (bossLevel <= 2) {
			return grassyBg;
		} else if (bossLevel <= 5) {
			return snowyBg;
		} else if (bossLevel <= 8) {
			return castleBg;
		} else {
			return spaceBg;
		}
	}
</script>

<AnimationStyles />

<div
	class="pixel-art-bg relative flex h-screen flex-col overflow-hidden"
	style="background-image: url('{getBackgroundImage()}');"
>
	<!-- Game Name Header - Fixed Overlay at Top -->
	<div
		class="absolute top-0 right-0 left-0 z-10 w-full bg-black/50 p-4 text-center backdrop-blur-sm"
	>
		<h1 class="text-2xl font-bold text-white drop-shadow-lg sm:text-4xl">{gameName}</h1>
	</div>

	<!-- Game Scene Container -->
	<div class="flex h-full items-center justify-center p-8 pt-20">
		<div class="flex w-full max-w-6xl items-center justify-center gap-16">
			<!-- Heroes Section - Left Side (Horizontal Row, Reversed Order) -->
			<div class="flex items-center justify-center gap-4">
				{#each heroes.slice(0, 5).reverse() as hero}
					{@const alive = isHeroAlive(hero.id)}
					<div
						class="character-container transform transition-transform hover:scale-105"
						class:opacity-50={!alive}
						class:grayscale={!alive}
					>
						<Character
							stats={getHeroStats(hero.id)}
							imageUrl={hero.characterType.imageUrl || '/characters/cat.png'}
							characterId={hero.id.toString()}
							isAttacking={gameEngine?.currentAttack?.attackerId === hero.id.toString()}
							isBeingAttacked={gameEngine?.currentAttack?.targetId === hero.id.toString()}
							attackDirection="right"
							level={hero.level || 1}
							hatId={hero.hatId}
							hatX={hero.characterType.hatX}
							hatY={hero.characterType.hatY}
						/>
					</div>
				{/each}
			</div>

			<!-- Enemy Section (Boss) - Right Side -->
			<div class="flex items-center justify-center">
				{#if boss}
					{@const bossStats = getBossStats()}
					{#if bossStats}
						<Boss bossId={boss.id} {bossLevel} {bossStats} {gameEngine} />
					{/if}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.pixel-art-bg {
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
		-ms-interpolation-mode: nearest-neighbor;
	}

	.character-container {
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));
		transform: translateZ(0); /* Force hardware acceleration */
	}
</style>
