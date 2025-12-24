<script lang="ts">
	import type { Stats } from '$lib/gameLogic/types.js';
	import type { Ability } from '$lib/gameLogic/abilities/Ability.js';
	import { AnimationEngine } from '$lib/gameLogic/animations/AnimationEngine.js';
	import type { AttackDirection } from '$lib/gameLogic/animations/AnimationEngine.js';

	interface Props {
		stats: Stats;
		imageUrl: string;
		abilities: Ability[];
		characterId?: string;
		isAttacking?: boolean;
		isBeingAttacked?: boolean;
		attackDirection?: AttackDirection;
		level?: number;
	}

	let {
		stats,
		imageUrl,
		abilities,
		characterId,
		isAttacking = false,
		isBeingAttacked = false,
		attackDirection = 'down',
		level = 1
	}: Props = $props();

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
			const duration = 600; // Match animation duration

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
	class="relative inline-block"
	class:attacking={isAttacking}
	style="--attack-transform: {animation.getTransform(attackDirection)}; transform-origin: center;"
>
	<!-- Character Image -->
	<img src={currentImage()} alt="Character" class="h-32 w-32 rounded-lg object-cover" />

	<!-- Health Overlay (Heart) -->
	<div
		class="bg-opacity-70 absolute -top-2 -left-2 flex items-center gap-1 rounded-full bg-black px-2 py-1"
	>
		<svg
			class="h-4 w-4 fill-red-500 text-red-500"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
			/>
		</svg>
		<span class="text-xs font-semibold text-white">{stats.health}/{stats.maxHealth}</span>
	</div>

	<!-- Attack Overlay (Sword) -->
	<div
		class="bg-opacity-70 absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-black px-2 py-1"
	>
		<svg class="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
			<!-- Sword blade (pointed upward) -->
			<path d="M12 2L13 10L11 10L12 2Z" />
			<!-- Sword crossguard -->
			<path d="M8 10L16 10L15.5 11L8.5 11L8 10Z" />
			<!-- Sword handle -->
			<path d="M11.5 11L11.5 19L12.5 19L12.5 11L11.5 11Z" />
			<!-- Sword pommel -->
			<path d="M10.5 19L13.5 19L13 20L11 20L10.5 19Z" />
		</svg>
		<span class="text-xs font-semibold text-white">{stats.attack}</span>
	</div>

	<!-- Level Indicator (Stacked Arrows) -->
	{#if level > 0}
		<div class="absolute -bottom-2 left-1/2 flex -translate-x-1/2 flex-col items-center gap-0.5">
			{#each Array(level) as _, i}
				{@const arrowColor = level === 1 ? 'text-[#cd7f32]' : 'text-[#ffd700]'}
				<div class="{arrowColor} text-lg leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
					▲
				</div>
			{/each}
		</div>
	{/if}
</div>
