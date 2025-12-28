<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import ShopScreen from '$lib/components/ShopScreen.svelte';
	import { GameEngine } from '$lib/gameLogic/GameEngine.svelte.js';
	import { createCharacterFromDb } from '$lib/gameLogic/createCharacterFromDb.js';

	type CharacterWithType = {
		id: number;
		type: 'hero' | 'enemy';
		characterTypeId: number;
		level?: number;
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
		};
	};

	type GameData = {
		id: number;
		name: string;
		characterIds: number[];
		bossLevel: number;
		heroes: CharacterWithType[];
		enemies: CharacterWithType[];
	};

	let { data }: { data: PageData } = $props();
	const gameId = $derived(data.gameId);

	const gameQuery = createQuery(() => ({
		queryKey: ['game', gameId],
		queryFn: async (): Promise<GameData> => {
			const currentGameId = gameId;
			if (!currentGameId) {
				throw new Error('Game ID is required');
			}
			const response = await fetch(`/api/games/${currentGameId}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Game not found');
				}
				throw new Error('Failed to fetch game');
			}
			return response.json();
		}
	}));

	const gameEngine = $derived(GameEngine.getInstance());
	const boss = $derived(
		gameQuery.data?.enemies && gameQuery.data.enemies.length > 0
			? gameQuery.data.enemies[0]
			: undefined
	);

	// Reinitialize game engine when heroes are updated
	function handleHeroesUpdate() {
		if (gameQuery.data && boss) {
			const heroes = gameQuery.data.heroes.map(createCharacterFromDb);
			const bossCharacter = createCharacterFromDb(boss);
			gameEngine.initialize(heroes, bossCharacter);
		}
		// Refetch to get updated data
		gameQuery.refetch();
	}

	// Handle continue - level up boss and navigate back to game
	async function handleContinue() {
		if (!gameQuery.data) return;

		try {
			const newBossLevel = gameQuery.data.bossLevel + 1;
			const response = await fetch(`/api/games/${gameId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ bossLevel: newBossLevel })
			});

			if (!response.ok) {
				throw new Error('Failed to level up boss');
			}

			// Refetch game data to get updated boss stats
			const result = await gameQuery.refetch();
			
			// Reinitialize game engine with updated boss
			if (result.data) {
				const updatedBoss = result.data.enemies && result.data.enemies.length > 0
					? result.data.enemies[0]
					: undefined;
				
				if (updatedBoss) {
					const heroes = result.data.heroes.map(createCharacterFromDb);
					const bossCharacter = createCharacterFromDb(updatedBoss);
					gameEngine.initialize(heroes, bossCharacter);
				}
			}

			// Navigate back to game
			goto(`/game/${gameId}`);
		} catch (error) {
			console.error('Error leveling up boss:', error);
			alert('Failed to level up boss. Please try again.');
		}
	}
</script>

<div class="min-h-screen bg-gray-900">
	{#if gameQuery.isLoading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center text-white">
				<div class="mb-4 text-2xl">Loading shop...</div>
				<div class="text-purple-400">Game ID: {gameId}</div>
			</div>
		</div>
	{:else if gameQuery.isError}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center text-red-400">
				<div class="mb-4 text-2xl">Error loading shop</div>
				<div>{gameQuery.error?.message || 'Unknown error'}</div>
			</div>
		</div>
	{:else if gameQuery.data}
		<ShopScreen
			heroes={gameQuery.data.heroes}
			gameId={Number(gameId)}
			onContinue={handleContinue}
			onHeroesUpdate={handleHeroesUpdate}
		/>
	{/if}
</div>

