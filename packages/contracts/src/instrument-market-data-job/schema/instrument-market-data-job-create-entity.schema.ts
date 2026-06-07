import { convertToCreateEntitySchema } from '../../@generic/util/convert-to-create-entity-schema.util';

import { InstrumentMarketDataJobEntitySchema } from './instrument-market-data-job-entity.schema';

export const InstrumentMarketDataJobCreateEntitySchema = convertToCreateEntitySchema(InstrumentMarketDataJobEntitySchema).partial({
    status: true,
    priority: true,
    attempts: true,
    lockedAt: true,
    completedAt: true,
    lastError: true
});
