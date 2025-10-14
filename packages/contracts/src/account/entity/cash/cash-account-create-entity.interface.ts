import type { CashAccountCreateEntitySchema } from '../../schema/cash/cash-account-create-entity.schema';
import type { infer } from 'zod';

export interface CashAccountCreateEntityInterface extends infer<typeof CashAccountCreateEntitySchema> {}
