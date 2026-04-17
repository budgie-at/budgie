import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { TransactionEntryEntitySchema } from './transaction-entry-entity.schema';

export const TransactionEntryCreateEntitySchema = convertToCreateEntitySchema(TransactionEntryEntitySchema).partial({
    externalId: true,
    exchangeRate: true,
    toIban: true
});
