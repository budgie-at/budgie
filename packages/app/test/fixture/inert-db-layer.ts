import { Db, makeEffectSqliteClientDatabase } from '@budgie/contracts';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { inertSqlClient } from './inert-sql-client';

export const inertDbLayer = Layer.effect(
    Db,
    Effect.gen(function* () {
        const client = yield* inertSqlClient;
        const database = yield* makeEffectSqliteClientDatabase(client, { runQuery: identity });

        return withReplicas(database, [database]);
    })
).pipe(Layer.provide(Reactivity.layer));
