import * as Schema from 'effect/Schema';

export class InzhurPriceMissingError extends Schema.TaggedError<InzhurPriceMissingError>()('InzhurPriceMissingError', {
    fundNames: Schema.Array(Schema.String)
}) {}
