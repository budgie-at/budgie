import { BankAccountEntitySchema } from './bank-account-entity.schema';

export const BankAccountCreateEntitySchema = BankAccountEntitySchema.pick({
    type: true,
    balance: true,
    currency: true
});
