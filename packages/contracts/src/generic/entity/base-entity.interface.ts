import type { BaseEntitySchema } from '@/generic';
import type { z } from 'zod';

export interface BaseEntityInterface extends z.infer<typeof BaseEntitySchema> {}
