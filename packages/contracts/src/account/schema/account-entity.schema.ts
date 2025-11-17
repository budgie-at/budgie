import { createSelectSchema } from 'drizzle-zod';
import { number, enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../generic/constant/base-entity-fields.constant';
import { UserIconNameEnum } from '../../generic/enum/user-icon-name.enum';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../constant/account-title-max-length.constant';
import { ACCOUNT_TITLE_MIN_LENGTH } from '../constant/account-title-min-length.constant';
import { AccountNatureEnum } from '../enum/account-nature.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { ExternalSourceEnum } from '../enum/external-source.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntitySchema = createSelectSchema(AccountEntityTable, {
    ...BaseEntityFields,
    includeInNetWorth: schema => schema.default(true).describe('Determines whether the account should be included in net worth.'),
    title: schema => schema.min(ACCOUNT_TITLE_MIN_LENGTH).max(ACCOUNT_TITLE_MAX_LENGTH).describe('The account title.'),
    type: zodEnum(AccountTypeEnum).describe('The account type.'),
    order: schema => schema.nonnegative().default(0).describe('The account order.'),
    icon: zodEnum(UserIconNameEnum).describe('The account icon.'),
    nature: zodEnum(AccountNatureEnum).describe('The account nature.'),
    externalId: schema => schema.nullable().default(null).describe('The external id of the account.'),
    externalSource: zodEnum(ExternalSourceEnum).nullable().default(null).describe('The external source of the account.'),
    instrumentId: schema => schema.positive().describe('The id of the instrument.'),
    parentId: schema => schema.positive().nullable().default(null).describe('The id of the parent account.'),
    currentBalance: number().describe('The current balance of the account.')
});
