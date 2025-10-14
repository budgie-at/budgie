import { literal } from 'zod';

import { AccountTypeEnum } from '../../enum/account-type.enum';
import { BaseAccountEntitySchema } from '../base/base-account-entity.schema';
import { BaseAccountFieldsSchema } from '../base/base-account-fields.schema';

export const BankAccountEntitySchema = BaseAccountEntitySchema.extend({
    type: literal(AccountTypeEnum.BANK),
    ...BaseAccountFieldsSchema.shape
});
