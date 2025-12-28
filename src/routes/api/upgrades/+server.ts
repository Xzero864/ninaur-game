import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { upgrades } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const countParam = url.searchParams.get('count');
		const count = countParam ? parseInt(countParam, 10) : 5;

		// Get all upgrades
		const allUpgrades = await db.select().from(upgrades);

		// Shuffle and take random upgrades
		const shuffled = [...allUpgrades].sort(() => Math.random() - 0.5);
		const randomUpgrades = shuffled.slice(0, Math.min(count, allUpgrades.length));

		return json(randomUpgrades);
	} catch (error) {
		console.error('Error fetching upgrades:', error);
		return json({ error: 'Failed to fetch upgrades' }, { status: 500 });
	}
};

