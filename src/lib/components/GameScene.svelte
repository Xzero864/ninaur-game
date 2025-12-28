<script lang="ts">
	import Character from './Character.svelte';
	import AnimationStyles from './AnimationStyles.svelte';
	import type { Stats } from '$lib/gameLogic/types.js';
	import type { GameEngine } from '$lib/gameLogic/GameEngine.svelte.js';
	import { AnimationEngine } from '$lib/gameLogic/animations/AnimationEngine.js';
	import type { AttackDirection } from '$lib/gameLogic/animations/AnimationEngine.js';
	import { HeartIcon, SwordIcon } from './icons/index.js';
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

	const animationEngine = AnimationEngine.getInstance();
	const bossAnimation = $derived(boss ? animationEngine.getAnimation(boss.id.toString()) : null);

	// Track animation progress for boss attack
	let bossAnimationProgress = $state(0);
	let bossAnimationFrameId: number | null = null;

	const isBossAttacking = $derived(
		gameEngine?.currentAttack?.attackerId === boss?.id.toString()
	);

	// Update animation progress when boss is attacking
	$effect(() => {
		if (isBossAttacking) {
			bossAnimationProgress = 0;
			const startTime = performance.now();
			const duration = 600; // Match animation duration

			const updateProgress = (currentTime: number) => {
				const elapsed = currentTime - startTime;
				bossAnimationProgress = Math.min(100, (elapsed / duration) * 100);

				if (bossAnimationProgress < 100) {
					bossAnimationFrameId = requestAnimationFrame(updateProgress);
				} else {
					bossAnimationProgress = 0;
					bossAnimationFrameId = null;
				}
			};

			bossAnimationFrameId = requestAnimationFrame(updateProgress);

			return () => {
				if (bossAnimationFrameId !== null) {
					cancelAnimationFrame(bossAnimationFrameId);
				}
			};
		} else {
			bossAnimationProgress = 0;
		}
	});

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
	class="flex min-h-screen flex-col items-center justify-center p-8"
	style="background-image: url('{getBackgroundImage()}'); background-size: cover; background-position: center; background-repeat: no-repeat;"
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
						characterId={hero.id.toString()}
						isAttacking={gameEngine?.currentAttack?.attackerId === hero.id.toString()}
						isBeingAttacked={gameEngine?.currentAttack?.targetId === hero.id.toString()}
						attackDirection="down"
						level={hero.level || 1}
						hatId={hero.hatId}
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

		<!-- Enemy Section (Boss with devil emoji) -->
		<div class="flex items-center justify-center">
			{#if boss}
				{@const bossStats = getBossStats()}
				{#if bossStats}
					<div
						class="relative inline-block"
						class:attacking={isBossAttacking}
						style="--attack-transform: {bossAnimation?.getTransform('up') || 'translate(0, -300px) rotate(-20deg) scale(1.3)'}; transform-origin: center;"
					>
						<div
							class="relative flex h-40 w-40 items-center justify-center rounded-lg bg-red-600 shadow-lg transition-transform hover:scale-105"
						>
							<!-- Level Indicator (Circle) - Top Left -->
							<div
								class="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 border-2 border-white shadow-lg"
							>
								<span class="text-sm font-bold text-white">{bossLevel}</span>
							</div>

							<!-- Devil Emoji -->
							<div class="text-6xl">😈</div>

							<!-- Health and Attack Overlays (Bottom) -->
							<div class="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
								<!-- Health Overlay (Heart) -->
								<div
									class="bg-opacity-70 flex items-center gap-1 rounded-full bg-black px-2 py-1"
								>
									<HeartIcon />
									<span class="text-xs font-semibold text-white"
										>{bossStats.health}/{bossStats.maxHealth}</span
									>
								</div>

								<!-- Attack Overlay (Sword) -->
								<div
									class="bg-opacity-70 flex items-center gap-1 rounded-full bg-black px-2 py-1"
								>
									<SwordIcon />
									<span class="text-xs font-semibold text-white">{bossStats.attack}</span>
								</div>
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>

</div>
