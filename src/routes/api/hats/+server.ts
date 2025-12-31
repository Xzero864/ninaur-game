import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { upgrades } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Get all hat upgrades
		const allUpgrades = await db.select().from(upgrades);
		const hatUpgrades = allUpgrades.filter((u) => {
			const effect = u.effect as { type?: string };
			return effect.type === 'hat';
		});

		return json(hatUpgrades);
	} catch (error) {
		console.error('Error fetching hats:', error);
		return json({ error: 'Failed to fetch hats' }, { status: 500 });
	}
};

