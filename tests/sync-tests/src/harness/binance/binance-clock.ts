import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

export const STALE_SYNC_AGE_MS = 5 * 60 * 1000;
export const RUN_DEADLINE_MS = 20 * 1000;

const DEADLINE_JUMP_MS = 40 * 1000;

export const advanceClock = (durationMs: number) => (): void => {
    vi.setSystemTime(Date.now() + durationMs);
};

export const jumpPastDeadline = advanceClock(DEADLINE_JUMP_MS);

export const restoreRealTimers = Effect.sync(() => vi.useRealTimers());
