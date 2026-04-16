import { z } from 'zod';

import { InstrumentEntitySchema } from '../schema/instrument-entity.schema';

export type InstrumentEntityInterface = z.infer<typeof InstrumentEntitySchema>;
