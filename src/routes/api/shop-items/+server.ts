import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index.js';
import { upgrades, characterTypes } from '$lib/server/db/schema.js';
import type { RequestHandler } from './$types';

type ShopItem = 
	| {
			type: 'character';
			characterType: {
				id: number;
				name: string;
				imageUrl: string | null;
				baseStats: {
					health: number;
					maxHealth: number;
					attack: number;
				};
			};
			cost: number;
	  }
	| {
			type: 'hat';
			hat: {
				id: string;
				name: string;
				description: string;
				hatId: number;
				effect: {
					type: string;
					[key: string]: unknown;
				};
			};
			cost: number;
	  };

export const GET: RequestHandler = async () => {
	try {
		console.log('Shop items endpoint called');
		
		// Get all character types (excluding Boss)
		const allCharacterTypesRaw = await db.select().from(characterTypes);
		console.log('Character types found:', allCharacterTypesRaw.length);
		const allCharacterTypes = allCharacterTypesRaw.filter((ct) => ct.name !== 'Boss');
		console.log('Character types (excluding Boss):', allCharacterTypes.length);

		// Get all hat upgrades
		const allUpgrades = await db.select().from(upgrades);
		console.log('All upgrades found:', allUpgrades.length);
		const hatUpgrades = allUpgrades.filter((u) => {
			const effect = u.effect as { type?: string };
			return effect.type === 'hat';
		});
		console.log('Hat upgrades found:', hatUpgrades.length);

		if (allCharacterTypes.length === 0) {
			console.error('No character types available');
			return json({ error: 'No character types available. Please seed characters first.' }, { status: 500 });
		}

		if (hatUpgrades.length === 0) {
			console.error('No hat upgrades available');
			return json({ error: 'No hat upgrades available. Please seed upgrades first.' }, { status: 500 });
		}

		// Create 5 random items (either character OR hat)
		const items: ShopItem[] = [];
		for (let i = 0; i < 5; i++) {
			const isCharacter = Math.random() < 0.5; // 50% chance of character or hat
			
			if (isCharacter) {
				// Pick random character type
				const randomCharType =
					allCharacterTypes[Math.floor(Math.random() * allCharacterTypes.length)];
				
				items.push({
					type: 'character',
					characterType: {
						id: randomCharType.id,
						name: randomCharType.name,
						imageUrl: randomCharType.imageUrl,
						baseStats: randomCharType.baseStats
					},
					cost: 1
				});
			} else {
				// Pick random hat
				const randomHat = hatUpgrades[Math.floor(Math.random() * hatUpgrades.length)];
				const hatEffect = randomHat.effect as { hatId?: number };
				
				items.push({
					type: 'hat',
					hat: {
						id: randomHat.id,
						name: randomHat.name,
						description: randomHat.description,
						hatId: hatEffect.hatId || 0,
						effect: randomHat.effect as { type: string; [key: string]: unknown }
					},
					cost: 1
				});
			}
		}

		console.log('Returning', items.length, 'shop items');
		return json(items);
	} catch (error) {
		console.error('Error fetching shop items:', error);
		return json({ error: 'Failed to fetch shop items', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
	}
};

