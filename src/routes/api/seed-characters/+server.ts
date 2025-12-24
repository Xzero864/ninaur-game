import { json } from '@sveltejs/kit';
import { addCharacters } from '$lib/server/db/seedCharacters.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	try {
		const characterTypes = await addCharacters();
		return json({ 
			message: 'Characters seeded successfully',
			count: characterTypes.length,
			characterTypes 
		}, { status: 201 });
	} catch (error) {
		console.error('Error seeding characters:', error);
		return json({ error: 'Failed to seed characters' }, { status: 500 });
	}
};

