import * as Schema from 'effect/Schema';

import { OptionalNullablePositiveNumberSchema } from '../../@generic/schema/optional-nullable-positive-number.schema';
import { ExternalSourceEnum } from '../enum/external-source.enum';

import { AccountBaseFieldsSchema } from './account-base-fields.schema';
import { AccountIbanSchema } from './account-iban.schema';

export const LiabilityAccountCreateInputSchema = Schema.Struct({
    ...AccountBaseFieldsSchema,
    currentBalance: Schema.Finite,
    externalSource: Schema.optional(Schema.NullOr(Schema.Enum(ExternalSourceEnum))),
    externalId: Schema.optional(Schema.NullOr(Schema.String)),
    parentId: OptionalNullablePositiveNumberSchema,
    iban: Schema.optional(Schema.NullOr(AccountIbanSchema)),
    integrationId: OptionalNullablePositiveNumberSchema
});
