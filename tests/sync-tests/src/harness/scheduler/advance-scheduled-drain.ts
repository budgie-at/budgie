import * as Effect from 'effect/Effect';
import * as TestClock from 'effect/testing/TestClock';

const settleMs = 10;

export const advanceScheduledDrain = (drainDelayMs: number): Effect.Effect<void> =>
    Effect.andThen(TestClock.adjust(drainDelayMs), TestClock.withLive(Effect.sleep(settleMs)));
