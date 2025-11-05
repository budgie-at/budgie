import { AccountEntitySchema } from './account-entity.schema';

export const AccountCreateEntitySchema = AccountEntitySchema.pick({
    type: true,
    icon: true,
    order: true,
    title: true,
    balance: true,
    currency: true,
    includeInNetWorth: true
}).partial({
    order: true,
    includeInNetWorth: true,
});
