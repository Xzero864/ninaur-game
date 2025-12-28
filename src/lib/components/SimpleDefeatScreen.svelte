<script lang="ts">
	interface Props {
		bossLevel: number;
		onOkay: () => void;
	}

	let { bossLevel, onOkay }: Props = $props();
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="simple-defeat-title"
>
	<div class="text-center">
		<div class="mb-4 text-6xl">💀💀💀</div>
		<h2 id="simple-defeat-title" class="mb-4 text-5xl font-bold text-white">
			Defeat!
		</h2>
		<p class="text-2xl text-gray-200">
			You lost at level <span class="font-bold text-red-400">{bossLevel}</span>
		</p>
		<div class="mt-4 text-4xl">💀💀💀</div>
		<div class="mt-8">
			<button
				onclick={onOkay}
				class="rounded-lg bg-red-600 px-8 py-3 text-xl font-bold text-white shadow-lg transition-colors hover:bg-red-700"
			>
				Okay
			</button>
		</div>
	</div>
</div>

