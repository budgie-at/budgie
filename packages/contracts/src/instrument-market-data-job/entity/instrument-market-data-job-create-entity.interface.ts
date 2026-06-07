import { z } from 'zod';

import { InstrumentMarketDataJobCreateEntitySchema } from '../schema/instrument-market-data-job-create-entity.schema';

export type InstrumentMarketDataJobCreateEntityInterface = z.infer<typeof InstrumentMarketDataJobCreateEntitySchema>;
