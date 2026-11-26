import { copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import * as Effect from 'effect/Effect';
import * as Semaphore from 'effect/Semaphore';
import * as Client from 'effect/sql/SqlClient';
import * as SqlError from 'effect/sql/SqlError';
import * as Statement from 'effect/sql/Statement';
import * as Stream from 'effect/Stream';

import { getErrorMessage, isArray, isDefined, isNotEmptyArray, isNumber, isString } from '@rnw-community/shared';

import type { BaselineSnapshotInterface } from './interface/baseline-snapshot.interface';
import type { DatabaseHandleInterface } from './interface/database-handle.interface';
import type * as Reactivity from 'effect/reactivity/Reactivity';
import type * as Scope from 'effect/Scope';
import type { Connection } from 'effect/sql/SqlConnection';
import type { SQLInputValue, StatementSync } from 'node:sqlite';

const BUSY_TIMEOUT_MS = 5_000;
const SINGLE_PERMIT = 1;
const SIDECAR_SUFFIXES = ['', '-wal', '-shm', '-journal'] as const;

let copySequence = 0;

const resetByClient = new WeakMap<Client.SqlClient, (snapshot: BaselineSnapshotInterface) => void>();

const configureDatabase = (database: DatabaseSync): void => {
    database.exec('PRAGMA foreign_keys = ON');
    database.exec(`PRAGMA busy_timeout = ${BUSY_TIMEOUT_MS}`);
};

const openDatabaseHandle = (snapshot?: BaselineSnapshotInterface): DatabaseHandleInterface => {
    if (!isDefined(snapshot)) {
        const database = new DatabaseSync(':memory:');

        configureDatabase(database);

        return { database, filePath: null };
    }

    if (isDefined(snapshot.buffer)) {
        const database = new DatabaseSync(':memory:');

        database.deserialize(snapshot.buffer);
        configureDatabase(database);

        return { database, filePath: null };
    }

    copySequence += 1;

    const filePath = join(tmpdir(), `budgie-test-db-${process.pid}-${copySequence}.sqlite`);

    copyFileSync(snapshot.path, filePath);

    const database = new DatabaseSync(filePath);

    database.exec('PRAGMA journal_mode = MEMORY');
    database.exec('PRAGMA synchronous = OFF');
    database.exec('PRAGMA temp_store = MEMORY');
    configureDatabase(database);

    return { database, filePath };
};

const closeDatabaseHandle = (handle: DatabaseHandleInterface): void => {
    handle.database.close();

    if (isDefined(handle.filePath)) {
        for (const suffix of SIDECAR_SUFFIXES) {
            rmSync(`${handle.filePath}${suffix}`, { force: true });
        }
    }
};

const hasErrcode = (cause: unknown): cause is Error & { readonly errcode: number; readonly code?: string } =>
    cause instanceof Error && 'errcode' in cause && isNumber(cause.errcode);

const toSqliteCause = (cause: unknown): unknown => {
    if (!hasErrcode(cause)) {
        return cause;
    }

    return Object.assign(new Error(cause.message, { cause }), { code: cause.code, errno: cause.errcode });
};

const isSqliteParam = (value: unknown): value is SQLInputValue =>
    value === null || isNumber(value) || typeof value === 'bigint' || isString(value) || ArrayBuffer.isView(value);

const toSqliteParams = (params: ReadonlyArray<unknown>): ReadonlyArray<SQLInputValue> => {
    if (!params.every(isSqliteParam)) {
        throw new TypeError('Unsupported SQLite parameter type');
    }

    return params;
};

const toSqliteError = (cause: unknown, operation: string): SqlError.SqlError =>
    SqlError.SqlError.make({
        reason: SqlError.classifySqliteError(toSqliteCause(cause), {
            message: getErrorMessage(cause),
            operation
        })
    });

export const resetInMemoryTestSqliteClient = (
    client: Client.SqlClient,
    getSnapshot: Effect.Effect<BaselineSnapshotInterface>
): Effect.Effect<boolean> =>
    Effect.gen(function* () {
        const reset = resetByClient.get(client);

        if (!isDefined(reset)) {
            return false;
        }

        reset(yield* getSnapshot);

        return true;
    });

export const makeInMemoryTestSqliteClient = (
    snapshot?: BaselineSnapshotInterface
): Effect.Effect<Client.SqlClient, SqlError.SqlError, Scope.Scope | Reactivity.Reactivity> =>
    Effect.gen(function* () {
        let currentHandle = yield* Effect.acquireRelease(
            Effect.sync(() => openDatabaseHandle(snapshot)),
            () =>
                Effect.sync(() => {
                    closeDatabaseHandle(currentHandle);
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
                    const statement = currentHandle.database.prepare(sql);

                    if (safeIntegers) {
                        statement.setReadBigInts(true);
                    }

                    return onPrepared(statement, toSqliteParams(params));
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
            isTransaction: () => currentHandle.database.isTransaction
        });

        const client = yield* Client.make({
            ...acquirers,
            compiler: Statement.makeCompilerSqlite(),
            beginTransaction: 'BEGIN IMMEDIATE',
            releaseSavepoint: name => `RELEASE SAVEPOINT ${name}`,
            driver: 'sqlite',
            spanAttributes: [['db.system', 'sqlite']]
        });

        resetByClient.set(client, nextSnapshot => {
            const nextHandle = openDatabaseHandle(nextSnapshot);
            const previousHandle = currentHandle;

            currentHandle = nextHandle;
            closeDatabaseHandle(previousHandle);
        });

        return client;
    });
