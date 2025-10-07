import type { CategoryEntitySchema } from '@/category';
import type { z } from 'zod';


export interface CategoryEntityInterface extends z.infer<typeof CategoryEntitySchema> {}
