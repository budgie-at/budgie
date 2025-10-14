import type { BankAccountEntitySchema } from '../../schema/bank/bank-account-entity.schema';
import type { infer } from 'zod';

export interface BankAccountEntityInterface extends infer<typeof BankAccountEntitySchema> {
}
