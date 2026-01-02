import type { MccGroupCreateEntitySchema } from '../schema/mcc-group-create-entity.schema';
import type { infer } from 'zod';

export interface MccGroupCreateEntityInterface extends infer<typeof MccGroupCreateEntitySchema> {}
