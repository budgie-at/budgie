import * as Schema from 'effect/Schema';

import { PositiveNumberSchema } from './positive-number.schema';

export const OptionalNullablePositiveNumberSchema = PositiveNumberSchema.pipe(Schema.NullOr, Schema.optional);
