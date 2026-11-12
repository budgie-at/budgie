import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';
import * as SqlClient from 'effect/sql/SqlClient';
import * as Statement from 'effect/sql/Statement';
import * as Stream from 'effect/Stream';

import { emptyFn } from '@rnw-community/shared';

import { storage } from './expo-file-system-fake';

import type * as SqlConnection from 'effect/sql/SqlConnection';

export const makeInertSqlClient = (onStatement: (sql: string) => void) =>
    Effect.gen(function* () {
        const noRows = (sql: string) =>
            Effect.sync(() => {
                onStatement(sql);

                return [];
            });
        const connection: SqlConnection.Connection = {
            execute: noRows,
            executeRaw: noRows,
            executeStream: () => Stream.empty,
            executeValues: noRows,
            executeValuesUnprepared: noRows,
            executeUnprepared: noRows
        };
        const connections = SqlClient.makeSqliteAcquirers({
            connection: Effect.succeed(connection),
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

export const inertSqlClient = makeInertSqlClient(emptyFn);

export const openSqliteFileClient = (filename: string) =>
    makeInertSqlClient(sql => {
        if (sql === 'PRAGMA journal_mode = DELETE') {
            storage.checkpoint(`documents/SQLite/${filename}`);
        }
    });
