import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';

import { DbError } from '../error/db.error';

import type { DbMutationInterface } from '../interface/db-mutation.interface';
import type { DB } from '../type/db.type';
import type { TransactionBoundaryType } from '../type/transaction-boundary.type';

export class Db extends Context.Service<Db, DB>()('@budgie/contracts/Db') {
    static readonly TransactionBoundary = Context.Reference<TransactionBoundaryType>('@budgie/contracts/Db/TransactionBoundary', {
        defaultValue: () => effect => effect
    });

    static query<A, E>(run: (db: DB) => Effect.Effect<A, E>): Effect.Effect<A, DbError, Db> {
        return Db.use(db => run(db).pipe(Effect.mapError(cause => new DbError({ cause }))));
    }

    static mutation<A, E, R>(mutation: DbMutationInterface, effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R | Db> {
        return Effect.ensuring(
            effect,
            Db.use(db => db.$onMutate(mutation))
        );
    }

    static transaction<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | DbError, R | Db> {
        return Effect.gen(function* () {
            const db = yield* Db;

            if (Option.isSome(yield* Effect.serviceOption(db.$client.transactionService))) {
                return yield* effect;
            }

            const transactionBoundary = yield* Db.TransactionBoundary;

            return yield* transactionBoundary(
                db.$client
                    .withTransaction(Effect.provideService(effect, Db, withReplicas(db.$primary, [db.$primary])))
                    .pipe(Effect.catchTag('SqlError', cause => Effect.fail(new DbError({ cause }))))
            );
        });
    }
}
