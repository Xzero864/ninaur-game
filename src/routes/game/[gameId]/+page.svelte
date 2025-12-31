<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import GameScene from '$lib/components/GameScene.svelte';
	import SimpleVictoryScreen from '$lib/components/SimpleVictoryScreen.svelte';
	import SimpleDefeatScreen from '$lib/components/SimpleDefeatScreen.svelte';
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
			hatX: number;
			hatY: number;
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

	const boss = $derived(
		gameQuery.data?.enemies && gameQuery.data.enemies.length > 0
			? gameQuery.data.enemies[0]
			: undefined
	);

	// Get game engine instance (singleton)
	const gameEngine = $derived(GameEngine.getInstance());

	let intervalId: ReturnType<typeof setInterval> | null = null;
	let showSimpleVictory = $state(false);
	let showSimpleDefeat = $state(false);
	let showShop = $state(false); // Track if we've navigated to shop to prevent multiple navigations
	let shouldRestartGame = $state(false);
	let gameInitialized = $state(false);
	let battleWonApplied = $state(false);
	let endRoundHealed = $state(false);

	// Initialize game engine when data is loaded
	$effect(() => {
		if (!gameQuery.data || !boss || gameInitialized) return;

		// Convert database characters to game logic characters
		const heroes = gameQuery.data.heroes.map(createCharacterFromDb);
		const bossCharacter = createCharacterFromDb(boss);

		gameEngine.initialize(heroes, bossCharacter);
		gameInitialized = true;
	});

	// Auto-start first round when engine is ready and set up auto-progression
	$effect(() => {
		// Clear existing interval if it exists
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}

		if (!gameInitialized || !gameEngine || !gameQuery.data) return;

		// Start a new round if we're not already in a round
		if (gameEngine.phase === 'round-start' || gameEngine.phase === 'round-end') {
			gameEngine.startRound();
		}

		// Auto-progress through phases every 1 second
		intervalId = setInterval(() => {
			const currentEngine = GameEngine.getInstance();
			if (!currentEngine || currentEngine.isGameOver()) {
				if (intervalId) {
					clearInterval(intervalId);
					intervalId = null;
				}
				// Check for victory - navigate to shop screen
				if (
					currentEngine &&
					currentEngine.isVictory() &&
					!showSimpleVictory &&
					!showShop &&
					!showSimpleDefeat
				) {
					if (!battleWonApplied) {
						battleWonApplied = true;
						// Persist permanent "battle won" bonuses to DB (+10 health, +10 maxHealth, +2 attack)
						fetch(`/api/games/${gameId}/battle-won`, { method: 'POST' }).catch((e) =>
							console.error('Failed to apply battle-won bonus:', e)
						);
					}
					showSimpleVictory = true;
					// After 2 seconds, navigate to shop screen
					setTimeout(() => {
						showSimpleVictory = false;
						showShop = true;
						goto(`/game/shop/${gameId}`);
					}, 2000);
				}
				// Check for defeat - show defeat screen
				if (
					currentEngine &&
					!currentEngine.isVictory() &&
					!showSimpleDefeat &&
					!showShop &&
					!showSimpleVictory
				) {
					showSimpleDefeat = true;
				}
				return;
			}

			if (currentEngine.phase === 'round-end') {
				if (!endRoundHealed) {
					endRoundHealed = true;
					fetch(`/api/games/${gameId}/end-round`, { method: 'POST' }).catch((e) =>
						console.error('Failed to apply end-round heal:', e)
					);
				}
				// Navigate to shop screen when round ends
				if (!showShop) {
					showShop = true;
					goto(`/game/shop/${gameId}`);
				}
			} else if (currentEngine.phase === 'action') {
				endRoundHealed = false;
				// Process next action
				currentEngine.processNextAction();
			}
		}, 1000);

		// Cleanup on destroy
		return () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
		};
	});

	// Handle game restart after level up
	$effect(() => {
		if (shouldRestartGame && gameEngine && gameInitialized) {
			shouldRestartGame = false;
			gameEngine.startRound();
		}
	});
</script>

<div class="min-h-screen bg-gray-900">
	{#if gameQuery.isLoading}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center text-white">
				<div class="mb-4 text-2xl">Loading game...</div>
				<div class="text-purple-400">Game ID: {gameId}</div>
			</div>
		</div>
	{:else if gameQuery.isError}
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center text-red-400">
				<div class="mb-4 text-2xl">Error loading game</div>
				<div>{gameQuery.error?.message || 'Unknown error'}</div>
			</div>
		</div>
	{:else if gameQuery.data && gameEngine}
		<div class="relative h-screen overflow-hidden">
			<!-- Header with Back Button and Boss Level - Fixed Overlay at Top -->
			<div
				class="absolute top-0 right-0 left-0 z-20 flex items-center justify-between border-b border-gray-700 bg-black/70 p-4 backdrop-blur-sm"
			>
				<button
					onclick={() => goto('/')}
					class="rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-gray-600"
				>
					← Back
				</button>
				<!-- Boss Level -->
				<div class="text-white">
					Boss Level: <span class="font-semibold text-purple-400">{gameQuery.data.bossLevel}</span>
				</div>
				<!-- Game Status -->
				<div class="flex items-center justify-center gap-4">
					{#if gameEngine.isGameOver()}
						{#if gameEngine.isVictory()}
							<div class="rounded-lg bg-green-600 px-6 py-3 text-xl font-bold text-white">
								Victory! 🎉
							</div>
						{:else}
							<div class="rounded-lg bg-red-600 px-6 py-3 text-xl font-bold text-white">
								Defeat!
							</div>
						{/if}
					{:else}
						<div class="text-white">
							Phase: <span class="font-semibold text-purple-400">{gameEngine.phase}</span>
						</div>
						<div class="text-sm text-gray-300">Auto-advancing every 1 second...</div>
					{/if}
				</div>
			</div>

			<!-- Game Scene -->
			{#if gameEngine}
				<GameScene
					gameName={gameQuery.data.name}
					heroes={gameQuery.data.heroes}
					{boss}
					{gameEngine}
					bossLevel={gameQuery.data.bossLevel}
				/>
			{/if}
		</div>
	{/if}

	<!-- Simple Victory Screen -->
	{#if showSimpleVictory && gameQuery.data}
		<SimpleVictoryScreen bossLevel={gameQuery.data.bossLevel} />
	{/if}

	<!-- Simple Defeat Screen -->
	{#if showSimpleDefeat && gameQuery.data}
		<SimpleDefeatScreen
			bossLevel={gameQuery.data.bossLevel}
			onOkay={async () => {
				// Delete the game
				try {
					const response = await fetch(`/api/games/${gameId}`, {
						method: 'DELETE'
					});
					if (!response.ok) {
						console.error('Failed to delete game');
					}
				} catch (error) {
					console.error('Error deleting game:', error);
				}
				// Navigate to home
				goto('/');
			}}
		/>
	{/if}
</div>
