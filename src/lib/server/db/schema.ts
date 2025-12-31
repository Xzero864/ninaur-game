import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { defineRelations } from 'drizzle-orm';
import type { Stats } from '$lib/gameLogic/types.js';

// Character types table
export const characterTypes = sqliteTable('character_types', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	imageUrl: text('image_url'),
	baseStats: text('base_stats', { mode: 'json' }).$type<Stats>().notNull(),
	hatX: integer('hat_x').notNull().default(48),
	hatY: integer('hat_y').notNull().default(32)
});

// Upgrades table
export const upgrades = sqliteTable('upgrades', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	description: text('description').notNull(),
	cost: integer('cost').notNull(),
	effect: text('effect', { mode: 'json' }).notNull() // Store upgrade effect data
});

// Characters table
export const characters = sqliteTable('characters', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type').$type<'hero' | 'enemy'>().notNull(),
	characterTypeId: integer('character_type_id')
		.references(() => characterTypes.id, { onDelete: 'cascade' })
		.notNull(),
	stats: text('stats', { mode: 'json' }).$type<Stats>().notNull(),
	level: integer('level').notNull().default(1),
	hatId: integer('hat_id')
});

// Games table
export const games = sqliteTable('games', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	characterIds: text('character_ids', { mode: 'json' }).$type<number[]>().notNull().default([]),
	bossLevel: integer('boss_level').notNull().default(1)
});

export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	age: integer('age')
});

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
export type CharacterType = typeof characterTypes.$inferSelect;
export type NewCharacterType = typeof characterTypes.$inferInsert;
export type Upgrade = typeof upgrades.$inferSelect;
export type NewUpgrade = typeof upgrades.$inferInsert;
export type Character = typeof characters.$inferSelect;
export type NewCharacter = typeof characters.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
