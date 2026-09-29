import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';

import * as schema from '../../schema';
import { DbError } from '../error/db.error';

import type { DB } from '../type/db.type';

export class Db extends Context.Service<Db, DB>()('@budgie/contracts/Db') {
    private static readonly InTransaction = Context.Reference<boolean>('@budgie/contracts/Db/InTransaction', { defaultValue: () => false });

    private static readonly Rollback = new Error('Rollback');

    static query<A>(run: (db: DB) => PromiseLike<A>): Effect.Effect<A, DbError, Db> {
        return Effect.gen(function* () {
            const db = yield* Db;

            return yield* Effect.tryPromise({ try: () => run(db), catch: cause => new DbError({ cause }) });
        });
    }

    static transaction<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | DbError, R | Db> {
        return Effect.gen(function* () {
            if (yield* Db.InTransaction) {
                return yield* effect;
            }

            const db = yield* Db;
            const context = yield* Effect.context<R>();
            const outcome: { exit: Exit.Exit<A, E> | null } = { exit: null };

            yield* Effect.tryPromise({
                try: signal =>
                    db.$client.withExclusiveTransactionAsync(async expoTransaction => {
                        outcome.exit = await Effect.runPromiseExitWith(context)(
                            effect.pipe(
                                Effect.provideService(Db, drizzle(expoTransaction, { schema })),
                                Effect.provideService(Db.InTransaction, true)
                            ),
                            { signal }
                        );

                        if (Exit.isFailure(outcome.exit)) {
                            await Promise.reject(Db.Rollback);
                        }
                    }),
                catch: cause => new DbError({ cause })
            }).pipe(
                Effect.catchIf(
                    error => error.cause === Db.Rollback,
                    () => Effect.void
                )
            );

            return yield* outcome.exit ?? Effect.die(new Error('Transaction did not produce a result'));
        });
    }
}
