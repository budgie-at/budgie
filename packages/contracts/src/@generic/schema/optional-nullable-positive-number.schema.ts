import * as Schema from 'effect/Schema';

import { PositiveNumberSchema } from './positive-number.schema';

export const OptionalNullablePositiveNumberSchema = Schema.optional(Schema.NullOr(PositiveNumberSchema));
