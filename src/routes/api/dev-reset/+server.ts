import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { characters, characterTypes, games, upgrades } from '$lib/server/db/schema.js';
import { addCharacters } from '$lib/server/db/seedCharacters.js';
import { addUpgrades } from '$lib/server/db/seedUpgrades.js';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	try {
		// Wipe everything (dev-only). Order matters due to FKs.
		await db.delete(games);
		await db.delete(characters);
		await db.delete(characterTypes);
		await db.delete(upgrades);

		// Reseed core content
		const seededCharacterTypes = await addCharacters();
		await addUpgrades();

		return json(
			{
				success: true,
				message: 'Database wiped + reseeded (dev)',
				characterTypesSeeded: seededCharacterTypes.length
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error dev-resetting database:', error);
		return json({ success: false, error: 'Failed to dev reset database' }, { status: 500 });
	}
};
