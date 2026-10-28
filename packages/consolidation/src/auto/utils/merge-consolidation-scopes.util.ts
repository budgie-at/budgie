import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const mergeConsolidationScopes = (
    currentScope: ConsolidationScanScopeInterface,
    nextScope: ConsolidationScanScopeInterface
): ConsolidationScanScopeInterface => ({
    operatedAtFrom: new Date(Math.min(currentScope.operatedAtFrom.getTime(), nextScope.operatedAtFrom.getTime())),
    operatedAtTo: new Date(Math.max(currentScope.operatedAtTo.getTime(), nextScope.operatedAtTo.getTime())),
    transactionIds: [...new Set([...currentScope.transactionIds, ...nextScope.transactionIds])]
});
