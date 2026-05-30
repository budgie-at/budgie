import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { TransactionEntryEntitySchema } from './transaction-entry-entity.schema';

export const TransactionEntryCreateEntitySchema = convertToCreateEntitySchema(TransactionEntryEntitySchema).partial({
    categorySource: true,
    externalId: true,
    exchangeRate: true,
    baseInstrumentId: true,
    baseExchangeRate: true,
    baseAmount: true,
    toIban: true,
    originalTransactionId: true
});
