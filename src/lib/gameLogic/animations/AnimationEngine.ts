/**
 * Animation Engine for handling character attack animations
 * Supports default animations and custom animations per character
 */

export type AttackDirection = 'up' | 'down' | 'left' | 'right';

export interface AttackAnimationConfig {
	distance: number;
	rotation: number;
	scale: number;
	duration: number;
	easing: string;
	// Optional image changes during animation
	imageChanges?: {
		[keyframe: number]: string; // keyframe percentage -> image URL
	};
}

export interface AttackAnimation {
	keyframes: string;
	className: string;
	getTransform: (direction: AttackDirection) => string;
	getImageAtKeyframe?: (keyframe: number) => string | null; // Returns image URL at specific keyframe, or null to use default
}

/**
 * Default attack animation configuration
 */
const DEFAULT_ATTACK_CONFIG: AttackAnimationConfig = {
	distance: 300, // Increased so characters actually touch
	rotation: 0, // No rotation/tilt
	scale: 1.3, // More dramatic scale
	duration: 1500, // Animation duration
	easing: 'ease-in-out'
};

/**
 * Get the transform string for a given attack direction
 */
function getAttackTransform(
	direction: AttackDirection,
	config: AttackAnimationConfig = DEFAULT_ATTACK_CONFIG
): string {
	const { distance, rotation, scale } = config;

	switch (direction) {
		case 'down':
			return `translate(0, ${distance}px) rotate(${rotation}deg) scale(${scale})`;
		case 'up':
			return `translate(0, -${distance}px) rotate(-${rotation}deg) scale(${scale})`;
		case 'right':
			return `translate(${distance}px, 0) rotate(${rotation}deg) scale(${scale})`;
		case 'left':
			return `translate(-${distance}px, 0) rotate(-${rotation}deg) scale(${scale})`;
		default:
			return `translate(0, ${distance}px) rotate(${rotation}deg) scale(${scale})`;
	}
}

/**
 * Generate CSS keyframes for attack animation
 */
function generateAttackKeyframes(config: AttackAnimationConfig = DEFAULT_ATTACK_CONFIG): string {
	return `
		@keyframes attack {
			0% {
				transform: translate(0, 0) rotate(0deg) scale(1);
			}
			50% {
				transform: var(--attack-transform);
			}
			100% {
				transform: translate(0, 0) rotate(0deg) scale(1);
			}
		}
	`;
}

/**
 * Generate CSS class for attack animation
 */
function generateAttackClass(config: AttackAnimationConfig = DEFAULT_ATTACK_CONFIG): string {
	return `
		.attacking {
			animation: attack ${config.duration}ms ${config.easing};
		}
	`;
}

/**
 * Default attack animation
 */
export const defaultAttackAnimation: AttackAnimation = {
	keyframes: generateAttackKeyframes(),
	className: 'attacking',
	getTransform: (direction: AttackDirection) => getAttackTransform(direction),
	getImageAtKeyframe: () => null // Default animation doesn't change images
};

/**
 * Animation Engine class
 * Manages animations for characters, allowing for default and custom animations
 */
export class AnimationEngine {
	private static instance: AnimationEngine | null = null;
	private customAnimations: Map<string, AttackAnimation> = new Map();

	private constructor() {
		// Private constructor for singleton
	}

	/**
	 * Get singleton instance
	 */
	public static getInstance(): AnimationEngine {
		if (!AnimationEngine.instance) {
			AnimationEngine.instance = new AnimationEngine();
		}
		return AnimationEngine.instance;
	}

	/**
	 * Register a custom animation for a character
	 * @param characterId - The character ID
	 * @param animation - The custom animation
	 */
	public registerCustomAnimation(characterId: string, animation: AttackAnimation): void {
		this.customAnimations.set(characterId, animation);
	}

	/**
	 * Create a custom animation with image changes
	 * @param config - Animation configuration including image changes
	 * @returns AttackAnimation with image change support
	 */
	public createAnimationWithImages(config: AttackAnimationConfig): AttackAnimation {
		const getImageAtKeyframe = config.imageChanges
			? (keyframe: number): string | null => {
					// Find the closest keyframe that's <= the current keyframe
					const imageChanges = config.imageChanges!;
					const sortedKeyframes = Object.keys(imageChanges)
						.map(Number)
						.sort((a, b) => b - a); // Sort descending

					for (const kf of sortedKeyframes) {
						if (keyframe >= kf) {
							return imageChanges[kf];
						}
					}
					return null; // No image change at this keyframe
				}
			: undefined;

		return {
			keyframes: generateAttackKeyframes(config),
			className: 'attacking',
			getTransform: (direction: AttackDirection) => getAttackTransform(direction, config),
			getImageAtKeyframe
		};
	}

	/**
	 * Get animation for a character (custom if available, otherwise default)
	 * @param characterId - The character ID
	 * @returns The attack animation to use
	 */
	public getAnimation(characterId?: string): AttackAnimation {
		if (characterId && this.customAnimations.has(characterId)) {
			return this.customAnimations.get(characterId)!;
		}
		return defaultAttackAnimation;
	}

	/**
	 * Get all CSS styles needed for animations
	 * Combines default and custom animation styles
	 */
	public getAnimationStyles(): string {
		let styles = '<style>\n';
		styles += defaultAttackAnimation.keyframes + '\n';
		styles += generateAttackClass() + '\n';

		// Add custom animation styles
		for (const [characterId, animation] of this.customAnimations.entries()) {
			styles += animation.keyframes + '\n';
			styles += animation.className.replace('.', `.${characterId}-`) + '\n';
		}

		styles += '</style>';
		return styles;
	}

	/**
	 * Clear all custom animations
	 */
	public clearCustomAnimations(): void {
		this.customAnimations.clear();
	}
}
