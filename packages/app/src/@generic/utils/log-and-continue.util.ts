import * as Effect from 'effect/Effect';

export const logAndContinue = <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.catchCause(effect, Effect.logError);
