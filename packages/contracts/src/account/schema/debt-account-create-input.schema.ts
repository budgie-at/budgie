import { number } from 'zod';

import { AccountCreateEntitySchema } from './account-create-entity.schema';

export const DebtAccountCreateInputSchema = AccountCreateEntitySchema.extend({
    accountId: number().positive()
});
