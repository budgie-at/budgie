import type { HoldingCreateEntitySchema } from '../schema/holding-create-entity.schema';
import type { infer } from 'zod';

export interface HoldingCreateEntityInterface extends infer<typeof HoldingCreateEntitySchema> {}
