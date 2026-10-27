import { REFUND_TIME_WINDOW_SECONDS } from '@budgie/contracts';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { ConsolidationScanScopeInterface, TransactionEntityInterface } from '@budgie/contracts';

const SAFETY_MARGIN_RATIO = 0.2;
const PADDING_MS = REFUND_TIME_WINDOW_SECONDS * (1 + SAFETY_MARGIN_RATIO) * 1000;

export const buildConsolidationScopeFromTransactions = (
    transactions: Pick<TransactionEntityInterface, 'id' | 'operatedAt'>[]
): ConsolidationScanScopeInterface | null => {
    if (!isNotEmptyArray(transactions)) {
        return null;
    }

    const transactionIds = [...new Set(transactions.map(transaction => transaction.id))];
    const operatedAtTimes = transactions.map(transaction => transaction.operatedAt.getTime());
    const operatedAtFrom = new Date(Math.min(...operatedAtTimes) - PADDING_MS);
    const operatedAtTo = new Date(Math.max(...operatedAtTimes) + PADDING_MS);

    return {
        operatedAtFrom,
        operatedAtTo,
        transactionIds
    };
};
