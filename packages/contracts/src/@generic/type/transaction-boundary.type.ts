import type * as Effect from 'effect/Effect';

export type TransactionBoundaryType = <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
