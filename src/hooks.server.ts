import type { Handle } from '@sveltejs/kit';
import { ensureSeededOnce } from '$lib/server/db/seedOnce.js';

export const handle: Handle = async ({ event, resolve }) => {
	// Seed once per server process before handling any requests.
	await ensureSeededOnce();
	return resolve(event);
};
