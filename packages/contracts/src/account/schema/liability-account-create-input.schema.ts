import * as Schema from 'effect/Schema';

import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';
import { PositiveNumberSchema } from '../../@generic/schema/positive-number.schema';
import { ACCOUNT_TITLE_MAX_LENGTH } from '../constant/account-title-max-length.constant';
import { ACCOUNT_TITLE_MIN_LENGTH } from '../constant/account-title-min-length.constant';
import { AccountTypeEnum } from '../enum/account-type.enum';
import { ExternalSourceEnum } from '../enum/external-source.enum';

import { AccountIbanSchema } from './account-iban.schema';

export const LiabilityAccountCreateInputSchema = Schema.Struct({
    icon: Schema.Enum(UserIconNameEnum).annotate({ message: 'Invalid icon selected' }),
    title: Schema.Trim.check(Schema.isMinLength(ACCOUNT_TITLE_MIN_LENGTH), Schema.isMaxLength(ACCOUNT_TITLE_MAX_LENGTH)),
    type: Schema.Enum(AccountTypeEnum),
    instrumentId: PositiveNumberSchema,
    currentBalance: Schema.Finite,
    includeInNetWorth: Schema.optional(Schema.Boolean),
    externalSource: Schema.optional(Schema.NullOr(Schema.Enum(ExternalSourceEnum))),
    externalId: Schema.optional(Schema.NullOr(Schema.String)),
    parentId: Schema.optional(Schema.NullOr(PositiveNumberSchema)),
    iban: Schema.optional(Schema.NullOr(AccountIbanSchema)),
    isActive: Schema.optional(Schema.Boolean),
    integrationId: Schema.optional(Schema.NullOr(PositiveNumberSchema))
});
