import { BankAccountEntitySchema } from './bank-account-entity.schema';

export const BankAccountCreateEntitySchema = BankAccountEntitySchema.omit({
    id: true,
    updatedAt: true,
    createdAt: true,
    deletedAt: true
}).partial({
    order: true,
    includeInNetWorth: true
});
