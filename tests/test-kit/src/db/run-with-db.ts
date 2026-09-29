import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import type { DB } from '@budgie/contracts';

export const runWithDb =
    (db: DB) =>
    <A, E>(effect: Effect.Effect<A, E, Db>): Promise<A> =>
        Effect.runPromise(effect.pipe(Effect.provideService(Db, db)));
