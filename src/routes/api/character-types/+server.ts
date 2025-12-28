import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { characterTypes } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import type { Stats } from '$lib/gameLogic/types.js';

const createCharacterTypeSchema = z.object({
	name: z.string().min(1),
	imageUrl: z.string().url().optional(),
	baseStats: z.object({
		health: z.number().min(1),
		maxHealth: z.number().min(1),
		attack: z.number().min(0)
	})
});

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const validatedData = createCharacterTypeSchema.parse(body);

		const [newCharacterType] = await db
			.insert(characterTypes)
			.values({
				name: validatedData.name,
				imageUrl: validatedData.imageUrl || null,
				baseStats: validatedData.baseStats
			})
			.returning();

		return json(newCharacterType, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return json({ error: 'Validation error', details: error.issues }, { status: 400 });
		}
		console.error('Error creating character type:', error);
		return json({ error: 'Failed to create character type' }, { status: 500 });
	}
};

export const GET: RequestHandler = async () => {
	try {
		const allCharacterTypes = await db.select().from(characterTypes);
		return json(allCharacterTypes);
	} catch (error) {
		console.error('Error fetching character types:', error);
		return json({ error: 'Failed to fetch character types' }, { status: 500 });
	}
};
