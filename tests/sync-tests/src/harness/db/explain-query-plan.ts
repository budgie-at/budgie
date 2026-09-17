import { sql } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

import type { QueryPlanStepInterface } from './interface/query-plan-step.interface';
import type { ToSqlQueryInterface } from './interface/to-sql-query.interface';

export const explainQueryPlan = (query: ToSqlQueryInterface): QueryPlanStepInterface[] => {
    const { sql: queryText, params } = query.toSQL();
    const segments = queryText.split('?').map(segment => sql.raw(segment));
    const fragments = segments.flatMap((segment, index) => (index < params.length ? [segment, sql`${params[index]}`] : [segment]));

    return testDb.all<QueryPlanStepInterface>(sql`EXPLAIN QUERY PLAN ${sql.join(fragments, sql``)}`);
};
