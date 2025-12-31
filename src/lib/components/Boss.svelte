<script lang="ts">
	import type { Stats } from '$lib/gameLogic/types.js';
	import type { GameEngine } from '$lib/gameLogic/GameEngine.svelte.js';
	import { AnimationEngine } from '$lib/gameLogic/animations/AnimationEngine.js';
	import { HeartIcon, SwordIcon } from './icons/index.js';

	interface Props {
		bossId: number;
		bossLevel: number;
		bossStats: Stats;
		gameEngine?: GameEngine;
	}

	let { bossId, bossLevel, bossStats, gameEngine }: Props = $props();

	const animationEngine = AnimationEngine.getInstance();
	const bossAnimation = $derived(animationEngine.getAnimation(bossId.toString()));

	// Get the left attack transform for boss - ALWAYS use left direction
	const bossLeftTransform = $derived(
		bossAnimation
			? bossAnimation.getTransform('left')
			: 'translate(-50px, 0) rotate(0deg) scale(1.1)'
	);

	const isBossAttacking = $derived(gameEngine?.currentAttack?.attackerId === bossId.toString());

	const bossImageUrl = '/characters/boss.png';
</script>

<div
	class="relative inline-block"
	class:attacking={isBossAttacking}
	style="--attack-transform: {bossLeftTransform}; transform-origin: center;"
>
	<div
		class="relative flex h-40 w-40 items-center justify-center rounded-lg bg-black shadow-lg transition-transform hover:scale-105"
		style="filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));"
	>
		<!-- Level Indicator (Circle) - Top Left -->
		<div
			class="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-600 shadow-lg"
		>
			<span class="text-sm font-bold text-white">{bossLevel}</span>
		</div>

		<!-- Boss Sprite -->
		<img
			src={bossImageUrl}
			alt="Boss"
			class="pixel-art-character h-32 w-32 rounded-lg object-cover"
			style="image-rendering: pixelated; image-rendering: crisp-edges;"
		/>

		<!-- Health and Attack Overlays (Bottom) -->
		<div class="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
			<!-- Health Overlay (Heart) -->
			<div class="bg-opacity-70 flex items-center gap-1 rounded-full bg-black px-2 py-1">
				<HeartIcon />
				<span class="text-xs font-semibold text-white"
					>{bossStats.health}/{bossStats.maxHealth}</span
				>
			</div>

			<!-- Attack Overlay (Sword) -->
			<div class="bg-opacity-70 flex items-center gap-1 rounded-full bg-black px-2 py-1">
				<SwordIcon />
				<span class="text-xs font-semibold text-white">{bossStats.attack}</span>
			</div>
		</div>
	</div>
</div>
