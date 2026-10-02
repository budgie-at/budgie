import * as Schema from 'effect/Schema';

export const PositiveNumberSchema = Schema.Finite.check(Schema.isGreaterThan(0));
