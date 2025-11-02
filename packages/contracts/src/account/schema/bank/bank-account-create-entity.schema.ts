import { BankAccountEntitySchema } from './bank-account-entity.schema';

export const BankAccountCreateEntitySchema = BankAccountEntitySchema.pick({
    type: true,
    title: true,
    balance: true,
    currency: true
});
