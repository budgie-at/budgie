import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { TransactionEntryEntitySchema } from './transaction-entry-entity.schema';

export const TransactionEntryCreateEntitySchema = convertToCreateEntitySchema(TransactionEntryEntitySchema).partial({
    categorySource: true,
    kind: true,
    externalId: true,
    exchangeRate: true,
    baseInstrumentId: true,
    baseExchangeRate: true,
    baseAmount: true,
    quotedInstrumentId: true,
    quotedAmount: true,
    quotedUnitPrice: true,
    toIban: true,
    originalTransactionId: true
});
