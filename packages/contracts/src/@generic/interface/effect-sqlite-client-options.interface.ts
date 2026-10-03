import type { DbMutationInterface } from './db-mutation.interface';
import type * as Effect from 'effect/Effect';

export interface EffectSqliteClientOptionsInterface {
    readonly onMutate?: (mutation: DbMutationInterface) => Effect.Effect<void>;
    readonly runQuery: <A, E>(query: Effect.Effect<A, E>) => Effect.Effect<A, E>;
}
