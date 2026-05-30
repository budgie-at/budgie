import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

import type { EntryBaseValuationInterface } from '../../money-data/interface/entry-base-valuation.interface';
import type { TransactionEntryCreateEntityInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

export const transactionMapEntryInputToCreateEntity = (
    entry: TransactionEntryCreateInputInterface,
    transactionId: number,
    valuation?: EntryBaseValuationInterface
): TransactionEntryCreateEntityInterface => ({
    transactionId,
    accountId: entry.accountId,
    categoryId: entry.categoryId,
    categorySource: entry.categorySource,
    mccCategoryId: entry.mccCategoryId,
    type: entry.type,
    amount: convertToMicroUnits(entry.amount),
    externalId: entry.externalId ?? null,
    exchangeRate: entry.exchangeRate ?? 1,
    baseInstrumentId: valuation?.baseInstrumentId ?? entry.baseInstrumentId ?? null,
    baseExchangeRate: valuation?.baseExchangeRate ?? entry.baseExchangeRate ?? null,
    baseAmount: valuation?.baseAmount ?? entry.baseAmount ?? null,
    toIban: entry.toIban ?? null,
    originalTransactionId: null
});
