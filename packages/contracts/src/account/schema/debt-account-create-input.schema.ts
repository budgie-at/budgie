import * as Schema from 'effect/Schema';

import { NonNegativeNumberSchema } from '../../@generic/schema/non-negative-number.schema';
import { PositiveNumberSchema } from '../../@generic/schema/positive-number.schema';
import { AccountDebtTypeEnum } from '../enum/account-debt-type.enum';

import { AccountBaseFieldsSchema } from './account-base-fields.schema';
import { AccountIbanSchema } from './account-iban.schema';

export const DebtAccountCreateInputSchema = Schema.Struct({
    ...AccountBaseFieldsSchema,
    debtType: Schema.Enum(AccountDebtTypeEnum),
    iban: Schema.NullOr(AccountIbanSchema),
    contactId: Schema.NullOr(Schema.String),
    deadline: Schema.NullOr(Schema.Date),
    targetBalance: PositiveNumberSchema,
    currentBalance: NonNegativeNumberSchema
});
