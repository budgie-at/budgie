import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { DebtEventEntitySchema } from './debt-event-entity.schema';

export const DebtEventCreateEntitySchema = convertToCreateEntitySchema(DebtEventEntitySchema).partial({
    transactionId: true,
    transactionEntryId: true,
    baseInstrumentId: true,
    baseExchangeRate: true,
    baseAmount: true,
    operatedAt: true
});
