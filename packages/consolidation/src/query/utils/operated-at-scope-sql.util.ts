import { buildConsolidationScanScopeSql } from './build-consolidation-scan-scope-sql.util';

import type { ScopedSqlType } from '../type/scoped-sql.type';

export const operatedAtScopeSql =
    (operatedAtExpression: string, paddingSeconds = 0): ScopedSqlType =>
    scope =>
        buildConsolidationScanScopeSql(scope, operatedAtExpression, paddingSeconds);
