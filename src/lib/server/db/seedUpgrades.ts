import { db } from './index.js';
import { upgrades } from './schema.js';
import { eq } from 'drizzle-orm';

type UpgradeDefinition = {
	id: string;
	name: string;
	description: string;
	cost: number;
	effect: {
		type: string;
		[key: string]: unknown;
	};
};

const upgradeDefinitions: UpgradeDefinition[] = [
	// Hat upgrades
	{
		id: 'hat_wizard',
		name: 'Wizard Hat',
		description: 'A magical hat that increases attack by 3',
		cost: 15,
		effect: {
			type: 'hat',
			hatId: 1,
			stat: 'attack',
			amount: 3
		}
	},
	{
		id: 'hat_crown',
		name: 'Crown',
		description: 'A regal crown that increases health by 25',
		cost: 20,
		effect: {
			type: 'hat',
			hatId: 2,
			stat: 'maxHealth',
			amount: 25
		}
	},
	{
		id: 'hat_cowboy',
		name: 'Cowboy Hat',
		description: 'A rugged hat that increases attack by 2 and health by 10',
		cost: 18,
		effect: {
			type: 'hat',
			hatId: 3,
			stat: 'balanced',
			attack: 2,
			health: 10
		}
	},
	{
		id: 'hat_beret',
		name: 'Beret',
		description: 'A stylish beret that increases attack by 4',
		cost: 22,
		effect: {
			type: 'hat',
			hatId: 4,
			stat: 'attack',
			amount: 4
		}
	},
	{
		id: 'hat_helmet',
		name: 'Helmet',
		description: 'A protective helmet that increases health by 30',
		cost: 25,
		effect: {
			type: 'hat',
			hatId: 5,
			stat: 'maxHealth',
			amount: 30
		}
	},
	{
		id: 'hat_party',
		name: 'Party Hat',
		description: 'A festive hat that increases attack by 1 and health by 15',
		cost: 12,
		effect: {
			type: 'hat',
			hatId: 6,
			stat: 'balanced',
			attack: 1,
			health: 15
		}
	},
	{
		id: 'hat_tophat',
		name: 'Top Hat',
		description: 'An elegant top hat that increases attack by 5',
		cost: 30,
		effect: {
			type: 'hat',
			hatId: 7,
			stat: 'attack',
			amount: 5
		}
	},
	{
		id: 'hat_cap',
		name: 'Baseball Cap',
		description: 'A casual cap that increases health by 20',
		cost: 10,
		effect: {
			type: 'hat',
			hatId: 8,
			stat: 'maxHealth',
			amount: 20
		}
	},
	{
		id: 'hat_rock',
		name: 'Rock Hat',
		description: 'A sturdy hat that heals 5 health whenever you take damage',
		cost: 25,
		effect: {
			type: 'hat',
			hatId: 9,
			stat: 'special', // Special effect, not a stat boost
			amount: 0
		}
	}
];

async function addUpgrade(upgradeDef: UpgradeDefinition) {
	const existing = await db
		.select()
		.from(upgrades)
		.where(eq(upgrades.id, upgradeDef.id))
		.limit(1);

	if (existing.length > 0) {
		console.log(`Upgrade ${upgradeDef.id} already exists, skipping...`);
		return existing[0];
	}

	const [upgrade] = await db
		.insert(upgrades)
		.values({
			id: upgradeDef.id,
			name: upgradeDef.name,
			description: upgradeDef.description,
			cost: upgradeDef.cost,
			effect: upgradeDef.effect
		})
		.returning();

	console.log(`Added upgrade: ${upgradeDef.name}`);
	return upgrade;
}

export async function addUpgrades(): Promise<void> {
	console.log('Seeding upgrades...');
	for (const upgradeDef of upgradeDefinitions) {
		await addUpgrade(upgradeDef);
	}
	console.log('Finished seeding upgrades');
}

