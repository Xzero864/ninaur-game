<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	onMount(async () => {
		try {
			await fetch('/api/seed-characters', { method: 'POST' });
		} catch (error) {
			console.error('Failed to seed characters:', error);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={data.queryClient}>
	{@render children()}
</QueryClientProvider>
