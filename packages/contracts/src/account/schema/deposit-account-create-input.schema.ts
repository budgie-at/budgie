import * as Schema from 'effect/Schema';

import { NonNegativeNumberSchema } from '../../@generic/schema/non-negative-number.schema';
import { OptionalNullablePositiveNumberSchema } from '../../@generic/schema/optional-nullable-positive-number.schema';
import { PositiveNumberSchema } from '../../@generic/schema/positive-number.schema';

import { AccountBaseFieldsSchema } from './account-base-fields.schema';
import { AccountIbanSchema } from './account-iban.schema';

export const DepositAccountCreateInputSchema = Schema.Struct({
    ...AccountBaseFieldsSchema,
    iban: Schema.NullOr(AccountIbanSchema),
    deadline: Schema.NullOr(Schema.Date),
    integrationId: OptionalNullablePositiveNumberSchema,
    interestRate: Schema.NullOr(PositiveNumberSchema),
    currentBalance: NonNegativeNumberSchema
});
