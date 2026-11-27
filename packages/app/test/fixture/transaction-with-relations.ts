import { PERSONAL_SYNC_ZONE, TransactionTypeEnum } from '@budgie/contracts';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const TIMESTAMP = new Date('2026-10-01T00:00:00Z');

export const buildTransaction = (
    overrides: Partial<TransactionWithRelationsEntityInterface> = {}
): TransactionWithRelationsEntityInterface => {
    const id = overrides.id ?? 1;

    return {
        id,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        deletedAt: null,
        syncId: `transaction-${id}`,
        syncZone: PERSONAL_SYNC_ZONE,
        type: TransactionTypeEnum.INCOME,
        title: 'Payout',
        externalId: null,
        operatedAt: TIMESTAMP,
        comment: '',
        toAccountId: null,
        fromAccountId: null,
        exchangeRate: 1,
        externalSource: null,
        updatedBy: null,
        needsEmbedding: false,
        importFingerprint: null,
        consolidationParentTransactionId: null,
        consolidationType: null,
        fundAccountId: null,
        yieldKind: null,
        yieldSourceAccountId: null,
        refundAutoPairDisabled: false,
        operatedWeekday: 4,
        operatedMinuteOfDay: 0,
        entries: [],
        debtEvents: [],
        fromAccount: null,
        toAccount: null,
        receipt: null,
        transactionTags: [],
        ...overrides
    };
};
