import type { EffectDrizzleQueryError, QueryEffectHKTBase } from 'drizzle-orm/effect-core';

export interface DbQueryEffectHKTInterface extends QueryEffectHKTBase {
    readonly error: EffectDrizzleQueryError;
    readonly context: never;
}
