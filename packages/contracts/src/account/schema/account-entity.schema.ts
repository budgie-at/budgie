import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { UserIconNameEnum } from '../../generic/enum/user-icon-name.enum';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../constant/account-title-max-length.constant';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntitySchema = createSelectSchema(AccountEntityTable, {
    ...BaseEntityFields,
    includeInNetWorth: schema => schema.describe('Determines whether the account should be included in net worth.'),
    title: schema => schema.max(ACCOUNT_TITLE_MAX_LENGTH).describe('The account title.'),
    type: zodEnum(AccountTypeEnum).describe('The account type.'),
    order: schema => schema.nonnegative().default(0).describe('The account order.'),
    icon: zodEnum(UserIconNameEnum).describe('The account icon.'),
    nature: schema => schema.describe('The account nature.'),
    externalId: schema => schema.describe('The external id of the account.'),
    externalSource: schema => schema.describe('The external source of the account.'),
    instrumentId: schema => schema.positive().describe('The id of the instrument.'),
    parentId: schema => schema.describe('The id of the parent account.')
});
