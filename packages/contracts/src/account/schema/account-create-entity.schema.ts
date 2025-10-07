import { AccountEntitySchema } from '@/account';

export const AccountCreateEntitySchema = AccountEntitySchema.pick({
    type: true
});
