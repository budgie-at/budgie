import { AccountBalanceCreateEntitySchema } from './account-balance-create-entity.schema';

export const AccountBalanceUpdateEntitySchema = AccountBalanceCreateEntitySchema.pick({
    amount: true
});
