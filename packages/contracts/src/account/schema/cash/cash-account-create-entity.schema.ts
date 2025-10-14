import { CashAccountEntitySchema } from './cash-account-entity.schema';

export const CashAccountCreateEntitySchema = CashAccountEntitySchema.pick({ type: true, balance: true, currency: true });
