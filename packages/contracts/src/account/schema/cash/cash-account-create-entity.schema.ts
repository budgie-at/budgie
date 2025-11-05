import { CashAccountEntitySchema } from './cash-account-entity.schema';

export const CashAccountCreateEntitySchema = CashAccountEntitySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
}).partial({
    order: true,
    includeInNetWorth: true
});
