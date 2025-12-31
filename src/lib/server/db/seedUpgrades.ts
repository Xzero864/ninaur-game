import { db } from './index.js';
import { upgrades } from './schema.js';

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
	// Hat upgrades - all hats from static/hats folder
	{
		id: 'hat_wizard',
		name: 'Wizard Hat',
		description: 'A magical hat that increases attack by 3',
		cost: 15,
		effect: {
			type: 'hat',
			hatId: 1,
			filepath: '/hats/wizard-hat.png',
			stat: 'attack',
			amount: 3
		}
	},
	{
		id: 'hat_tophat',
		name: 'Top Hat',
		description: 'An elegant top hat that increases attack by 5',
		cost: 30,
		effect: {
			type: 'hat',
			hatId: 2,
			filepath: '/hats/top-hat.png',
			stat: 'attack',
			amount: 5
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
			filepath: '/hats/cowboy-hat.png',
			stat: 'balanced',
			attack: 2,
			health: 10
		}
	},
	{
		id: 'hat_blue_baseball',
		name: 'Blue Baseball Hat',
		description: 'A casual blue cap that increases health by 20',
		cost: 10,
		effect: {
			type: 'hat',
			hatId: 4,
			filepath: '/hats/blue-baseball-hat.png',
			stat: 'maxHealth',
			amount: 20
		}
	},
	{
		id: 'hat_red_baseball',
		name: 'Red Baseball Hat',
		description: 'A casual red cap that increases health by 20',
		cost: 10,
		effect: {
			type: 'hat',
			hatId: 5,
			filepath: '/hats/red-baseball-hat.png',
			stat: 'maxHealth',
			amount: 20
		}
	},
	{
		id: 'hat_bunny_ears',
		name: 'Bunny Ears',
		description: 'Cute bunny ears that increase attack by 2',
		cost: 12,
		effect: {
			type: 'hat',
			hatId: 6,
			filepath: '/hats/bunny-ears.png',
			stat: 'attack',
			amount: 2
		}
	},
	{
		id: 'hat_propeller',
		name: 'Propeller Hat',
		description: 'A fun propeller hat that increases attack by 3',
		cost: 15,
		effect: {
			type: 'hat',
			hatId: 7,
			filepath: '/hats/propeller-hat.png',
			stat: 'attack',
			amount: 3
		}
	},
	{
		id: 'hat_pink_bow',
		name: 'Pretty Pink Bow',
		description: 'A pretty pink bow that increases health by 15',
		cost: 12,
		effect: {
			type: 'hat',
			hatId: 8,
			filepath: '/hats/pretty-pink-bow.png',
			stat: 'maxHealth',
			amount: 15
		}
	},
	{
		id: 'hat_puke_penguin',
		name: 'Puke Penguin Hat',
		description: 'A puke penguin hat that increases health by 25',
		cost: 20,
		effect: {
			type: 'hat',
			hatId: 9,
			filepath: '/hats/puke-penguin-hat.png',
			stat: 'maxHealth',
			amount: 25
		}
	},
	{
		id: 'hat_blue_penguin',
		name: 'Blue Penguin Hat',
		description: 'A blue penguin hat that increases health by 25',
		cost: 20,
		effect: {
			type: 'hat',
			hatId: 10,
			filepath: '/hats/blue-penguin-hat.png',
			stat: 'maxHealth',
			amount: 25
		}
	},
	{
		id: 'hat_christmas',
		name: 'Christmas Hat',
		description: 'A festive Christmas hat that increases attack by 2 and health by 10',
		cost: 18,
		effect: {
			type: 'hat',
			hatId: 11,
			filepath: '/hats/christmas-hat.png',
			stat: 'balanced',
			attack: 2,
			health: 10
		}
	},
	{
		id: 'hat_dove',
		name: 'Dove Hat',
		description: 'A dove hat that increases attack by 3',
		cost: 15,
		effect: {
			type: 'hat',
			hatId: 12,
			filepath: '/hats/dove-hat.png',
			stat: 'attack',
			amount: 3
		}
	},
	{
		id: 'hat_small_red_bird',
		name: 'Small Red Bird',
		description: 'A small red bird hat that increases attack by 2',
		cost: 12,
		effect: {
			type: 'hat',
			hatId: 13,
			filepath: '/hats/small-red-bird.png',
			stat: 'attack',
			amount: 2
		}
	},
	{
		id: 'hat_hard_hat',
		name: 'Hard Hat',
		description: 'A protective hard hat that increases health by 30',
		cost: 25,
		effect: {
			type: 'hat',
			hatId: 14,
			filepath: '/hats/hard-hat.png',
			stat: 'maxHealth',
			amount: 30
		}
	},
	{
		id: 'hat_leprechaun',
		name: 'Leprechaun Hat',
		description: 'A lucky leprechaun hat that increases attack by 4',
		cost: 22,
		effect: {
			type: 'hat',
			hatId: 15,
			filepath: '/hats/leprechaun.png',
			stat: 'attack',
			amount: 4
		}
	},
	{
		id: 'hat_dude',
		name: 'Dude Hat',
		description: 'A cool dude hat that increases attack by 3 and health by 15',
		cost: 20,
		effect: {
			type: 'hat',
			hatId: 16,
			filepath: '/hats/dude-hat.png',
			stat: 'balanced',
			attack: 3,
			health: 15
		}
	}
];

export async function addUpgrades(): Promise<void> {
	console.log('Seeding upgrades...');
	
	// Delete all existing upgrades to start fresh
	await db.delete(upgrades);
	console.log('Cleared existing upgrades');
	
	// Insert all upgrades from definitions
	const insertedUpgrades = await db
		.insert(upgrades)
		.values(
			upgradeDefinitions.map((upgradeDef) => ({
				id: upgradeDef.id,
				name: upgradeDef.name,
				description: upgradeDef.description,
				cost: upgradeDef.cost,
				effect: upgradeDef.effect
			}))
		)
		.returning();
	
	console.log(`Added ${insertedUpgrades.length} upgrades`);
	console.log('Finished seeding upgrades');
}

