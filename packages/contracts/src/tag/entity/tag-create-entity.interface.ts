import type { TagCreateEntitySchema } from '@/tag';
import type { z } from 'zod';


export interface TagCreateEntityInterface extends z.infer<typeof TagCreateEntitySchema> {}
