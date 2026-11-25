import { DatabaseSync } from 'node:sqlite';

import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';
import * as Client from 'effect/sql/SqlClient';
import * as SqlError from 'effect/sql/SqlError';
import * as Statement from 'effect/sql/Statement';
import * as Stream from 'effect/Stream';

import { getErrorMessage, isArray, isBoolean, isDefined, isNotEmptyArray, isNumber, isString } from '@rnw-community/shared';

import type * as Reactivity from 'effect/reactivity/Reactivity';
import type * as Scope from 'effect/Scope';
import type { Connection } from 'effect/sql/SqlConnection';
import type { SQLInputValue, StatementSync } from 'node:sqlite';

const BUSY_TIMEOUT_MS = 5_000;
const SINGLE_PERMIT = 1;

const databaseSyncByClient = new WeakMap<Client.SqlClient, DatabaseSync>();
const resetByClient = new WeakMap<Client.SqlClient, (snapshot: Uint8Array) => void>();

const openInMemoryDatabase = (snapshot?: Uint8Array): DatabaseSync => {
    const database = new DatabaseSync(':memory:');

    if (isDefined(snapshot)) {
        database.deserialize(snapshot);
    }

    database.exec('PRAGMA foreign_keys = ON');
    database.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}`);

    return database;
};

const hasErrcode = (cause: unknown): cause is Error & { readonly errcode: number; readonly code?: string } =>
    cause instanceof Error && 'errcode' in cause && isNumber(cause.errcode);

const toSqliteCause = (cause: unknown): unknown => {
    if (!hasErrcode(cause)) {
        return cause;
    }

    return Object.assign(new Error(cause.message, { cause }), { code: cause.code, errno: cause.errcode });
};

const toSqliteParam = (value: unknown): SQLInputValue => {
    if (!isDefined(value)) {
        return null;
    }

    if (isBoolean(value)) {
        return value ? 1 : 0;
    }

    if (isNumber(value) || typeof value === 'bigint' || isString(value)) {
        return value;
    }

    if (value instanceof Uint8Array || value instanceof DataView) {
        return value;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    return String(value);
};

const toSqliteError = (cause: unknown, operation: string): SqlError.SqlError =>
    SqlError.SqlError.make({
        reason: SqlError.classifySqliteError(toSqliteCause(cause), {
            message: getErrorMessage(cause),
            operation
        })
    });

export const getInMemoryDatabaseSync = (client: Client.SqlClient): DatabaseSync | undefined => databaseSyncByClient.get(client);

export const resetInMemoryTestSqliteClient = (client: Client.SqlClient, snapshot: Uint8Array): void => {
    const reset = resetByClient.get(client);

    if (isDefined(reset)) {
        reset(snapshot);
    }
};

export const makeInMemoryTestSqliteClient = (
    snapshot?: Uint8Array
): Effect.Effect<Client.SqlClient, SqlError.SqlError, Scope.Scope | Reactivity.Reactivity> =>
    Effect.gen(function* () {
        let currentDatabase = yield* Effect.acquireRelease(
            Effect.sync(() => openInMemoryDatabase(snapshot)),
            () =>
                Effect.sync(() => {
                    if (currentDatabase.isOpen) {
                        currentDatabase.close();
                    }
                })
        );

        const executeStatement = Effect.fnUntraced(function* <A>(
            sql: string,
            params: ReadonlyArray<unknown>,
            operation: string,
            onPrepared: (statement: StatementSync, sqliteParams: ReadonlyArray<SQLInputValue>) => A
        ) {
            const safeIntegers = yield* Client.SafeIntegers;

            return yield* Effect.try({
                try: () => {
                    const statement = currentDatabase.prepare(sql);

                    if (safeIntegers) {
                        statement.setReadBigInts(true);
                    }

                    return onPrepared(statement, params.map(toSqliteParam));
                },
                catch: cause => toSqliteError(cause, operation)
            });
        });

        const runRows = (
            sql: string,
            params: ReadonlyArray<unknown>,
            transformRows: (<A extends object>(row: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined,
            operation: string
        ) =>
            executeStatement(sql, params, operation, (statement, sqliteParams) => {
                if (isNotEmptyArray(statement.columns())) {
                    const rows = statement.all(...sqliteParams);

                    return isDefined(transformRows) ? transformRows(rows) : rows;
                }

                statement.run(...sqliteParams);

                return [];
            });

        const runValues = (sql: string, params: ReadonlyArray<unknown>, operation: string) =>
            executeStatement(sql, params, operation, (statement, sqliteParams) => {
                statement.setReturnArrays(true);

                if (isNotEmptyArray(statement.columns())) {
                    const rows: ReadonlyArray<unknown> = statement.all(...sqliteParams);

                    return rows.filter(isArray);
                }

                statement.run(...sqliteParams);

                return [];
            });

        const connection: Connection = {
            execute: (sql, params, transformRows) => runRows(sql, params, transformRows, 'execute'),
            executeRaw: (sql, params) =>
                executeStatement(sql, params, 'executeRaw', (statement, sqliteParams) =>
                    isNotEmptyArray(statement.columns()) ? statement.all(...sqliteParams) : statement.run(...sqliteParams)
                ),
            executeStream: (sql, params, transformRows) =>
                Stream.fromEffect(runRows(sql, params, transformRows, 'executeStream')).pipe(
                    Stream.flatMap(rows => Stream.fromIterable(rows))
                ),
            executeValues: (sql, params) => runValues(sql, params, 'executeValues'),
            executeValuesUnprepared: (sql, params) => runValues(sql, params, 'executeValuesUnprepared'),
            executeUnprepared: (sql, params, transformRows) => runRows(sql, params, transformRows, 'executeUnprepared')
        };

        const acquirers = Client.makeSqliteAcquirers({
            connection: Effect.succeed(connection),
            semaphore: Semaphore.makeUnsafe(SINGLE_PERMIT),
            isTransaction: () => currentDatabase.isTransaction
        });

        const client = yield* Client.make({
            ...acquirers,
            compiler: Statement.makeCompilerSqlite(),
            beginTransaction: 'BEGIN IMMEDIATE',
            releaseSavepoint: name => `RELEASE SAVEPOINT ${name}`,
            driver: 'sqlite',
            spanAttributes: [['db.system', 'sqlite']]
        });

        databaseSyncByClient.set(client, currentDatabase);
        resetByClient.set(client, nextSnapshot => {
            const nextDatabase = openInMemoryDatabase(nextSnapshot);
            const previousDatabase = currentDatabase;

            currentDatabase = nextDatabase;
            databaseSyncByClient.set(client, nextDatabase);

            if (previousDatabase.isOpen) {
                previousDatabase.close();
            }
        });

        return client;
    });
