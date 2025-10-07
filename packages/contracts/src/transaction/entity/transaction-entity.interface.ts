import type { TransactionEntitySchema } from '@/transaction';
import type { z } from 'zod';

export interface TransactionEntityInterface extends z.infer<typeof TransactionEntitySchema> {}
