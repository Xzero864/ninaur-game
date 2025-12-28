<script lang="ts">
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
		onSelectCharacter: () => void;
		onNext: () => void;
	}

	let { heroes, randomCharacterType, gameId, onSelectCharacter, onNext }: Props = $props();

	let selectionMade = $state(false);

</script>

<div
	class="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-black p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="victory-title"
>
	<div class="w-full max-w-4xl rounded-2xl bg-gray-800 p-8 shadow-2xl">
		<h2 id="victory-title" class="mb-8 text-center text-4xl font-bold text-white">Victory! 🎉</h2>
		<p class="mb-8 text-center text-xl text-gray-300">Choose your reward:</p>

		<!-- New Character Card -->
		<div class="flex justify-center">
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
</div>
