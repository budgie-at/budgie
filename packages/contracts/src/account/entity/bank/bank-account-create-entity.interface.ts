import type { BankAccountCreateEntitySchema } from '../../schema/bank/bank-account-create-entity.schema';
import type { infer } from 'zod';

export interface BankAccountCreateEntityInterface extends infer<typeof BankAccountCreateEntitySchema> {
}
