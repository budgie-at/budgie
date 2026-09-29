import * as Schema from 'effect/Schema';

export const NonNegativeNumberSchema = Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0));
