import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';

export const logAndContinue = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.catchCause(effect, cause => (Cause.hasInterruptsOnly(cause) ? Effect.void : Effect.logError(cause)));
