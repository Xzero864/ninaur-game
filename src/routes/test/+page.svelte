<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { onMount } from 'svelte';
	import Character from '$lib/components/Character.svelte';
	import type { Stats } from '$lib/gameLogic/types.js';
	import { GameEngine } from '$lib/gameLogic/GameEngine.svelte.js';

	type CharacterTypeRow = {
		id: number;
		name: string;
		imageUrl: string | null;
		baseStats: Stats;
		hatX: number;
		hatY: number;
	};

	const characterTypesQuery = createQuery(() => ({
		queryKey: ['character-types'],
		queryFn: async (): Promise<CharacterTypeRow[]> => {
			const res = await fetch('/api/character-types');
			if (!res.ok) throw new Error('Failed to fetch character types');
			return res.json();
		}
	}));

	let ready = $state(false);
	let readyError = $state<string | null>(null);

	// Per-character overrides for tuning (not persisted)
	let overrides = $state<Record<number, { hatX: number; hatY: number }>>({});

	function getHatX(ct: CharacterTypeRow): number {
		return overrides[ct.id]?.hatX ?? ct.hatX;
	}

	function getHatY(ct: CharacterTypeRow): number {
		return overrides[ct.id]?.hatY ?? ct.hatY;
	}

	function setHatX(ctId: number, value: number) {
		overrides = {
			...overrides,
			[ctId]: { hatX: value, hatY: overrides[ctId]?.hatY ?? 0 }
		};
	}

	function setHatY(ctId: number, value: number) {
		overrides = {
			...overrides,
			[ctId]: { hatX: overrides[ctId]?.hatX ?? 0, hatY: value }
		};
	}

	function resetOverrides() {
		overrides = {};
	}

	function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	onMount(async () => {
		const engine = GameEngine.getInstance();

		for (let attempt = 0; attempt < 10; attempt++) {
			// Force reload hats so the cache is correct even if this page loaded early.
			await engine.loadHats(true);

			// Refresh character types list.
			await characterTypesQuery.refetch();

			// Top Hat is hatId=2
			if (engine.getHatFilepath(2)) {
				ready = true;
				readyError = null;
				return;
			}

			await sleep(250);
		}

		ready = false;
		readyError = "Hats aren't available yet (Top Hat not found). Try refreshing in a moment.";
	});
</script>

<div class="min-h-screen bg-gray-900 p-6 text-white">
	<div class="mx-auto max-w-6xl">
		<div class="mb-6 flex items-center justify-between gap-4">
			<div>
				<h1 class="text-2xl font-bold">Hat Position Test</h1>
				<p class="text-sm text-gray-300">
					All characters are shown with the <span class="font-semibold text-purple-300"
						>Top Hat</span
					>
					(hatId=2). Adjust <span class="font-semibold">hatX/hatY</span> live to tune placement
					(hatY is the <span class="font-semibold">bottom</span> of the 32px hat).
				</p>
			</div>
			<button
				type="button"
				class="rounded-lg bg-gray-700 px-4 py-2 font-semibold hover:bg-gray-600"
				onclick={resetOverrides}
			>
				Reset overrides
			</button>
		</div>

		{#if !ready}
			<div class="rounded-lg bg-gray-800 p-6">
				<div class="font-semibold">Preparing test data…</div>
				<div class="mt-1 text-sm text-gray-300">Seeding + loading hats (retrying if needed).</div>
				{#if readyError}
					<div class="mt-3 text-sm text-red-300">{readyError}</div>
				{/if}
			</div>
		{:else if characterTypesQuery.isLoading}
			<div class="rounded-lg bg-gray-800 p-6">Loading character types…</div>
		{:else if characterTypesQuery.isError}
			<div class="rounded-lg bg-red-900/30 p-6 text-red-200">
				Failed to load character types: {characterTypesQuery.error?.message || 'Unknown error'}
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each characterTypesQuery.data ?? [] as ct (ct.id)}
					<div class="rounded-lg bg-gray-800 p-4">
						<div class="mb-3 flex items-center justify-between gap-3">
							<div class="font-semibold">{ct.name}</div>
							<div class="text-xs text-gray-300">id: {ct.id}</div>
						</div>

						<div class="mb-4 flex items-center justify-center">
							<Character
								stats={{
									health: ct.baseStats.maxHealth,
									maxHealth: ct.baseStats.maxHealth,
									attack: ct.baseStats.attack
								}}
								imageUrl={ct.imageUrl || '/characters/cat.png'}
								hatId={2}
								hatX={getHatX(ct)}
								hatY={getHatY(ct)}
								level={0}
							/>
						</div>

						<div class="grid grid-cols-2 gap-3">
							<label class="flex flex-col gap-1 text-sm">
								<span class="text-gray-300">hatX</span>
								<input
									type="number"
									class="rounded bg-gray-900 px-3 py-2 text-white"
									value={getHatX(ct)}
									oninput={(e) => setHatX(ct.id, Number((e.target as HTMLInputElement).value))}
								/>
							</label>

							<label class="flex flex-col gap-1 text-sm">
								<span class="text-gray-300">hatY</span>
								<input
									type="number"
									class="rounded bg-gray-900 px-3 py-2 text-white"
									value={getHatY(ct)}
									oninput={(e) => setHatY(ct.id, Number((e.target as HTMLInputElement).value))}
								/>
							</label>
						</div>

						<div class="mt-3 text-xs text-gray-300">
							Current: <span class="font-mono">hatX: {getHatX(ct)}, hatY: {getHatY(ct)}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
