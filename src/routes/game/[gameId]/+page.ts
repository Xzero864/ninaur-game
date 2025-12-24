import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { queryClient } = await parent();
	const gameId = params.gameId;

	if (!gameId) {
		return { gameId: null };
	}

	// Prefetch game data on the server
	await queryClient.prefetchQuery({
		queryKey: ['game', gameId],
		queryFn: async () => {
			const response = await fetch(`/api/games/${gameId}`);
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Game not found');
				}
				throw new Error('Failed to fetch game');
			}
			return response.json();
		}
	});

	return { gameId };
};
