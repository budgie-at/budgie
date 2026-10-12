import { addLocalId, stripLocalId } from '@app/transaction/utils/entry-with-local-id.util';
import { CategorySourceEnum, TransactionEntryKindEnum, TransactionEntryTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

const fullEntry: TransactionEntryCreateInputInterface = {
    accountId: 1,
    categoryId: 2,
    categorySource: CategorySourceEnum.DEBT_SETTLEMENT,
    mccCategoryId: 3,
    type: TransactionEntryTypeEnum.CREDIT,
    kind: TransactionEntryKindEnum.PRIMARY,
    amount: 12.5,
    externalId: 'external-1',
    exchangeRate: 1.1,
    baseInstrumentId: 4,
    baseExchangeRate: 0.9,
    baseAmount: 11.25,
    quotedInstrumentId: 5,
    quotedAmount: 0.0002,
    quotedUnitPrice: 62_500,
    operationInstrumentId: 6,
    operationAmount: 13,
    toIban: 'UA00PRIVATBANK1234',
    originalTransactionId: 7
};

describe('transaction/split-entry-local-id', () => {
    it('keeps every entry field through the split modal local-id round trip', () => {
        expect(stripLocalId(addLocalId(fullEntry))).toStrictEqual(fullEntry);
    });
});
