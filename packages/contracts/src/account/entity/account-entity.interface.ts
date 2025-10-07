import type { AccountEntitySchema } from '@/account';
import type { z } from 'zod';


export interface AccountEntityInterface extends z.infer<typeof AccountEntitySchema> {}
