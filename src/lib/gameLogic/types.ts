import { z } from 'zod';

// Base stats for a character
export interface Stats {
	health: number;
	maxHealth: number;
	attack: number;
}

// Shared enum for context types
export enum ContextType {
	ATTACK = 'attack',
	HEAL = 'heal',
	BUFF = 'buff',
	DEBUFF = 'debuff',
	DAMAGE = 'damage',
	TURN_START = 'turn_start',
	TURN_END = 'turn_end'
}

// Context types for modifiers and combat actions - discriminated union
export const AbilityContextSchema = z.discriminatedUnion('type', [
	z.object({
		type: z.literal(ContextType.ATTACK),
		target: z.string(), // character id
		damage: z.number()
	}),
	z.object({
		type: z.literal(ContextType.HEAL),
		target: z.string(), // character id
		amount: z.number()
	}),
	z.object({
		type: z.literal(ContextType.BUFF),
		target: z.string(), // character id
		stat: z.enum(['health', 'maxHealth', 'attack', 'speed']),
		value: z.number(),
		duration: z.number().optional()
	}),
	z.object({
		type: z.literal(ContextType.DEBUFF),
		target: z.string(), // character id
		stat: z.enum(['health', 'maxHealth', 'attack', 'speed']),
		value: z.number(),
		duration: z.number().optional()
	}),
	z.object({
		type: z.literal(ContextType.DAMAGE),
		target: z.string(), // character id
		damage: z.number(),
		source: z.string() // character id
	}),
	z.object({
		type: z.literal(ContextType.TURN_START),
		characterId: z.string()
	}),
	z.object({
		type: z.literal(ContextType.TURN_END),
		characterId: z.string()
	})
]);

export type AbilityContext = z.infer<typeof AbilityContextSchema>;

// Modifier trigger types - using the same ContextType enum
export type ModifierTrigger =
	| { type: ContextType.TURN_START }
	| { type: ContextType.TURN_END }
	| { type: ContextType.DAMAGE }
	| { type: ContextType.HEAL }
	| { type: ContextType.ATTACK }
	| { type: ContextType.BUFF }
	| { type: ContextType.DEBUFF }
	| { type: 'on_modifier_added' }
	| { type: 'permanent' };

// Modifier types
export type ModifierType = 'one_time' | 'on_trigger';
