import { convertToMicroUnits } from '../../@generic/util/convert-to-micro-units.util';

import type { TransactionEntryCreateEntityInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';
import type { EntryBaseValuationInterface } from '@budgie/market';

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
    kind: entry.kind,
    amount: convertToMicroUnits(entry.amount),
    externalId: entry.externalId ?? null,
    exchangeRate: entry.exchangeRate ?? 1,
    baseInstrumentId: valuation?.baseInstrumentId ?? entry.baseInstrumentId ?? null,
    baseExchangeRate: valuation?.baseExchangeRate ?? entry.baseExchangeRate ?? null,
    baseAmount: valuation?.baseAmount ?? entry.baseAmount ?? null,
    quotedInstrumentId: entry.quotedInstrumentId ?? null,
    quotedAmount: entry.quotedAmount ?? null,
    quotedUnitPrice: entry.quotedUnitPrice ?? null,
    operationInstrumentId: entry.operationInstrumentId ?? null,
    operationAmount: entry.operationAmount ?? null,
    toIban: entry.toIban ?? null,
    originalTransactionId: null
});
