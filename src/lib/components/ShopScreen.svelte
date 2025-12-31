<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { getHatDefinition } from '$lib/gameLogic/hatDefinitions.js';
	import { getHatFilepath } from '$lib/gameLogic/hatUtils.js';
	import shopBg from '$lib/assets/shop-bg.png';

	type CharacterWithType = {
		id: number;
		type: 'hero' | 'enemy';
		characterTypeId: number;
		level?: number;
		hatId?: number | null;
		stats: {
			health: number;
			maxHealth: number;
			attack: number;
		};
		characterType: {
			id: number;
			name: string;
			imageUrl: string | null;
			baseStats: {
				health: number;
				maxHealth: number;
				attack: number;
			};
			hatX: number;
			hatY: number;
		};
	};

	type ShopItem =
		| {
				type: 'character';
				characterType: {
					id: number;
					name: string;
					imageUrl: string | null;
					baseStats: {
						health: number;
						maxHealth: number;
						attack: number;
					};
				};
				cost: number;
		  }
		| {
				type: 'hat';
				hat: {
					id: string;
					name: string;
					description: string;
					hatId: number;
					effect: {
						type: string;
						[key: string]: unknown;
					};
				};
				cost: number;
		  };

	interface Props {
		heroes: CharacterWithType[];
		gameId: number;
		onContinue: () => void;
		onHeroesUpdate?: (heroes: CharacterWithType[]) => void;
	}

	let { heroes: initialHeroes, gameId, onContinue, onHeroesUpdate }: Props = $props();

	// Gold as svelte state
	let gold = $state(2);
	let purchasing = $state(false);
	let selectedHatItem = $state<ShopItem | null>(null);
	let selectedCharacterItem = $state<ShopItem | null>(null);
	let draggingHeroId = $state<number | null>(null);

	// Reactive heroes state - update immediately when hats are purchased
	let heroes = $state([...initialHeroes]);

	// Update heroes when prop changes
	$effect(() => {
		const currentHeroes = initialHeroes;
		if (JSON.stringify(heroes) !== JSON.stringify(currentHeroes)) {
			heroes = [...currentHeroes];
		}
	});

	async function persistHeroOrder(nextHeroes: CharacterWithType[]) {
		try {
			await fetch(`/api/games/${gameId}/reorder-heroes`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ heroIds: nextHeroes.map((h) => h.id) })
			});
		} catch (e) {
			console.error('Failed to persist hero order:', e);
		}
	}

	function reorderHeroes(dragId: number, dropId: number) {
		if (dragId === dropId) return;
		const fromIndex = heroes.findIndex((h) => h.id === dragId);
		const toIndex = heroes.findIndex((h) => h.id === dropId);
		if (fromIndex === -1 || toIndex === -1) return;

		const next = [...heroes];
		const [moved] = next.splice(fromIndex, 1);
		next.splice(toIndex, 0, moved);
		heroes = next;
		persistHeroOrder(next);

		if (onHeroesUpdate) onHeroesUpdate(next);
	}

	// Fetch 5 random shop items (hat/character combinations)
	const shopItemsQuery = createQuery(() => ({
		queryKey: ['shop-items'],
		queryFn: async (): Promise<ShopItem[]> => {
			const response = await fetch('/api/shop-items');
			if (!response.ok) {
				throw new Error('Failed to fetch shop items');
			}
			return response.json();
		}
	}));

	function selectHatItem(item: ShopItem) {
		if (item.type === 'hat') {
			selectedHatItem = item;
		}
	}

	async function purchaseCharacter(item: ShopItem, removeCharacterId?: number) {
		if (item.type !== 'character') return;
		if (gold < item.cost) {
			alert('Not enough gold!');
			return;
		}

		// If team is full, prompt to remove one first.
		if (heroes.length >= 5 && removeCharacterId === undefined) {
			selectedCharacterItem = item;
			return;
		}

		purchasing = true;
		try {
			const response = await fetch(`/api/games/${gameId}/purchase-hat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					characterTypeId: item.characterType.id,
					hatId: null, // No hat for new character
					removeCharacterId: removeCharacterId ?? undefined
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to purchase character');
			}

			const result = await response.json();

			// Deduct gold
			gold -= item.cost;

			// Update heroes state immediately with new character
			if (result.character) {
				// Fetch character type for the new character
				const gameResponse = await fetch(`/api/games/${gameId}`);
				if (gameResponse.ok) {
					const gameData = await gameResponse.json();
					heroes = gameData.heroes;
					if (onHeroesUpdate) {
						onHeroesUpdate(gameData.heroes);
					}
				}
			}

			// Refetch shop items to get new random items
			selectedCharacterItem = null;
			shopItemsQuery.refetch();
		} catch (error) {
			console.error('Error purchasing character:', error);
			alert(error instanceof Error ? error.message : 'Failed to purchase character');
		} finally {
			purchasing = false;
		}
	}

	async function purchaseHatForCharacter(characterId: number) {
		if (!selectedHatItem || selectedHatItem.type !== 'hat') return;

		const hatItem = selectedHatItem; // Type narrowing
		if (gold < hatItem.cost) {
			alert('Not enough gold!');
			return;
		}

		// Update heroes state immediately to show hat
		const heroIndex = heroes.findIndex((h) => h.id === characterId);
		if (heroIndex !== -1) {
			heroes = heroes.map((hero, index) => {
				if (index === heroIndex) {
					return {
						...hero,
						hatId: hatItem.hat.hatId
					};
				}
				return hero;
			});
		}

		purchasing = true;
		try {
			const response = await fetch(`/api/games/${gameId}/apply-upgrade`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					upgradeId: hatItem.hat.id,
					characterId: characterId
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Failed to apply hat');
			}

			// Deduct gold
			gold -= selectedHatItem.cost;

			// Update heroes list from server to get updated stats
			if (onHeroesUpdate) {
				const gameResponse = await fetch(`/api/games/${gameId}`);
				if (gameResponse.ok) {
					const gameData = await gameResponse.json();
					heroes = gameData.heroes;
					onHeroesUpdate(gameData.heroes);
				}
			}

			// Close modal and refetch shop items
			selectedHatItem = null;
			shopItemsQuery.refetch();
		} catch (error) {
			console.error('Error purchasing hat:', error);
			alert(error instanceof Error ? error.message : 'Failed to purchase hat');
			// Revert the optimistic update on error
			heroes = initialHeroes;
		} finally {
			purchasing = false;
		}
	}
</script>

<div class="pixel-art-bg min-h-screen p-8" style="background-image: url('{shopBg}');">
	<div class="mx-auto max-w-6xl">
		<!-- Header with Gold -->
		<div class="mb-8 flex items-center justify-between">
			<h1 class="text-4xl font-bold text-white drop-shadow-lg">Shop</h1>
			<div class="flex items-center gap-2 rounded-lg bg-yellow-600 px-6 py-3">
				<svg
					class="h-6 w-6 text-yellow-200"
					fill="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
					/>
				</svg>
				<span class="text-xl font-bold text-white">{gold}</span>
			</div>
		</div>

		<!-- Characters Section -->
		<div class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold text-white">Your Characters</h2>
			<p class="mb-3 text-sm text-gray-300">Drag to reorder (order affects battle turn order).</p>
			<div class="flex flex-wrap gap-4">
				{#each heroes as hero}
					{@const heroHatDef = hero.hatId ? getHatDefinition(hero.hatId) : null}
					<div
						class="relative flex flex-col items-center gap-2 rounded-lg bg-gray-800/50 p-4 backdrop-blur-sm"
						draggable="true"
						role="listitem"
						aria-label="Reorder character"
						title={heroHatDef ? `${heroHatDef.modifier.name}: ${heroHatDef.description}` : ''}
						ondragstart={() => (draggingHeroId = hero.id)}
						ondragover={(e) => {
							e.preventDefault();
						}}
						ondrop={() => {
							if (draggingHeroId !== null) reorderHeroes(draggingHeroId, hero.id);
							draggingHeroId = null;
						}}
					>
						<!-- Character Image with Hat -->
						<div class="relative">
							<img
								src={hero.characterType.imageUrl || '/characters/cat.png'}
								alt={hero.characterType.name}
								class="h-24 w-24 rounded-lg object-cover"
							/>
							<!-- Hat Display - Top Center -->
							{#if hero.hatId && getHatFilepath(hero.hatId)}
								<div
									class="absolute -top-6 left-1/2 -translate-x-1/2 drop-shadow-lg"
									style="z-index: 10;"
								>
									<img
										src={getHatFilepath(hero.hatId)!}
										alt="Hat"
										class="pixel-art-character h-6 w-6"
										style="image-rendering: pixelated; image-rendering: crisp-edges;"
									/>
								</div>
							{/if}
						</div>
						<div class="text-center">
							<div class="font-semibold text-white">{hero.characterType.name}</div>
							<div class="text-xs text-gray-400">
								❤️ {hero.stats.health}/{hero.stats.maxHealth} | ⚔️ {hero.stats.attack}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Shop Items Section -->
		<div class="mb-8">
			<h2 class="mb-4 text-2xl font-semibold text-white">Shop</h2>
			{#if shopItemsQuery.isLoading}
				<div class="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-800/30">
					<span class="text-lg text-purple-300">Loading shop items...</span>
				</div>
			{:else if shopItemsQuery.isError}
				<div class="flex min-h-[200px] items-center justify-center rounded-lg bg-red-900/30">
					<span class="text-lg text-red-300">Error loading shop items</span>
				</div>
			{:else if shopItemsQuery.data}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					{#each shopItemsQuery.data as item}
						{@const canAfford = gold >= item.cost}
						{#if item.type === 'character'}
							<!-- Character Item -->
							<button
								onclick={() => purchaseCharacter(item)}
								disabled={!canAfford || purchasing}
								class="relative flex flex-col gap-2 rounded-lg bg-gray-800/50 p-4 text-left transition-all hover:bg-gray-700/50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<!-- Gold Cost - Top Right -->
								<div
									class="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-yellow-600 px-2 py-1"
								>
									<svg class="h-4 w-4 text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
										<path
											d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
										/>
									</svg>
									<span class="text-xs font-bold text-white">{item.cost}</span>
								</div>

								<!-- Character Image -->
								<div class="flex justify-center">
									<img
										src={item.characterType.imageUrl || '/characters/cat.png'}
										alt={item.characterType.name}
										class="h-24 w-24 rounded-lg object-cover"
									/>
								</div>

								<!-- Character Info -->
								<div class="text-center">
									<div class="font-semibold text-white">{item.characterType.name}</div>
									<div class="mt-1 text-xs text-gray-400">
										❤️ {item.characterType.baseStats.maxHealth} | ⚔️{' '}
										{item.characterType.baseStats.attack}
									</div>
								</div>
							</button>
						{:else}
							{@const hatDef = item.hat.hatId ? getHatDefinition(item.hat.hatId) : null}
							<!-- Hat Item -->
							<button
								onclick={() => selectHatItem(item)}
								disabled={!canAfford || purchasing}
								class="relative flex flex-col gap-2 rounded-lg bg-gray-800/50 p-4 text-left transition-all hover:bg-gray-700/50 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<!-- Gold Cost - Top Right -->
								<div
									class="absolute -top-2 -right-2 flex items-center gap-1 rounded-full bg-yellow-600 px-2 py-1"
								>
									<svg class="h-4 w-4 text-yellow-200" fill="currentColor" viewBox="0 0 24 24">
										<path
											d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"
										/>
									</svg>
									<span class="text-xs font-bold text-white">{item.cost}</span>
								</div>

								<!-- Hat Display -->
								<div class="flex justify-center">
									<div
										class="flex h-24 w-24 items-center justify-center rounded-lg bg-purple-600/30"
									>
										{#if item.hat.hatId && getHatFilepath(item.hat.hatId)}
											<img
												src={getHatFilepath(item.hat.hatId)!}
												alt={item.hat.name}
												class="pixel-art-character h-20 w-20 drop-shadow-lg"
												style="image-rendering: pixelated; image-rendering: crisp-edges;"
											/>
										{:else}
											<span class="text-4xl">🎩</span>
										{/if}
									</div>
								</div>

								<!-- Hat Info -->
								<div class="text-center">
									<div class="font-semibold text-white">{item.hat.name}</div>
									<div class="mt-1 text-xs font-semibold text-purple-300">
										{hatDef?.description || item.hat.description}
									</div>
								</div>
							</button>
						{/if}
					{/each}
				</div>
			{/if}
		</div>

		<!-- Hat Selection Modal -->
		{#if selectedHatItem && selectedHatItem.type === 'hat'}
			{@const hatDef = selectedHatItem.hat.hatId
				? getHatDefinition(selectedHatItem.hat.hatId)
				: null}
			<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
				<button
					type="button"
					class="absolute inset-0 bg-black/50"
					aria-label="Close hat selection"
					onclick={() => (selectedHatItem = null)}
				></button>
				<div class="relative max-w-2xl rounded-lg bg-gray-800 p-6" role="dialog" aria-modal="true">
					<h3 class="mb-4 text-2xl font-bold text-white">
						Select a character for {selectedHatItem.hat.name}
					</h3>
					<p class="mb-4 text-gray-300">
						{hatDef?.description || selectedHatItem.hat.description}
					</p>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
						{#each heroes as hero}
							<button
								onclick={() => purchaseHatForCharacter(hero.id)}
								disabled={purchasing || gold < selectedHatItem.cost}
								class="flex flex-col items-center gap-2 rounded-lg bg-gray-700 p-4 transition-all hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<img
									src={hero.characterType.imageUrl || '/characters/cat.png'}
									alt={hero.characterType.name}
									class="h-16 w-16 rounded-lg object-cover"
								/>
								<div class="text-center">
									<div class="font-semibold text-white">{hero.characterType.name}</div>
									<div class="text-xs text-gray-300">Level {hero.level || 1}</div>
									{#if hero.hatId && getHatFilepath(hero.hatId)}
										<div class="flex items-center justify-center gap-1 text-xs text-yellow-400">
											<span>Current:</span>
											<img
												src={getHatFilepath(hero.hatId)!}
												alt="Current hat"
												class="pixel-art-character h-4 w-4"
												style="image-rendering: pixelated; image-rendering: crisp-edges;"
											/>
										</div>
									{/if}
								</div>
							</button>
						{/each}
					</div>
					<div class="mt-4 flex justify-end">
						<button
							onclick={() => (selectedHatItem = null)}
							class="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-500"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Character Replacement Modal (when already at 5 heroes) -->
		{#if selectedCharacterItem && selectedCharacterItem.type === 'character'}
			{@const characterItem = selectedCharacterItem}
			<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
				<button
					type="button"
					class="absolute inset-0 bg-black/50"
					aria-label="Close character replacement"
					onclick={() => (selectedCharacterItem = null)}
				></button>
				<div class="relative max-w-2xl rounded-lg bg-gray-800 p-6" role="dialog" aria-modal="true">
					<h3 class="mb-2 text-2xl font-bold text-white">Your team is full</h3>
					<p class="mb-4 text-gray-300">
						Choose a character to remove to buy <span class="font-semibold text-white"
							>{characterItem.characterType.name}</span
						>.
					</p>
					<div class="grid grid-cols-2 gap-4 md:grid-cols-3">
						{#each heroes as hero}
							<button
								onclick={() => purchaseCharacter(characterItem, hero.id)}
								disabled={purchasing || gold < characterItem.cost}
								class="flex flex-col items-center gap-2 rounded-lg bg-gray-700 p-4 transition-all hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<img
									src={hero.characterType.imageUrl || '/characters/cat.png'}
									alt={hero.characterType.name}
									class="h-16 w-16 rounded-lg object-cover"
								/>
								<div class="text-center">
									<div class="font-semibold text-white">{hero.characterType.name}</div>
									<div class="text-xs text-gray-300">
										❤️ {hero.stats.health}/{hero.stats.maxHealth} | ⚔️ {hero.stats.attack}
									</div>
								</div>
							</button>
						{/each}
					</div>
					<div class="mt-4 flex justify-end">
						<button
							onclick={() => (selectedCharacterItem = null)}
							class="rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-500"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Continue Button -->
		<div class="flex justify-end">
			<button
				onclick={onContinue}
				class="rounded-lg bg-green-600 px-8 py-3 text-xl font-bold text-white transition-colors hover:bg-green-700"
			>
				Continue
			</button>
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
</style>
