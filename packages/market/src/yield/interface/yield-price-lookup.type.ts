import type { Db, DbError } from '@budgie/contracts';
import type * as Effect from 'effect/Effect';

export type YieldPriceLookupType = (day: string) => Effect.Effect<number | null, DbError, Db>;
