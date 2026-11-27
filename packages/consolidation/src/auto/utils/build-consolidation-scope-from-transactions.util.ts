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

    const [firstTransaction] = transactions;
    const transactionIdSet = new Set<number>();
    let minOperatedAtMs = firstTransaction.operatedAt.getTime();
    let maxOperatedAtMs = minOperatedAtMs;

    for (const transaction of transactions) {
        transactionIdSet.add(transaction.id);

        const operatedAtMs = transaction.operatedAt.getTime();

        if (operatedAtMs < minOperatedAtMs) {
            minOperatedAtMs = operatedAtMs;
        }

        if (operatedAtMs > maxOperatedAtMs) {
            maxOperatedAtMs = operatedAtMs;
        }
    }

    return {
        operatedAtFrom: new Date(minOperatedAtMs - PADDING_MS),
        operatedAtTo: new Date(maxOperatedAtMs + PADDING_MS),
        transactionIds: [...transactionIdSet]
    };
};
