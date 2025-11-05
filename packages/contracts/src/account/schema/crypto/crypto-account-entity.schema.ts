import { literal } from 'zod';

import { AccountTypeEnum } from '../../enum/account-type.enum';
import { AccountEntitySchema } from '../account-entity.schema';

export const CryptoAccountEntitySchema = AccountEntitySchema.omit({ type: true, balance: true, currency: true }).extend({
    type: literal(AccountTypeEnum.CRYPTO)
});
