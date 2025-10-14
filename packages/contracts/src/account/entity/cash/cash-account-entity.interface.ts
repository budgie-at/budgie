import type { CashAccountEntitySchema } from '../../schema/cash/cash-account-entity.schema';
import type { infer } from 'zod';

export interface CashAccountEntityInterface extends infer<typeof CashAccountEntitySchema> {
}
