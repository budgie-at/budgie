import * as Schema from 'effect/Schema';

import { NonNegativeNumberSchema } from '../../@generic/schema/non-negative-number.schema';
import { OptionalNullablePositiveNumberSchema } from '../../@generic/schema/optional-nullable-positive-number.schema';
import { ExternalSourceEnum } from '../enum/external-source.enum';

import { AccountBaseFieldsSchema } from './account-base-fields.schema';
import { AccountIbanSchema } from './account-iban.schema';

export const LiabilityAccountCreateInputSchema = Schema.Struct({
    ...AccountBaseFieldsSchema,
    currentBalance: Schema.Finite,
    externalSource: Schema.Enum(ExternalSourceEnum).pipe(Schema.NullOr, Schema.optional),
    externalId: Schema.String.pipe(Schema.NullOr, Schema.optional),
    parentId: OptionalNullablePositiveNumberSchema,
    iban: AccountIbanSchema.pipe(Schema.NullOr, Schema.optional),
    integrationId: OptionalNullablePositiveNumberSchema,
    interestRate: NonNegativeNumberSchema.pipe(Schema.NullOr, Schema.optional)
});
