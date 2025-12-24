<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import GameScene from '$lib/components/GameScene.svelte';
	import VictoryScreen from '$lib/components/VictoryScreen.svelte';
	import { GameEngine } from '$lib/gameLogic/GameEngine.svelte.js';
	import { createCharacterFromDb } from '$lib/gameLogic/createCharacterFromDb.js';
	import { AbilityFactory } from '$lib/gameLogic/abilities/AbilityFactory.js';
	import type { CharacterType } from '$lib/server/db/schema.js';

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
			levelTwoAbilityId: string | null;
			levelThreeAbilityId: string | null;
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

	const boss = $derived(
		gameQuery.data?.enemies && gameQuery.data.enemies.length > 0
			? gameQuery.data.enemies[0]
			: undefined
	);

	// Get game engine instance (singleton)
	const gameEngine = $derived(GameEngine.getInstance());

	// Initialize game engine when data is loaded
	$effect(() => {
		if (!gameQuery.data || !boss) return;

		// Convert database characters to game logic characters
		const heroes = gameQuery.data.heroes.map(createCharacterFromDb);
		const bossCharacter = createCharacterFromDb(boss);

		gameEngine.initialize(heroes, bossCharacter);
	});

	let intervalId: ReturnType<typeof setInterval> | null = null;
	let showVictory = $state(false);
	let randomCharacterType = $state<CharacterType | null>(null);
	let selectionMade = $state(false);
	let shouldRestartGame = $state(false);

	// Fetch character types for random character selection
	const characterTypesQuery = createQuery(() => ({
		queryKey: ['character-types'],
		queryFn: async (): Promise<CharacterType[]> => {
			const response = await fetch('/api/character-types');
			if (!response.ok) {
				throw new Error('Failed to fetch character types');
			}
			return response.json();
		}
	}));

	// Get random character type (excluding Boss and types already in team)
	const getRandomCharacterType = (): CharacterType | null => {
		if (!characterTypesQuery.data || !gameQuery.data) return null;
		const heroTypes = characterTypesQuery.data.filter((ct) => ct.name !== 'Boss');
		if (heroTypes.length === 0) return null;

		// Get character type IDs that already exist in the team
		const existingTypeIds = new Set(gameQuery.data.heroes.map((h) => h.characterType.id));

		// Filter out character types that already exist in the team
		const availableTypes = heroTypes.filter((ct) => !existingTypeIds.has(ct.id));

		if (availableTypes.length === 0) return null;
		return availableTypes[Math.floor(Math.random() * availableTypes.length)];
	};

	// Auto-start first round when engine is ready and set up auto-progression
	$effect(() => {
		// Clear existing interval if it exists
		if (intervalId) {
			clearInterval(intervalId);
			intervalId = null;
		}

		if (gameEngine) {
			// Start first round
			gameEngine.startRound();

			// Auto-progress through phases every 1 second
			intervalId = setInterval(() => {
				const currentEngine = GameEngine.getInstance();
				if (!currentEngine || currentEngine.isGameOver()) {
					if (intervalId) {
						clearInterval(intervalId);
						intervalId = null;
					}
					// Check for victory
					if (currentEngine && currentEngine.isVictory() && !showVictory) {
						showVictory = true;
						randomCharacterType = getRandomCharacterType();
					}
					return;
				}

				if (currentEngine.phase === 'round-end') {
					// Start next round
					currentEngine.startRound();
				} else if (currentEngine.phase === 'action') {
					// Process next action
					currentEngine.processNextAction();
				}
			}, 1000);
		}

		// Handle game restart after level up
		if (shouldRestartGame && gameEngine) {
			shouldRestartGame = false;
			gameEngine.startRound();
		}

		// Cleanup on destroy
		return () => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
		};
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
		<div class="flex flex-col">
			<!-- Header with Back Button -->
			<div class="flex items-center justify-between p-4">
				<button
					onclick={() => goto('/')}
					class="rounded-lg bg-gray-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-gray-600"
				>
					← Back
				</button>
				<div class="text-white">
					Boss Level: <span class="font-semibold text-purple-400">{gameQuery.data.bossLevel}</span>
				</div>
			</div>

			<!-- Game Status -->
			<div class="flex items-center justify-center gap-4 p-4">
				{#if gameEngine.isGameOver()}
					{#if gameEngine.isVictory()}
						<div class="rounded-lg bg-green-600 px-6 py-3 text-xl font-bold text-white">
							Victory! 🎉
						</div>
					{:else}
						<div class="rounded-lg bg-red-600 px-6 py-3 text-xl font-bold text-white">Defeat!</div>
					{/if}
				{:else}
					<div class="text-white">
						Phase: <span class="font-semibold text-purple-400">{gameEngine.phase}</span>
					</div>
					<div class="text-sm text-gray-300">Auto-advancing every 1 second...</div>
				{/if}
			</div>

			<!-- Game Scene -->
			{#if gameEngine}
				<GameScene
					gameName={gameQuery.data.name}
					heroes={gameQuery.data.heroes}
					{boss}
					{gameEngine}
				/>
			{/if}
		</div>

		<!-- Victory Screen -->
		{#if showVictory && gameEngine && gameQuery.data && randomCharacterType}
			<VictoryScreen
				heroes={gameQuery.data.heroes}
				{randomCharacterType}
				gameId={Number(gameId)}
				onSelectLevelUp={async (characterId: number) => {
					if (!gameId) return;

					try {
						const character = gameQuery.data?.heroes.find((h) => h.id === characterId);
						if (!character) {
							throw new Error('Character not found');
						}

						const currentLevel = character.level || 1;
						if (currentLevel >= 2) {
							alert('Character is already at max level');
							return;
						}

						const newLevel = currentLevel + 1;

						const response = await fetch(`/api/games/${gameId}`, {
							method: 'PUT',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								characterId,
								level: newLevel
							})
						});

						if (!response.ok) {
							throw new Error('Failed to level up character');
						}

						// Refetch game data to get updated character level
						await gameQuery.refetch();

						// Reinitialize game engine with updated character abilities
						if (gameQuery.data && boss) {
							const heroes = gameQuery.data.heroes.map(createCharacterFromDb);
							const bossCharacter = createCharacterFromDb(boss);
							gameEngine.initialize(heroes, bossCharacter);
						}

						// Close the modal after successful save
						showVictory = false;
						selectionMade = false;
						randomCharacterType = null;
					} catch (error) {
						console.error('Error leveling up character:', error);
						alert('Failed to level up character. Please try again.');
					}
				}}
				onSelectCharacter={async () => {
					if (!gameId || !randomCharacterType) return;

					try {
						const response = await fetch(`/api/games/${gameId}`, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								characterTypeId: randomCharacterType.id
							})
						});

						if (!response.ok) {
							const errorData = await response.json();
							throw new Error(errorData.error || 'Failed to add character');
						}

						// Refetch game data to get the new character
						await gameQuery.refetch();

						// Reinitialize game engine with updated characters
						if (gameQuery.data && boss) {
							const heroes = gameQuery.data.heroes.map(createCharacterFromDb);
							const bossCharacter = createCharacterFromDb(boss);
							gameEngine.initialize(heroes, bossCharacter);
						}

						// Close the modal after successful save
						showVictory = false;
						selectionMade = false;
						randomCharacterType = null;
					} catch (error) {
						console.error('Error adding character:', error);
						alert(
							error instanceof Error ? error.message : 'Failed to add character. Please try again.'
						);
					}
				}}
				onNext={async () => {
					// Level up boss and restart game
					if (!gameId) return;

					try {
						const newBossLevel = (gameQuery.data?.bossLevel || 1) + 1;
						const response = await fetch(`/api/games/${gameId}`, {
							method: 'PATCH',
							headers: {
								'Content-Type': 'application/json'
							},
							body: JSON.stringify({
								bossLevel: newBossLevel
							})
						});

						if (!response.ok) {
							throw new Error('Failed to level up boss');
						}

						// Reset game state
						showVictory = false;
						selectionMade = false;
						randomCharacterType = null;

						// Refetch game data and wait for it
						await gameQuery.refetch();

						// Trigger game restart
						shouldRestartGame = true;
					} catch (error) {
						console.error('Error leveling up boss:', error);
						alert('Failed to level up boss. Please try again.');
					}
				}}
			/>
		{/if}
	{/if}
</div>
