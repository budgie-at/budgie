import { z } from 'zod';

import { InstrumentMarketDataJobEntitySchema } from '../schema/instrument-market-data-job-entity.schema';

export type InstrumentMarketDataJobEntityInterface = z.infer<typeof InstrumentMarketDataJobEntitySchema>;
