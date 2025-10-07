import type { AccountCreateEntitySchema } from '@/account';
import type { z } from 'zod';


export interface AccountCreateEntityInterface extends z.infer<typeof AccountCreateEntitySchema> {}
