import * as Schema from 'effect/Schema';

export const CoinGeckoSimplePriceResponseSchema = Schema.Record(Schema.String, Schema.Record(Schema.String, Schema.Number));
