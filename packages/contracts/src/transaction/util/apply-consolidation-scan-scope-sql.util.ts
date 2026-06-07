import { buildConsolidationScanScopeSql } from './build-consolidation-scan-scope-sql.util';

import type { ConsolidationScanScopeInterface } from '../interface/consolidation-scan-scope.interface';

export const applyConsolidationScanScopeSql = (
    sql: string,
    scope: ConsolidationScanScopeInterface | null,
    scopeExpressions: ReadonlyMap<string, string>
): string => {
    let scopedSql = sql;

    scopeExpressions.forEach((operatedAtExpression, placeholder) => {
        scopedSql = scopedSql.replaceAll(placeholder, buildConsolidationScanScopeSql(scope, operatedAtExpression));
    });

    return scopedSql;
};
