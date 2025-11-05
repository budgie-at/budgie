import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { CurrencyEnum } from '../../generic/enum/currency.enum';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../constant/account-title-max-length.constant';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntitySchema = createSelectSchema(AccountEntityTable, {
    ...BaseEntityFields,
    includeInNetWorth: schema => schema.describe('Determines whether the account should be included in net worth.'),
    title: schema => schema.max(ACCOUNT_TITLE_MAX_LENGTH).describe('The account title.'),
    type: zodEnum(AccountTypeEnum).describe('The account type.'),
    balance: schema => schema.describe('The account balance.'),
    order: schema => schema.nonnegative().default(0).describe('The account order.'),
    currency: zodEnum(CurrencyEnum).describe('The account currency.'),
    icon: schema => schema.describe('The account icon.')
});
