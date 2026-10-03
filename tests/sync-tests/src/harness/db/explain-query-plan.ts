import { makeTestDatabase } from '@budgie-at/test-kit';
import { Db } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

interface QueryPlanStepInterface {
    readonly detail: string;
}

export const explainQueryPlan = Effect.fnUntraced(function* <A, E>(query: Effect.Effect<A, E, Db>) {
    const statements: Array<readonly [string, ReadonlyArray<unknown> | undefined]> = [];
    const database = yield* makeTestDatabase(testDb.$client, (queryText, params) => statements.push([queryText, params]));

    yield* query.pipe(Effect.provideService(Db, database));

    const steps = yield* Effect.forEach(statements, ([queryText, params]) =>
        testDb.$client.unsafe<QueryPlanStepInterface>(`EXPLAIN QUERY PLAN ${queryText}`, params)
    );

    return steps.flat().map(step => step.detail);
});
