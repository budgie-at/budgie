import { sql } from 'drizzle-orm';

import type { DatabaseValue } from '../type/database-value.type';

export const bindRawQuery = (query: string, params: DatabaseValue[] = []) => {
    const queryParts = query.split('?');
    const chunks = queryParts.flatMap((queryPart, index) => {
        const param = params[index];
        const isLastQueryPart = index === queryParts.length - 1;

        if (isLastQueryPart) {
            return [sql.raw(queryPart)];
        }

        return [sql.raw(queryPart), sql.param(param)];
    });

    return sql.join(chunks);
};
