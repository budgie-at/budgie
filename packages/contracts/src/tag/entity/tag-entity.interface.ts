import type { TagEntitySchema } from '../schema/tag-entity.schema';
import type { z } from 'zod';

export interface TagEntityInterface extends z.infer<typeof TagEntitySchema> {}
