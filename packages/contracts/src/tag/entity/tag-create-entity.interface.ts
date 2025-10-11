import type { TagCreateEntitySchema } from '../schema/tag-create-entity.schema';
import type { z } from 'zod';

export interface TagCreateEntityInterface extends z.infer<typeof TagCreateEntitySchema> {}
