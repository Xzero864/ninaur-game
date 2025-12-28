<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = 'h-4 w-4 fill-red-500 text-red-500' }: Props = $props();
</script>

<svg
	class={className}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
	/>
</svg>

