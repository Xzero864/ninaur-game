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
		try {
			await fetch('/api/seed-upgrades', { method: 'POST' });
		} catch (error) {
			console.error('Failed to seed upgrades:', error);
		}
		
		// Load hats into GameEngine cache
		try {
			const { GameEngine } = await import('$lib/gameLogic/GameEngine.svelte.js');
			const gameEngine = GameEngine.getInstance();
			await gameEngine.loadHats();
		} catch (error) {
			console.error('Failed to load hats:', error);
		}
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={data.queryClient}>
	{@render children()}
</QueryClientProvider>
