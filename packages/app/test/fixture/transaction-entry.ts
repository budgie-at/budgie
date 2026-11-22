import {
    AccountTypeEnum,
    CategorySourceEnum,
    PERSONAL_SYNC_ZONE,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum
} from '@budgie/contracts';

import { buildAccountWithInstrument } from './account-with-instrument';

import type { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';

const TIMESTAMP = new Date('2026-10-01T00:00:00Z');

export const buildPrimaryEntry = (
    overrides: Partial<TransactionEntryWithRelationsEntityInterface> = {}
): TransactionEntryWithRelationsEntityInterface => {
    const id = overrides.id ?? 1;

    return {
        id,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
        deletedAt: null,
        syncId: `entry-${id}`,
        syncZone: PERSONAL_SYNC_ZONE,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        accountId: 1,
        categoryId: null,
        categorySource: CategorySourceEnum.USER,
        mccCategoryId: null,
        sequence: 0,
        transactionId: id,
        amount: 400_000,
        externalId: null,
        exchangeRate: 1,
        baseInstrumentId: null,
        baseExchangeRate: null,
        baseAmount: 400_000,
        quotedInstrumentId: null,
        quotedAmount: null,
        quotedUnitPrice: null,
        operationInstrumentId: null,
        operationAmount: null,
        toIban: null,
        providerBalance: null,
        originalTransactionId: null,
        account: buildAccountWithInstrument(1, AccountTypeEnum.DEPOSIT, 'Account'),
        category: null,
        mccCategory: null,
        ...overrides
    };
};
