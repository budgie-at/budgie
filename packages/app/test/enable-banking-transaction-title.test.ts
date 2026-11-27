import { ExternalSourceEnum, PERSONAL_SYNC_ZONE, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { buildRecurringFormValuesFromTransaction } from '../src/recurring/utils/build-recurring-form-values-from-transaction.util';
import { getEnableBankingTransactionDisplayTitle } from '../src/transaction/utils/get-enable-banking-transaction-display-title.util';
import { isTransactionNoteDuplicated } from '../src/transaction/utils/is-transaction-note-duplicated.util';

vi.mock('@budgie/ledger', () => import('../../ledger/src/transaction/utils/get-transaction-category-entries.util'));
vi.mock('@budgie/sync', () => import('../../sync/src/enable-banking/utils/extract-enable-banking-card-merchant.util'));

describe('Enable Banking transaction display title', () => {
    it('uses the parsed merchant for an existing row whose title still equals its raw comment', () => {
        const rawComment = 'POS    42,10 AT K1  26.11. 16:07    SYNTHETIC SHOP WIEN 1030 040';

        expect(
            getEnableBankingTransactionDisplayTitle({
                externalSource: ExternalSourceEnum.ENABLE_BANKING,
                title: rawComment,
                comment: rawComment
            })
        ).toBe('SYNTHETIC SHOP WIEN 1030 040');
    });

    it('preserves custom titles and non-Enable Banking titles', () => {
        expect(
            getEnableBankingTransactionDisplayTitle({
                externalSource: ExternalSourceEnum.ENABLE_BANKING,
                title: 'My title',
                comment: 'POS 42,10 AT K1 26.11. 16:07 Merchant'
            })
        ).toBe('My title');
        expect(
            getEnableBankingTransactionDisplayTitle({
                externalSource: ExternalSourceEnum.MONOBANK,
                title: 'POS 42,10 AT K1 26.11. 16:07 Merchant',
                comment: 'POS 42,10 AT K1 26.11. 16:07 Merchant'
            })
        ).toBe('POS 42,10 AT K1 26.11. 16:07 Merchant');
    });

    it('keeps the raw bank note visible after shortening a legacy title', () => {
        const rawComment = 'POS 42,10 AT K1 26.11. 16:07 SYNTHETIC SHOP';
        const legacyTransaction = { title: rawComment, comment: rawComment, externalSource: ExternalSourceEnum.ENABLE_BANKING };

        expect(isTransactionNoteDuplicated(legacyTransaction)).toBe(false);
        expect(isTransactionNoteDuplicated({ ...legacyTransaction, externalSource: ExternalSourceEnum.MONOBANK })).toBe(true);
    });

    it('prefills the recurring series title with the displayed merchant', () => {
        const rawComment = 'POS 42,10 AT K1 26.11. 16:07 SYNTHETIC SHOP';
        const operatedAt = new Date('2026-11-26T16:07:00.000Z');

        const values = buildRecurringFormValuesFromTransaction(
            {
                id: 1,
                type: TransactionTypeEnum.EXPENSE,
                externalSource: ExternalSourceEnum.ENABLE_BANKING,
                title: rawComment,
                comment: rawComment,
                operatedAt,
                operatedWeekday: 4,
                operatedMinuteOfDay: 967,
                createdAt: operatedAt,
                updatedAt: operatedAt,
                deletedAt: null,
                syncId: 'legacy-card',
                syncZone: PERSONAL_SYNC_ZONE,
                externalId: 'card-1',
                fromAccountId: 1,
                toAccountId: null,
                fromAccount: null,
                toAccount: null,
                entries: [],
                transactionTags: [],
                debtEvents: [],
                exchangeRate: 1,
                receipt: null,
                importFingerprint: null,
                updatedBy: null,
                needsEmbedding: false,
                consolidationParentTransactionId: null,
                consolidationType: null,
                refundAutoPairDisabled: false,
                fundAccountId: null,
                yieldKind: null,
                yieldSourceAccountId: null
            },
            1
        );

        expect(values.title).toBe('SYNTHETIC SHOP');
    });
});
