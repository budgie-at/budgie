import type { TagEntitySchema } from '../schema/tag-entity.schema';
import type { infer } from 'zod';

export interface TagEntityInterface extends infer<typeof TagEntitySchema> {}
