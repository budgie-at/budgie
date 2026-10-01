import { Db, makeEffectSqliteClientDatabase } from '@budgie/contracts';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';

import { testDb } from '../scenario/setup';

interface QueryPlanStepInterface {
    readonly detail: string;
}

interface CapturedStatementInterface {
    readonly queryText: string;
    readonly params: ReadonlyArray<unknown> | undefined;
}

export const explainQueryPlan = Effect.fnUntraced(function* <A, E>(query: Effect.Effect<A, E, Db>) {
    const statements: CapturedStatementInterface[] = [];
    const capturingClient = new Proxy(testDb.$client, {
        get: (target, property, receiver) =>
            property === 'unsafe'
                ? (queryText: string, params?: ReadonlyArray<unknown>) => {
                      statements.push({ queryText, params });

                      return target.unsafe(queryText, params);
                  }
                : Reflect.get(target, property, receiver)
    });
    const capturingPrimary = yield* makeEffectSqliteClientDatabase(capturingClient, { onMutate: () => Effect.void, runQuery: identity });

    yield* query.pipe(Effect.provideService(Db, withReplicas(capturingPrimary, [capturingPrimary])));

    const steps = yield* Effect.forEach(statements, ({ queryText, params }) =>
        testDb.$client.unsafe<QueryPlanStepInterface>(`EXPLAIN QUERY PLAN ${queryText}`, params)
    );

    return steps.flat().map(step => step.detail);
});
