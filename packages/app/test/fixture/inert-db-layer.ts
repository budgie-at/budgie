import { Db, makeEffectSqliteClientDatabase } from '@budgie/contracts';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Semaphore from 'effect/Semaphore';
import * as SqlClient from 'effect/sql/SqlClient';
import * as Statement from 'effect/sql/Statement';
import * as Stream from 'effect/Stream';

import type * as SqlConnection from 'effect/sql/SqlConnection';

const noRows = () => Effect.succeed([]);

const inertConnection: SqlConnection.Connection = {
    execute: noRows,
    executeRaw: noRows,
    executeStream: () => Stream.empty,
    executeValues: noRows,
    executeValuesUnprepared: noRows,
    executeUnprepared: noRows
};

export const inertDbLayer = Layer.effect(
    Db,
    Effect.gen(function* () {
        const connections = SqlClient.makeSqliteAcquirers({
            connection: Effect.succeed(inertConnection),
            semaphore: yield* Semaphore.make(1)
        });
        const client = yield* SqlClient.make({
            acquirer: connections.acquirer,
            borrower: connections.borrower,
            transactionAcquirer: connections.transactionAcquirer,
            onCommitFailure: connections.onCommitFailure,
            compiler: Statement.makeCompilerSqlite(),
            driver: 'inert',
            spanAttributes: []
        });
        const database = yield* makeEffectSqliteClientDatabase(client, { runQuery: identity });

        return withReplicas(database, [database]);
    })
).pipe(Layer.provide(Reactivity.layer));
