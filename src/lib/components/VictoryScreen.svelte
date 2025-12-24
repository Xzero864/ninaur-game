<script lang="ts">
	import type { Character } from '$lib/gameLogic/characters/Character.svelte.js';
	import type { CharacterType } from '$lib/server/db/schema.js';
	import CharacterComponent from './Character.svelte';
	import type { Stats } from '$lib/gameLogic/types.js';

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

	interface Props {
		heroes: CharacterWithType[];
		randomCharacterType: CharacterType;
		gameId: number;
		onSelectLevelUp: (characterId: number) => Promise<void>;
		onSelectCharacter: () => void;
		onNext: () => void;
	}

	let { heroes, randomCharacterType, gameId, onSelectLevelUp, onSelectCharacter, onNext }: Props =
		$props();

	let selectionMade = $state(false);
	let showCharacterSelection = $state(false);
	let selectedCharacterId = $state<number | null>(null);

	// Filter heroes that can be leveled up (level < 2, max level is 2)
	const levelableHeroes = $derived(heroes.filter((h) => (h.level || 1) < 2));

	// Calculate new stats when leveling up (25% increase)
	function calculateNewStats(oldStats: Stats): Stats {
		return {
			health: Math.floor(oldStats.maxHealth * 1.25), // New max health
			maxHealth: Math.floor(oldStats.maxHealth * 1.25),
			attack: Math.floor(oldStats.attack * 1.25)
		};
	}

	// Empty abilities array for display
	const emptyAbilities: any[] = [];
</script>

<div
	class="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="victory-title"
>
	{#if !showCharacterSelection}
		<div class="w-full max-w-4xl rounded-2xl bg-gray-800 p-8 shadow-2xl">
			<h2 id="victory-title" class="mb-8 text-center text-4xl font-bold text-white">Victory! 🎉</h2>
			<p class="mb-8 text-center text-xl text-gray-300">Choose your reward:</p>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<!-- Level Up Character Card -->
				<button
					onclick={() => {
						if (levelableHeroes.length > 0) {
							showCharacterSelection = true;
						}
					}}
					disabled={levelableHeroes.length === 0 || selectionMade}
					class="group flex flex-col rounded-xl border-2 border-purple-500 bg-gray-700 p-6 text-left transition-all hover:border-purple-400 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<div class="mb-4 flex items-center gap-3">
						<div
							class="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-600 text-3xl"
						>
							⬆️
						</div>
						<div>
							<h3 class="text-2xl font-bold text-white">Level Up Character</h3>
							<p class="text-sm text-gray-400">Upgrade a character</p>
						</div>
					</div>
					{#if levelableHeroes.length > 0}
						<div class="space-y-2">
							<p class="text-sm text-gray-300">Select a character to level up (max level 2)</p>
							<p class="text-sm text-purple-300">
								{levelableHeroes.length} character{levelableHeroes.length !== 1 ? 's' : ''} can level
								up
							</p>
						</div>
					{:else}
						<p class="text-gray-400">All characters are at max level</p>
					{/if}
				</button>

				<!-- New Character Card -->
				<button
					onclick={() => {
						onSelectCharacter();
						selectionMade = true;
					}}
					disabled={selectionMade}
					class="group flex flex-col rounded-xl border-2 border-blue-500 bg-gray-700 p-6 text-left transition-all hover:border-blue-400 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<div class="mb-4 flex items-center gap-3">
						<div class="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-600 text-3xl">
							👤
						</div>
						<div>
							<h3 class="text-2xl font-bold text-white">New Character</h3>
							<p class="text-sm text-gray-400">Add to your team</p>
						</div>
					</div>
					<div class="space-y-2">
						{#if randomCharacterType.imageUrl}
							<img
								src={randomCharacterType.imageUrl}
								alt={randomCharacterType.name}
								class="h-24 w-24 rounded-lg object-cover"
							/>
						{/if}
						<p class="text-lg font-semibold text-blue-300">{randomCharacterType.name}</p>
						<div class="text-sm text-gray-300">
							<p>Health: {randomCharacterType.baseStats.maxHealth}</p>
							<p>Attack: {randomCharacterType.baseStats.attack}</p>
						</div>
					</div>
				</button>
			</div>

			<!-- Next Button (shown after selection) -->
			{#if selectionMade}
				<div class="mt-8 flex justify-center">
					<button
						onclick={onNext}
						class="rounded-lg bg-green-600 px-8 py-3 text-xl font-bold text-white shadow-lg transition-colors hover:bg-green-700"
					>
						Next Level →
					</button>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Character Selection for Level Up -->
		<div class="w-full max-w-4xl rounded-2xl bg-gray-800 p-8 shadow-2xl">
			<h2 id="character-selection-title" class="mb-8 text-center text-3xl font-bold text-white">
				Select a Character to Level Up
			</h2>
			<p class="mb-6 text-center text-gray-300">Choose which character to level up:</p>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each levelableHeroes as hero (hero.id)}
					{@const oldStats = hero.stats}
					{@const newStats = calculateNewStats(oldStats)}
					{@const currentLevel = hero.level || 1}
					{@const newLevel = currentLevel + 1}
					<button
						onclick={async () => {
							selectedCharacterId = hero.id;
							await onSelectLevelUp(hero.id);
							selectionMade = true;
							showCharacterSelection = false;
						}}
						class="group flex flex-col rounded-xl border-2 border-purple-500 bg-gray-700 p-4 text-left transition-all hover:border-purple-400 hover:bg-gray-600"
					>
						<!-- Character Name -->
						<h3 class="mb-4 text-center text-lg font-bold text-white">
							{hero.characterType.name}
						</h3>

						<!-- Level Up Display: Old Stats -> Arrow -> New Stats -->
						<div class="flex items-center justify-center gap-4">
							<!-- Old Character -->
							<div class="flex flex-col items-center">
								<CharacterComponent
									stats={oldStats}
									imageUrl={hero.characterType.imageUrl || '/characters/cat.png'}
									abilities={emptyAbilities}
									characterId={hero.id.toString()}
									level={currentLevel}
								/>
								<p class="mt-2 text-xs text-gray-400">Level {currentLevel}</p>
							</div>

							<!-- Level Up Arrow -->
							<div class="flex flex-col items-center">
								<div class="text-4xl font-bold text-yellow-400">→</div>
								<div class="text-xs text-yellow-300">Level Up</div>
							</div>

							<!-- New Character -->
							<div class="flex flex-col items-center">
								<CharacterComponent
									stats={newStats}
									imageUrl={hero.characterType.imageUrl || '/characters/cat.png'}
									abilities={emptyAbilities}
									characterId={hero.id.toString()}
									level={newLevel}
								/>
								<p class="mt-2 text-xs text-gray-400">Level {newLevel}</p>
							</div>
						</div>

						<!-- Stats Comparison -->
						<div class="mt-4 space-y-1 text-xs text-gray-300">
							<div class="flex justify-between">
								<span>Health:</span>
								<span>
									<span class="text-gray-400">{oldStats.maxHealth}</span>
									<span class="mx-1 text-yellow-400">→</span>
									<span class="text-green-400">{newStats.maxHealth}</span>
								</span>
							</div>
							<div class="flex justify-between">
								<span>Attack:</span>
								<span>
									<span class="text-gray-400">{oldStats.attack}</span>
									<span class="mx-1 text-yellow-400">→</span>
									<span class="text-green-400">{newStats.attack}</span>
								</span>
							</div>
						</div>
					</button>
				{/each}
			</div>

			<div class="mt-6 flex justify-center">
				<button
					onclick={() => {
						showCharacterSelection = false;
					}}
					class="rounded-lg bg-gray-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-gray-500"
				>
					Back
				</button>
			</div>
		</div>
	{/if}
</div>
