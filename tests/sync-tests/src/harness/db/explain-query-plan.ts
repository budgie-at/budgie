import * as schema from '@app/@generic/drizzle/db/schema';
import { Db } from '@budgie/contracts';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as Effect from 'effect/Effect';

import { testDb } from '../scenario/setup';

interface QueryPlanStepInterface {
    readonly detail: string;
}

interface CapturedStatementInterface {
    readonly queryText: string;
    readonly params: readonly unknown[];
}

const explainStatement = ({ queryText, params }: CapturedStatementInterface): QueryPlanStepInterface[] => {
    const segments = queryText.split('?').map(segment => sql.raw(segment));
    const fragments = segments.flatMap((segment, index) => (index < params.length ? [segment, sql`${params[index]}`] : [segment]));

    return testDb.all<QueryPlanStepInterface>(sql`EXPLAIN QUERY PLAN ${sql.join(fragments, sql``)}`);
};

export const explainQueryPlan = Effect.fnUntraced(function* <A, E>(query: Effect.Effect<A, E, Db>) {
    const statements: CapturedStatementInterface[] = [];
    const capturingDb = drizzle(testDb.$client, {
        schema,
        logger: {
            logQuery: (queryText, params) => {
                statements.push({ queryText, params });
            }
        }
    });

    yield* query.pipe(Effect.provideService(Db, capturingDb));

    return statements.flatMap(explainStatement).map(step => step.detail);
});
