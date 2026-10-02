import * as Schema from 'effect/Schema';

import { NonNegativeNumberSchema } from '../../@generic/schema/non-negative-number.schema';
import { PositiveNumberSchema } from '../../@generic/schema/positive-number.schema';
import { UserIconSchema } from '../../@generic/schema/user-icon.schema';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../constant/account-title-max-length.constant';
import { ACCOUNT_TITLE_MIN_LENGTH } from '../constant/account-title-min-length.constant';
import { AccountDebtTypeEnum } from '../enum/account-debt-type.enum';
import { AccountTypeEnum } from '../enum/account-type.enum';

import { AccountIbanSchema } from './account-iban.schema';

export const DebtAccountCreateInputSchema = Schema.Struct({
    icon: UserIconSchema,
    title: Schema.Trim.check(Schema.isMinLength(ACCOUNT_TITLE_MIN_LENGTH), Schema.isMaxLength(ACCOUNT_TITLE_MAX_LENGTH)),
    type: Schema.Enum(AccountTypeEnum),
    debtType: Schema.Enum(AccountDebtTypeEnum),
    instrumentId: PositiveNumberSchema,
    iban: Schema.NullOr(AccountIbanSchema),
    contactId: Schema.NullOr(Schema.String),
    deadline: Schema.NullOr(Schema.Date),
    targetBalance: PositiveNumberSchema,
    currentBalance: NonNegativeNumberSchema,
    includeInNetWorth: Schema.optional(Schema.Boolean),
    isActive: Schema.optional(Schema.Boolean)
});
