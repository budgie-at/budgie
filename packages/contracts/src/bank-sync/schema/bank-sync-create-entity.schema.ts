import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { BankSyncEntitySchema } from './bank-sync-entity.schema';

export const BankSyncCreateEntitySchema = convertToCreateEntitySchema(BankSyncEntitySchema).partial({
    mode: true,
    status: true,
    enabled: true,
    errorCount: true,
    lastError: true,
    forwardSyncFromAt: true,
    forwardSyncedAt: true,
    backwardSyncFromAt: true,
    backwardSyncedAt: true,
    backwardCompletedAt: true,
    transactionCount: true
});
