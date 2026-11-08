import * as Effect from 'effect/Effect';
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

export const inertSqlClient = Effect.gen(function* () {
    const connections = SqlClient.makeSqliteAcquirers({
        connection: Effect.succeed(inertConnection),
        semaphore: yield* Semaphore.make(1)
    });

    return yield* SqlClient.make({
        acquirer: connections.acquirer,
        borrower: connections.borrower,
        transactionAcquirer: connections.transactionAcquirer,
        onCommitFailure: connections.onCommitFailure,
        compiler: Statement.makeCompilerSqlite(),
        driver: 'inert',
        spanAttributes: []
    });
});
