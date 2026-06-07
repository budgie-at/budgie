import { REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import type { ConsolidationScanScopeInterface, TransactionEntityInterface } from '@budgie/contracts';

class ConsolidationScopeService {
    private static readonly SAFETY_MARGIN_RATIO = 0.2;
    private static readonly PADDING_MS = REFUND_TIME_WINDOW_SECONDS * (1 + ConsolidationScopeService.SAFETY_MARGIN_RATIO) * 1000;

    @Log(
        transactions => `enter transactionCount=${transactions.length}`,
        (result, transactions) =>
            `done transactionCount=${transactions.length} hasScope=${String(isNotEmptyArray(result?.transactionIds ?? []))} scopeIdCount=${result?.transactionIds.length ?? 0}`,
        (error, transactions) => `throw transactionCount=${transactions.length} error=${getErrorMessage(error)}`
    )
    buildFromTransactions(transactions: Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]): ConsolidationScanScopeInterface | null {
        if (!isNotEmptyArray(transactions)) {
            return null;
        }

        const transactionIds = [...new Set(transactions.map(transaction => transaction.id))];
        const operatedAtTimes = transactions.map(transaction => transaction.operatedAt.getTime());
        const operatedAtFrom = new Date(Math.min(...operatedAtTimes) - ConsolidationScopeService.PADDING_MS);
        const operatedAtTo = new Date(Math.max(...operatedAtTimes) + ConsolidationScopeService.PADDING_MS);

        return {
            operatedAtFrom,
            operatedAtTo,
            transactionIds
        };
    }

    @Log(
        (currentScope, nextScope) =>
            `enter currentIdCount=${currentScope.transactionIds.length} nextIdCount=${nextScope.transactionIds.length}`,
        (result, currentScope, nextScope) =>
            `done currentIdCount=${currentScope.transactionIds.length} nextIdCount=${nextScope.transactionIds.length} resultIdCount=${result.transactionIds.length}`,
        (error, currentScope, nextScope) =>
            `throw currentIdCount=${currentScope.transactionIds.length} nextIdCount=${nextScope.transactionIds.length} error=${getErrorMessage(error)}`
    )
    merge(currentScope: ConsolidationScanScopeInterface, nextScope: ConsolidationScanScopeInterface): ConsolidationScanScopeInterface {
        return {
            operatedAtFrom: new Date(Math.min(currentScope.operatedAtFrom.getTime(), nextScope.operatedAtFrom.getTime())),
            operatedAtTo: new Date(Math.max(currentScope.operatedAtTo.getTime(), nextScope.operatedAtTo.getTime())),
            transactionIds: [...new Set([...currentScope.transactionIds, ...nextScope.transactionIds])]
        };
    }
}

export const consolidationScopeService = new ConsolidationScopeService();
