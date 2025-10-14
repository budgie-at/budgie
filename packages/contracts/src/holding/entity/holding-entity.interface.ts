import type { HoldingEntitySchema } from '../schema/holding-entity.schema';
import type { infer } from 'zod';

export interface HoldingEntityInterface extends infer<typeof HoldingEntitySchema> {}
