import { literal } from 'zod';

import { AccountTypeEnum } from '../../enum/account-type.enum';
import { BaseAccountEntitySchema } from '../base/base-account-entity.schema';
import { BaseAccountFieldsSchema } from '../base/base-account-fields.schema';

export const CashAccountEntitySchema = BaseAccountEntitySchema.extend({
    type: literal(AccountTypeEnum.CASH),
    ...BaseAccountFieldsSchema.shape
});
