import { pgTable, serial, integer, text, varchar, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { defineRelations } from 'drizzle-orm';
import type { Stats } from '$lib/gameLogic/types.js';

// Context type enum for database (using string values)
export const contextTypeEnum = pgEnum('context_type', [
	'attack',
	'heal',
	'buff',
	'debuff',
	'damage',
	'turn_start',
	'turn_end'
]);

// Character type enum
export const characterTypeEnum = pgEnum('character_type', ['hero', 'enemy']);

// Abilities table
export const abilities = pgTable('abilities', {
	id: varchar('id', { length: 255 }).primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	contextType: contextTypeEnum('context_type').notNull(),
	cooldown: integer('cooldown')
});

// Character types table
export const characterTypes = pgTable('character_types', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	imageUrl: text('image_url'),
	levelTwoAbilityId: text('level_two_ability_id'),
	levelThreeAbilityId: text('level_three_ability_id'),
	baseStats: jsonb('base_stats').$type<Stats>().notNull()
});

// Characters table
export const characters = pgTable('characters', {
	id: serial('id').primaryKey(),
	type: characterTypeEnum('type').notNull(),
	characterTypeId: integer('character_type_id')
		.references(() => characterTypes.id, { onDelete: 'cascade' })
		.notNull(),
	stats: jsonb('stats').$type<Stats>().notNull(),
	level: integer('level').notNull().default(1)
});

// Games table
export const games = pgTable('games', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	characterIds: jsonb('character_ids').$type<number[]>().notNull().default([]),
	bossLevel: integer('boss_level').notNull().default(1)
});

export const user = pgTable('user', { id: serial('id').primaryKey(), age: integer('age') });

// Relations using defineRelations (after all tables are defined)
export const relations = defineRelations({ characterTypes, characters }, (r) => ({
	characterTypes: {
		characters: r.many.characters()
	},
	characters: {
		characterType: r.one.characterTypes({
			from: r.characters.characterTypeId,
			to: r.characterTypes.id
		})
	}
}));

// Type exports for database tables
export type Ability = typeof abilities.$inferSelect;
export type NewAbility = typeof abilities.$inferInsert;
export type CharacterType = typeof characterTypes.$inferSelect;
export type NewCharacterType = typeof characterTypes.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
