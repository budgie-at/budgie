import { literal } from 'zod';

import { AccountTypeEnum } from '../../enum/account-type.enum';
import { AccountEntitySchema } from '../account-entity.schema';

export const StocksAccountEntitySchema = AccountEntitySchema.omit({ type: true, balance: true }).extend({
    type: literal(AccountTypeEnum.STOCKS)
});
