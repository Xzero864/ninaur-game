import type { Stats } from '$lib/gameLogic/types.js';

/**
 * Calculate boss stats based on boss level
 * Health: level * 30
 * Attack: 30 * level
 */
export function getBossStats(level: number): Stats {
	return {
		health: 30 * level,
		maxHealth: 30 * level,
		attack: 30 * level
	};
}

