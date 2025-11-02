import type { InstrumentCreateEntitySchema } from '../schema/instrument-create-entity.schema';
import type { z } from 'zod';


export interface InstrumentCreateEntityInterface extends z.infer<typeof InstrumentCreateEntitySchema> {}
