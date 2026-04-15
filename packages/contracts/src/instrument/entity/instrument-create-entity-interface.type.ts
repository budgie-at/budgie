import { z } from 'zod';

import { InstrumentCreateEntitySchema } from '../schema/instrument-create-entity.schema';

export type InstrumentCreateEntityInterface = z.infer<typeof InstrumentCreateEntitySchema>;
