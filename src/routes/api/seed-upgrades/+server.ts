import { json } from '@sveltejs/kit';
import { addUpgrades } from '$lib/server/db/seedUpgrades.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	try {
		await addUpgrades();
		return json({ success: true, message: 'Upgrades seeded successfully' });
	} catch (error) {
		console.error('Error seeding upgrades:', error);
		return json({ success: false, error: 'Failed to seed upgrades' }, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	try {
		await addUpgrades();
		return json({ success: true, message: 'Upgrades seeded successfully' });
	} catch (error) {
		console.error('Error seeding upgrades:', error);
		return json({ success: false, error: 'Failed to seed upgrades' }, { status: 500 });
	}
};

