import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, fetch }) => {
	const { queryClient } = await parent();

	// Prefetch games data on the server
	await queryClient.prefetchQuery({
		queryKey: ['games'],
		queryFn: async () => {
			const response = await fetch('/api/games');
			if (!response.ok) {
				throw new Error('Failed to fetch games');
			}
			return response.json();
		}
	});
};
