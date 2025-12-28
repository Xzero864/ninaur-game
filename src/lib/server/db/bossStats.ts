import type { Stats } from '$lib/gameLogic/types.js';

/**
 * Calculate boss stats based on boss level
 * Health: 50 * level
 * Attack: 2 -> 6 -> 10, then +5 per level
 * Level 1: 2 attack
 * Level 2: 6 attack
 * Level 3: 10 attack
 * Level 4+: 10 + (level - 3) * 5
 */
export function getBossStats(level: number): Stats {
	let attack: number;
	if (level === 1) {
		attack = 2;
	} else if (level === 2) {
		attack = 6;
	} else if (level === 3) {
		attack = 10;
	} else {
		attack = 10 + (level - 3) * 5;
	}

	const health = level === 1 ? 1 : 50 * level;
	
	return {
		health: health,
		maxHealth: health,
		attack
	};
}

