import { AccountEntitySchema } from './account-entity.schema';

export const AccountCreateEntitySchema = AccountEntitySchema.pick({
    type: true
});
