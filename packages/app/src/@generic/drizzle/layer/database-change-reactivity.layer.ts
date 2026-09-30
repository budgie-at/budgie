import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as FiberHandle from 'effect/FiberHandle';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { addDatabaseChangeListener } from 'expo-sqlite';

export const databaseChangeReactivityLayer = Layer.effect(
    Db.TransactionBoundary,
    Effect.gen(function* () {
        const reactivity = yield* Reactivity.Reactivity;
        const changedTableNames = new Set<string>();
        const openTransactions = new Set<object>();
        const runFlush = yield* FiberHandle.runtime(yield* FiberHandle.make())();

        const flush = Effect.suspend(() => {
            if (openTransactions.size > 0 || changedTableNames.size === 0) {
                return Effect.void;
            }

            const tableNames = [...changedTableNames];
            changedTableNames.clear();

            return reactivity.invalidate(tableNames);
        });

        yield* Effect.acquireRelease(
            Effect.sync(() =>
                addDatabaseChangeListener(event => {
                    changedTableNames.add(event.tableName);
                    runFlush(Effect.andThen(Effect.sleep('50 millis'), flush), { onlyIfMissing: true });
                })
            ),
            subscription => Effect.sync(() => subscription.remove())
        );

        return Db.TransactionBoundary.of(effect =>
            Effect.acquireUseRelease(
                Effect.sync(() => {
                    const transaction = {};
                    openTransactions.add(transaction);

                    return transaction;
                }),
                () => reactivity.withBatch(effect),
                transaction =>
                    Effect.andThen(
                        Effect.sync(() => openTransactions.delete(transaction)),
                        flush
                    )
            )
        );
    })
);
