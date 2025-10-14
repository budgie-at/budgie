import { literal } from 'zod';

import { AccountTypeEnum } from '../../enum/account-type.enum';
import { AccountEntitySchema } from '../account-entity.schema';

export const CashAccountEntitySchema = AccountEntitySchema.omit({ type: true }).extend({
    type: literal(AccountTypeEnum.CASH)
});
