import type { TransactionCreateEntitySchema } from '@/transaction';
import type { z } from 'zod';


export interface TransactionCreateEntityInterface extends z.infer<typeof TransactionCreateEntitySchema> {}
