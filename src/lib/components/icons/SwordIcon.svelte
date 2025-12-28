<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = 'h-4 w-4 text-yellow-400' }: Props = $props();
</script>

<svg class={className} fill="currentColor" viewBox="0 0 24 24">
	<!-- Sword blade (pointed upward) -->
	<path d="M12 2L13 10L11 10L12 2Z" />
	<!-- Sword crossguard -->
	<path d="M8 10L16 10L15.5 11L8.5 11L8 10Z" />
	<!-- Sword handle -->
	<path d="M11.5 11L11.5 19L12.5 19L12.5 11L11.5 11Z" />
	<!-- Sword pommel -->
	<path d="M10.5 19L13.5 19L13 20L11 20L10.5 19Z" />
</svg>

