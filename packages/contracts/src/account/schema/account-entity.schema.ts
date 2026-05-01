import { createSelectSchema } from 'drizzle-zod';
import { enum as zodEnum } from 'zod';

import { BaseEntityFields } from '../../@generic/constant/base-entity-fields.constant';
import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../constant/account-title-max-length.constant';
import { ACCOUNT_TITLE_MIN_LENGTH } from '../constant/account-title-min-length.constant';
import { AccountDebtTypeEnum } from '../enum/account-debt-type.enum';
import { AccountNatureEnum } from '../enum/account-nature.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { ExternalSourceEnum } from '../enum/external-source.enum';
import { AccountEntityTable } from '../table/account-entity.table';

export const AccountEntitySchema = createSelectSchema(AccountEntityTable, {
    ...BaseEntityFields,
    includeInNetWorth: schema => schema.default(true).describe('Determines whether the account should be included in net worth.'),
    title: schema => schema.trim().min(ACCOUNT_TITLE_MIN_LENGTH).max(ACCOUNT_TITLE_MAX_LENGTH).describe('The account title.'),
    type: zodEnum(AccountTypeEnum).describe('The account type.'),
    debtType: zodEnum(AccountDebtTypeEnum).describe('The account debt type.'),
    order: schema => schema.nonnegative().default(0).describe('The account order.'),
    icon: zodEnum(UserIconNameEnum, {
        message: 'Invalid icon selected'
    }).describe('The account icon.'),
    nature: zodEnum(AccountNatureEnum).describe('The account nature.'),
    externalId: schema => schema.nullable().default(null).describe('The external id of the account.'),
    externalSource: zodEnum(ExternalSourceEnum).nullable().default(null).describe('The external source of the account.'),
    iban: schema =>
        schema
            .regex(/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/u, 'Invalid IBAN format')
            .min(15, 'IBAN must be at least 15 characters')
            .max(34, 'IBAN must not exceed 34 characters')
            .nullable()
            .default(null)
            .describe('The IBAN of the account.'),
    instrumentId: schema => schema.positive().describe('The id of the instrument.'),
    parentId: schema => schema.positive().nullable().default(null).describe('The id of the parent account.'),
    deadline: schema => schema.nullable().default(null).describe('The deadline of the account.'),
    targetBalance: schema => schema.positive().describe('The target balance of the account.'),
    contactId: schema => schema.nullable().default(null).describe('The id of the contact associated with the account.'),
    isActive: schema => schema.default(true).describe('Determines whether the account is active and visible on the main page.')
});
