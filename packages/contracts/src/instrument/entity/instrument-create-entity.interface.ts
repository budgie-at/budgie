import { infer } from 'zod';

import { InstrumentCreateEntitySchema } from '../schema/instrument-create-entity.schema';

export interface InstrumentCreateEntityInterface extends infer<typeof InstrumentCreateEntitySchema> {}
