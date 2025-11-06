import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { CurrencyEnum } from '../../generic/enum/currency.enum';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../constant/account-title-max-length.constant';
import { ACCOUNT_TITLE_MIN_LENGTH } from '../constant/account-title-min-length.constant';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntitySchema = createSelectSchema(AccountEntityTable, {
    ...BaseEntityFields,
    title: schema => schema.min(ACCOUNT_TITLE_MIN_LENGTH).max(ACCOUNT_TITLE_MAX_LENGTH).describe('The account title.'),
    type: zodEnum(AccountTypeEnum).describe('The account type.'),
    balance: schema => schema.describe('The account balance.'),
    currency: zodEnum(CurrencyEnum).describe('The account currency.')
});
