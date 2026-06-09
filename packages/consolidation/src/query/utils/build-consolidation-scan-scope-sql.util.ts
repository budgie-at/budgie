import { isDefined } from '@rnw-community/shared';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const buildConsolidationScanScopeSql = (scope: ConsolidationScanScopeInterface | null, operatedAtExpression: string): string => {
    if (!isDefined(scope)) {
        return '';
    }

    const operatedAtFromSeconds = Math.floor(scope.operatedAtFrom.getTime() / 1000);
    const operatedAtToSeconds = Math.ceil(scope.operatedAtTo.getTime() / 1000);

    return ` AND ${operatedAtExpression} BETWEEN ${operatedAtFromSeconds} AND ${operatedAtToSeconds}`;
};
