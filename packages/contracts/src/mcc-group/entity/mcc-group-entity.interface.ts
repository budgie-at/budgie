import type { MccGroupEntitySchema } from '../schema/mcc-group-entity.schema';
import type { infer } from 'zod';

export interface MccGroupEntityInterface extends infer<typeof MccGroupEntitySchema> {}
