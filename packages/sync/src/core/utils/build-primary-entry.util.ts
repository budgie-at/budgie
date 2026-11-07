import { CategorySourceEnum, TransactionEntryKindEnum } from '@budgie/contracts';

import type { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

export const buildPrimaryEntry = (
    accountId: number,
    type: TransactionEntryTypeEnum,
    amount: number,
    externalId: string
): TransactionEntryCreateInputInterface => ({
    accountId,
    type,
    amount,
    categoryId: null,
    categorySource: CategorySourceEnum.USER,
    mccCategoryId: null,
    kind: TransactionEntryKindEnum.PRIMARY,
    externalId,
    exchangeRate: 1,
    toIban: null
});
