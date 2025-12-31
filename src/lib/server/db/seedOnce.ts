import { addCharacters } from './seedCharacters.js';
import { addUpgrades } from './seedUpgrades.js';

let seedPromise: Promise<void> | null = null;

/**
 * Seed the DB once per server process (concurrency-safe).
 * This prevents concurrent seed requests from racing and creating UNIQUE constraint errors.
 */
export function ensureSeededOnce(): Promise<void> {
	if (seedPromise) return seedPromise;

	seedPromise = (async () => {
		await addCharacters();
		await addUpgrades();
	})();

	return seedPromise;
}
