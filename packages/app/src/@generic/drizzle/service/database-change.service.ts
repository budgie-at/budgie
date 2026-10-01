import { Db } from '@budgie/contracts';
import * as schema from '@budgie/contracts/schema';
import { getTableName } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import * as Context from 'effect/Context';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as FiberHandle from 'effect/FiberHandle';
import * as Layer from 'effect/Layer';
import * as PubSub from 'effect/PubSub';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Stream from 'effect/Stream';

import type { DbMutationInterface } from '@budgie/contracts';

export class DatabaseChangeService extends Context.Service<DatabaseChangeService>()('@budgie/app/DatabaseChangeService', {
    make: Effect.gen(function* () {
        const reactivity = yield* Reactivity.Reactivity;
        const changes = yield* PubSub.unbounded<ReadonlyArray<string>>();
        const changedTableNames = new Set<string>();
        const openTransactions = new Set<object>();
        const runFlush = yield* FiberHandle.runtime(yield* FiberHandle.make())();
        const deleteDependents = new Map<string, string[]>();

        Object.values(schema).forEach(table => {
            getTableConfig(table)
                .foreignKeys.filter(foreignKey => foreignKey.onDelete === 'cascade' || foreignKey.onDelete === 'set null')
                .forEach(foreignKey => {
                    const parentTableName = getTableName(foreignKey.reference().foreignTable);

                    deleteDependents.set(parentTableName, [...(deleteDependents.get(parentTableName) ?? []), getTableName(table)]);
                });
        });

        const addChangedTable = (tableName: string, isDelete: boolean): void => {
            if (changedTableNames.has(tableName)) {
                return;
            }

            changedTableNames.add(tableName);

            if (isDelete) {
                deleteDependents.get(tableName)?.forEach(dependentTableName => {
                    addChangedTable(dependentTableName, isDelete);
                });
            }
        };

        const flush = Effect.suspend(() => {
            if (openTransactions.size > 0 || changedTableNames.size === 0) {
                return Effect.void;
            }

            const tableNames = [...changedTableNames];
            changedTableNames.clear();

            return Effect.andThen(reactivity.invalidate(tableNames), PubSub.publish(changes, tableNames));
        });

        return {
            changes: Stream.fromPubSub(changes),
            record: (mutation: DbMutationInterface) =>
                Effect.sync(() => {
                    mutation.tables.forEach(tableName => {
                        addChangedTable(tableName, mutation.type === 'delete');
                    });
                    runFlush(Effect.andThen(Effect.sleep(Duration.millis(50)), flush), { onlyIfMissing: true });
                }),
            transactionBoundary: Db.TransactionBoundary.of(effect =>
                Effect.acquireUseRelease(
                    Effect.sync(() => {
                        const transaction = {};
                        openTransactions.add(transaction);

                        return transaction;
                    }),
                    () => effect,
                    transaction =>
                        Effect.andThen(
                            Effect.sync(() => openTransactions.delete(transaction)),
                            flush
                        )
                )
            )
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseChangeService, DatabaseChangeService.make);
}
