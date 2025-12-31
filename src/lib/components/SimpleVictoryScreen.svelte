<script lang="ts">
	import { GameEngine } from '$lib/gameLogic';
	import { onMount } from 'svelte';

	interface Props {
		bossLevel: number;
	}

	let { bossLevel }: Props = $props();
</script>

<div
	class="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="simple-victory-title"
>
	<div class="text-center">
		<div class="mb-4 text-6xl">🎉🎊🎉🎊🎉</div>
		<h2 id="simple-victory-title" class="mb-4 text-5xl font-bold text-white">Congratulations!</h2>
		<p class="text-2xl text-gray-200">
			You beat level <span class="font-bold text-purple-400">{bossLevel}</span>
		</p>
		<p class="mt-3 text-2xl font-semibold text-green-300">Your characters got stronger!</p>
		<div class="mt-4 text-4xl">🎊🎉🎊🎉🎊</div>
	</div>
</div>
