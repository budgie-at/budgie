import { isDefined } from '@rnw-community/shared';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const buildConsolidationScanScopeSql = (
    scope: ConsolidationScanScopeInterface | null,
    operatedAtExpression: string,
    paddingSeconds = 0
): string => {
    if (!isDefined(scope)) {
        return '';
    }

    const operatedAtFromSeconds = Math.floor(scope.operatedAtFrom.getTime() / 1000) - paddingSeconds;
    const operatedAtToSeconds = Math.ceil(scope.operatedAtTo.getTime() / 1000) + paddingSeconds;

    return ` AND ${operatedAtExpression} BETWEEN ${operatedAtFromSeconds} AND ${operatedAtToSeconds}`;
};
