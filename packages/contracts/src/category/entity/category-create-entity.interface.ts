import type { CategoryCreateEntitySchema } from '@/category';
import type { z } from 'zod';


export interface CategoryCreateEntityInterface extends z.infer<typeof CategoryCreateEntitySchema> {}
