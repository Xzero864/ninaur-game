<script lang="ts">
	interface Props {
		bossLevel: number;
	}

	let { bossLevel }: Props = $props();
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="simple-victory-title"
>
	<div class="text-center">
		<div class="mb-4 text-6xl">🎉🎊🎉🎊🎉</div>
		<h2 id="simple-victory-title" class="mb-4 text-5xl font-bold text-white">
			Congratulations!
		</h2>
		<p class="text-2xl text-gray-200">
			You beat level <span class="font-bold text-purple-400">{bossLevel}</span>
		</p>
		<div class="mt-4 text-4xl">🎊🎉🎊🎉🎊</div>
	</div>
</div>

