import type { TagEntitySchema } from '@/tag';
import type { z } from 'zod';


export interface TagEntityInterface extends z.infer<typeof TagEntitySchema> {}
