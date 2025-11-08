import { infer } from 'zod';

import { InstrumentEntitySchema } from '../schema/instrument-entity.schema';

export interface InstrumentEntityInterface extends infer<typeof InstrumentEntitySchema> {}
