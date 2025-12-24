import { z } from 'zod';
import { ContextType } from '../types.js';

// JSON-serializable ability definition
export interface AbilityDefinition {
	id: string;
	name: string;
	description: string;
	contextType: ContextType;
	cooldown?: number;
}

// Zod schema for validation
export const AbilityDefinitionSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	contextType: z.nativeEnum(ContextType),
	cooldown: z.number().optional()
});

// Type for execute functions - abilities produce modifiers
export type AbilityExecuteFunction = (
	context: import('../types.js').AbilityContext
) => import('./Modifier.js').Modifier | import('./Modifier.js').Modifier[];

