import { describe, expect, it } from '@effect/vitest';

import { TransactionTypeEnum } from '../src/transaction/enum/transaction-type.enum';
import { YieldKindEnum } from '../src/transaction/enum/yield-kind.enum';
import { normalizeYieldFields } from '../src/transaction/utils/normalize-yield-fields.util';

const SOURCE_ACCOUNT_ID = 7;

describe('normalizeYieldFields', () => {
    it.each([
        [TransactionTypeEnum.INCOME, YieldKindEnum.STAKING, { yieldKind: YieldKindEnum.STAKING, yieldSourceAccountId: SOURCE_ACCOUNT_ID }],
        [
            TransactionTypeEnum.INCOME,
            YieldKindEnum.DIVIDEND,
            { yieldKind: YieldKindEnum.DIVIDEND, yieldSourceAccountId: SOURCE_ACCOUNT_ID }
        ],
        [TransactionTypeEnum.INCOME, YieldKindEnum.TAX, { yieldKind: null, yieldSourceAccountId: null }],
        [TransactionTypeEnum.INCOME, YieldKindEnum.NONE, { yieldKind: YieldKindEnum.NONE, yieldSourceAccountId: null }],
        [TransactionTypeEnum.EXPENSE, YieldKindEnum.TAX, { yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: SOURCE_ACCOUNT_ID }],
        [TransactionTypeEnum.EXPENSE, YieldKindEnum.NONE, { yieldKind: YieldKindEnum.NONE, yieldSourceAccountId: null }],
        [TransactionTypeEnum.EXPENSE, YieldKindEnum.INTEREST, { yieldKind: null, yieldSourceAccountId: null }],
        [TransactionTypeEnum.TRANSFER, YieldKindEnum.STAKING, { yieldKind: null, yieldSourceAccountId: null }],
        [TransactionTypeEnum.ADJUSTMENT, YieldKindEnum.NONE, { yieldKind: null, yieldSourceAccountId: null }],
        [TransactionTypeEnum.DEBT, YieldKindEnum.INTEREST, { yieldKind: null, yieldSourceAccountId: null }]
    ])('normalizes %s with %s', (type, yieldKind, expected) => {
        expect(normalizeYieldFields(type, yieldKind, SOURCE_ACCOUNT_ID)).toEqual(expected);
    });

    it('drops a source that has no kind', () => {
        expect(normalizeYieldFields(TransactionTypeEnum.INCOME, null, SOURCE_ACCOUNT_ID)).toEqual({
            yieldKind: null,
            yieldSourceAccountId: null
        });
    });

    it('keeps the source value it was given, whatever its type', () => {
        const reference = { key: 'account-sync-id' };

        expect(normalizeYieldFields(TransactionTypeEnum.INCOME, YieldKindEnum.EARN, reference).yieldSourceAccountId).toBe(reference);
    });
});
