import type { TagCreateEntitySchema } from '../schema/tag-create-entity.schema';
import type { infer } from 'zod';

export interface TagCreateEntityInterface extends infer<typeof TagCreateEntitySchema> {}
