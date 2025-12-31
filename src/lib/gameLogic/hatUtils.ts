import { GameEngine } from './GameEngine.svelte.js';

/**
 * Get the filepath for a hat by hatId
 * Queries from GameEngine's in-memory cache (loaded once from database)
 */
export function getHatFilepath(hatId: number | null | undefined): string | null {
	if (!hatId) return null;
	const gameEngine = GameEngine.getInstance();
	return gameEngine.getHatFilepath(hatId);
}

