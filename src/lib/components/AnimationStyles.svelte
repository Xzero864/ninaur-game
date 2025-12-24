<script lang="ts">
	import { AnimationEngine } from '$lib/gameLogic/animations/AnimationEngine.js';

	const animationEngine = AnimationEngine.getInstance();

	// Get all animation styles
	const styles = $derived(animationEngine.getAnimationStyles());
</script>

{@html styles}
