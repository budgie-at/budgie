import type { InstrumentEntitySchema } from '../schema/instrument-entity.schema';
import type { z } from 'zod';


export interface InstrumentEntityInterface extends z.infer<typeof InstrumentEntitySchema> {}
