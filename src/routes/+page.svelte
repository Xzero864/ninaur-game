<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';

	type Game = { id: number; name: string; characterIds: number[]; bossLevel: number };

	let showModal = $state(false);
	let showNewGameModal = $state(false);
	let gameName = $state('');
	let creating = $state(false);
	let clearing = $state(false);

	// This query uses prefetched data from +page.ts, so no fetch happens on mount
	const gamesQuery = createQuery(() => ({
		queryKey: ['games'],
		queryFn: async (): Promise<Game[]> => {
			const response = await fetch('/api/games');
			if (!response.ok) {
				throw new Error('Failed to fetch games');
			}
			return response.json();
		}
	}));

	function openExistingGames() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	function openNewGameModal() {
		showNewGameModal = true;
		gameName = '';
	}

	function closeNewGameModal() {
		showNewGameModal = false;
		gameName = '';
	}

	async function createNewGame() {
		if (!gameName.trim()) {
			return;
		}

		creating = true;
		try {
			const response = await fetch('/api/games', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: gameName.trim() })
			});

			if (!response.ok) {
				throw new Error('Failed to create game');
			}

			const newGame = await response.json();
			closeNewGameModal();
			// Navigate directly to the game screen
			await goto(`/game/${newGame.id}`);
		} catch (error) {
			console.error('Error creating game:', error);
			alert('Failed to create game. Please try again.');
		} finally {
			creating = false;
		}
	}

	async function clearAllGames() {
		if (!confirm('Are you sure you want to delete all games? This cannot be undone.')) {
			return;
		}

		clearing = true;
		try {
			const response = await fetch('/api/games', {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('Failed to clear games');
			}

			// Invalidate and refetch games query
			gamesQuery.refetch();
			alert('All games cleared successfully!');
		} catch (error) {
			console.error('Error clearing games:', error);
			alert('Failed to clear games. Please try again.');
		} finally {
			clearing = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-900 p-4">
	<div class="space-y-8 text-center">
		<h1 class="mb-12 text-5xl font-bold text-white">Autobattler Game</h1>

		<div class="mx-auto flex max-w-md flex-col gap-4">
			<button
				onclick={openExistingGames}
				disabled={!gamesQuery.data || gamesQuery.data.length === 0}
				class="rounded-lg bg-purple-600 px-8 py-4 font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-purple-600"
			>
				Existing Games
			</button>

			<button
				onclick={openNewGameModal}
				class="rounded-lg bg-purple-600 px-8 py-4 font-semibold text-white shadow-lg transition-colors duration-200 hover:bg-purple-700"
			>
				New Game
			</button>
		</div>
	</div>

	{#if showModal}
		<!-- Modal Backdrop -->
		<div
			class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
			onclick={closeModal}
			onkeydown={(e) => {
				if (e.key === 'Escape') closeModal();
			}}
			role="button"
			tabindex="0"
			aria-label="Close modal"
		>
			<!-- Modal Content -->
			<div
				class="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-gray-800 shadow-xl"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				tabindex="-1"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<!-- Modal Header -->
				<div class="flex items-center justify-between border-b border-gray-700 p-6">
					<h2 id="modal-title" class="text-2xl font-bold text-white">Existing Games</h2>
					<div class="flex items-center gap-4">
						<button
							type="button"
							onclick={clearAllGames}
							disabled={clearing || !gamesQuery.data || gamesQuery.data.length === 0}
							class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{clearing ? 'Clearing...' : 'Clear All Games'}
						</button>
						<button
							type="button"
							onclick={closeModal}
							class="text-gray-400 transition-colors hover:text-white"
							aria-label="Close modal"
						>
							<svg
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
						</button>
					</div>
				</div>

				<!-- Modal Body -->
				<div class="flex-1 overflow-y-auto p-6">
					{#if gamesQuery.isLoading}
						<div class="py-8 text-center text-gray-400">Loading games...</div>
					{:else if gamesQuery.isError}
						<div class="py-8 text-center text-red-400">
							Error loading games: {gamesQuery.error?.message || 'Unknown error'}
						</div>
					{:else if !gamesQuery.data || gamesQuery.data.length === 0}
						<div class="py-8 text-center text-gray-400">No games found</div>
					{:else}
						<div class="space-y-4">
							{#each gamesQuery.data as game}
								<div
									class="rounded-lg border border-gray-600 bg-gray-700 p-4 transition-colors hover:border-purple-500"
								>
									<div class="mb-2 flex items-start justify-between">
										<div>
											<span class="font-semibold text-purple-400">Name:</span>
											<span class="ml-2 text-white">{game.name}</span>
										</div>
										<div>
											<span class="font-semibold text-purple-400">Boss Level:</span>
											<span class="ml-2 text-white">{game.bossLevel}</span>
										</div>
									</div>
									<div class="mt-2">
										<a
											href="/game/{game.id}"
											class="text-purple-400 underline hover:text-purple-300"
										>
											View Game →
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#if showNewGameModal}
		<!-- New Game Modal Backdrop -->
		<div
			class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
			onclick={closeNewGameModal}
			onkeydown={(e) => {
				if (e.key === 'Escape') closeNewGameModal();
			}}
			role="button"
			tabindex="0"
			aria-label="Close modal"
		>
			<!-- Modal Content -->
			<div
				class="flex w-full max-w-md flex-col rounded-lg bg-gray-800 shadow-xl"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				tabindex="-1"
				aria-modal="true"
				aria-labelledby="new-game-modal-title"
			>
				<!-- Modal Header -->
				<div class="flex items-center justify-between border-b border-gray-700 p-6">
					<h2 id="new-game-modal-title" class="text-2xl font-bold text-white">New Game</h2>
					<button
						type="button"
						onclick={closeNewGameModal}
						class="text-gray-400 transition-colors hover:text-white"
						aria-label="Close modal"
					>
						<svg
							class="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<!-- Modal Body -->
				<div class="p-6">
					<div class="mb-4">
						<label for="game-name" class="mb-2 block text-sm font-semibold text-white">
							Game Name
						</label>
						<input
							id="game-name"
							type="text"
							bind:value={gameName}
							placeholder="Enter game name..."
							class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
							onkeydown={(e) => {
								if (e.key === 'Enter' && !creating) {
									createNewGame();
								}
							}}
						/>
					</div>
					<button
						onclick={createNewGame}
						disabled={!gameName.trim() || creating}
						class="w-full rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{creating ? 'Creating...' : 'Create Game'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
