import type { TagUpdateEntitySchema } from '../schema/tag-update-entity.schema';
import type { infer } from 'zod';

export interface TagUpdateEntityInterface extends infer<typeof TagUpdateEntitySchema> {}
