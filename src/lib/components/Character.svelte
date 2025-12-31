<script lang="ts">
	import type { Stats } from '$lib/gameLogic/types.js';
	import { GameEngine } from '$lib/gameLogic/GameEngine.svelte.js';
	import { getHatDefinition } from '$lib/gameLogic/hatDefinitions.js';
	import { AnimationEngine } from '$lib/gameLogic/animations/AnimationEngine.js';
	import type { AttackDirection } from '$lib/gameLogic/animations/AnimationEngine.js';
	import { HeartIcon, SwordIcon } from './icons/index.js';

	interface Props {
		stats: Stats;
		imageUrl: string;
		characterId?: string;
		isAttacking?: boolean;
		isBeingAttacked?: boolean;
		attackDirection?: AttackDirection;
		level?: number;
		hatId?: number | null;
		hatX?: number;
		hatY?: number;
	}

	let {
		stats,
		imageUrl,
		characterId,
		isAttacking = false,
		isBeingAttacked = false,
		attackDirection = 'down',
		level = 1,
		hatId = null,
		hatX = 48,
		hatY = 32
	}: Props = $props();

	const gameEngine = GameEngine.getInstance();
	const hatFilepath = $derived(() => gameEngine.getHatFilepath(hatId));
	const hatTooltip = $derived(() => {
		if (!hatId) return '';
		const def = getHatDefinition(hatId);
		if (!def) return '';
		return `${def.modifier.name}: ${def.description}`;
	});

	const HAT_SIZE_PX = 32;

	const animationEngine = AnimationEngine.getInstance();
	const animation = $derived(animationEngine.getAnimation(characterId));

	// Track animation progress for image changes
	let animationProgress = $state(0);
	let animationFrameId: number | null = null;

	// Update animation progress when attacking
	$effect(() => {
		if (isAttacking) {
			animationProgress = 0;
			const startTime = performance.now();
			const duration = 1500; // Match animation duration

			const updateProgress = (currentTime: number) => {
				const elapsed = currentTime - startTime;
				animationProgress = Math.min(100, (elapsed / duration) * 100);

				if (animationProgress < 100) {
					animationFrameId = requestAnimationFrame(updateProgress);
				} else {
					animationProgress = 0;
					animationFrameId = null;
				}
			};

			animationFrameId = requestAnimationFrame(updateProgress);

			return () => {
				if (animationFrameId !== null) {
					cancelAnimationFrame(animationFrameId);
				}
			};
		} else {
			animationProgress = 0;
		}
	});

	// Get current image based on animation progress
	const currentImage = $derived(() => {
		if (isAttacking && animation?.getImageAtKeyframe) {
			const imageUrl = animation.getImageAtKeyframe(animationProgress);
			if (imageUrl) {
				return imageUrl;
			}
		}
		return imageUrl; // Default image
	});
</script>

<div
	class="relative inline-block rounded-lg border-2 border-gray-600"
	class:attacking={isAttacking}
	style="--attack-transform: {animation.getTransform(attackDirection)}; transform-origin: center;"
	title={hatTooltip()}
>
	<!-- Character Image Container -->
	<div class="relative pt-8">
		<img
			src={currentImage()}
			alt="Character"
			class="pixel-art-character block h-32 w-32 rounded-lg object-cover"
		/>
		<!-- Hat Display - Absolute pixel positioning -->
		{#if hatId && hatFilepath()}
			<div
				class="absolute drop-shadow-lg"
				style="left: {hatX}px; top: {hatY - HAT_SIZE_PX}px; z-index: 10; pointer-events: none;"
			>
				<img
					src={hatFilepath()!}
					alt="Hat"
					class="pixel-art-character h-8 w-8"
					style="image-rendering: pixelated; image-rendering: crisp-edges; display: block;"
				/>
			</div>
		{/if}
	</div>

	<!-- Level Indicator (Circle) - Top Left -->
	<!-- {#if level > 0}
		<div
			class="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-purple-600 shadow-lg"
		>
			<span class="text-sm font-bold text-white">{level}</span>
		</div>
	{/if} -->

	<!-- Health and Attack Overlays (Bottom) -->
	<div class="absolute -bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
		<!-- Health Overlay (Heart) -->
		<div class="bg-opacity-70 flex items-center gap-1 rounded-full bg-black px-2 py-1">
			<HeartIcon />
			<span class="text-xs font-semibold text-white">{stats.health}/{stats.maxHealth}</span>
		</div>

		<!-- Attack Overlay (Sword) -->
		<div class="bg-opacity-70 flex items-center gap-1 rounded-full bg-black px-2 py-1">
			<SwordIcon />
			<span class="text-xs font-semibold text-white">{stats.attack}</span>
		</div>
	</div>
</div>
