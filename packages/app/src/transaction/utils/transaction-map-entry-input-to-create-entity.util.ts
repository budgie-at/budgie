import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

import type { TransactionEntryCreateEntityInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const transactionMapEntryInputToCreateEntity = (
    entry: TransactionEntryCreateInputInterface,
    transactionId: number
): TransactionEntryCreateEntityInterface => ({
    transactionId,
    accountId: entry.accountId,
    categoryId: entry.categoryId,
    mccCategoryId: entry.mccCategoryId,
    type: entry.type,
    amount: convertToMicroUnits(entry.amount),
    externalId: entry.externalId ?? null,
    exchangeRate: entry.exchangeRate ?? 1,
    toIban: entry.toIban ?? null
});
