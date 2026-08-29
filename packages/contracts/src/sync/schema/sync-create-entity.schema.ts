import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { SyncEntitySchema } from './sync-entity.schema';

export const SyncCreateEntitySchema = convertToCreateEntitySchema(SyncEntitySchema).partial({
    mode: true,
    status: true,
    enabled: true,
    errorCount: true,
    lastError: true,
    forwardSyncFromAt: true,
    forwardSyncedAt: true,
    backwardSyncFromAt: true,
    backwardSyncedAt: true,
    transactionCount: true
});
