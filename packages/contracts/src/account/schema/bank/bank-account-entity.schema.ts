import { literal } from 'zod';

import { AccountTypeEnum } from '../../enum/account-type.enum';
import { AccountEntitySchema } from '../account-entity.schema';

export const BankAccountEntitySchema = AccountEntitySchema.omit({ type: true }).extend({
    type: literal(AccountTypeEnum.BANK)
});
