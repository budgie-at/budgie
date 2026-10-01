import type * as Effect from 'effect/Effect';

export interface EffectSqliteClientOptionsInterface {
    readonly onMutate: (tableNames: ReadonlyArray<string>) => Effect.Effect<void>;
    readonly runQuery: <A, E>(query: Effect.Effect<A, E>) => Effect.Effect<A, E>;
}
