<script lang="ts">
	interface Props {
		abilityName: string;
		characterName: string;
	}

	let { abilityName, characterName }: Props = $props();
</script>

<div
	class="ability-display fixed left-1/2 top-1/4 z-50 -translate-x-1/2 -translate-y-1/2"
	role="status"
	aria-live="polite"
>
	<div class="ability-text-container relative">
		<div class="ability-text text-center">
			<div class="character-name mb-1 text-sm font-semibold text-purple-300">{characterName}</div>
			<div class="ability-name text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
				{abilityName}
			</div>
		</div>
	</div>
</div>

<style>
	.ability-display {
		pointer-events: none;
		animation: abilityAppear 0.3s ease-out, abilityFade 0.3s ease-in 1.7s forwards;
	}

	.ability-text-container {
		animation: abilityPulse 0.5s ease-in-out 0.3s;
	}

	.ability-name {
		animation: abilityGlow 1.5s ease-in-out infinite;
		text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(147, 51, 234, 0.6);
	}

	@keyframes abilityAppear {
		from {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.5) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1) translateY(0);
		}
	}

	@keyframes abilityFade {
		from {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1) translateY(0);
		}
		to {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.8) translateY(-10px);
		}
	}

	@keyframes abilityPulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}

	@keyframes abilityGlow {
		0%,
		100% {
			text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(147, 51, 234, 0.6);
		}
		50% {
			text-shadow: 0 0 30px rgba(255, 255, 255, 1), 0 0 60px rgba(147, 51, 234, 0.8),
				0 0 80px rgba(147, 51, 234, 0.4);
		}
	}
</style>

