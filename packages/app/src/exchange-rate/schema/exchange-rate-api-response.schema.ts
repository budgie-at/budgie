import * as Schema from 'effect/Schema';

export const ExchangeRateApiResponseSchema = Schema.Struct({
    base: Schema.String,
    date: Schema.String,
    rates: Schema.Record(Schema.String, Schema.Number)
});
