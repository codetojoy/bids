/**
 * Seedable PRNG (mulberry32). All randomness in the domain flows through an `Rng`
 * so a game is reproducible from its seed and every test is deterministic.
 */

export interface Rng {
	/** Next float in [0, 1). */
	next(): number;
	/** Next integer in [0, max). */
	nextInt(max: number): number;
}

export function makeRng(seed: number): Rng {
	let state = seed >>> 0;
	const next = () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	return {
		next,
		nextInt(max: number) {
			if (max <= 0) throw new Error(`nextInt requires max > 0, got ${max}`);
			return Math.floor(next() * max);
		}
	};
}

/** A seed for a fresh game. Not part of the deterministic path — callers may pass their own. */
export function randomSeed(): number {
	return Math.floor(Math.random() * 0xffffffff) >>> 0;
}
