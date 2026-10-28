import * as Schema from 'effect/Schema';

const BinanceHistoryProgressSchema = Schema.Struct({ headAt: Schema.Number, tailAt: Schema.Number });

export const BinanceHistoryProgressMapSchema = Schema.Record(Schema.String, BinanceHistoryProgressSchema);

export type BinanceHistoryProgressInterface = typeof BinanceHistoryProgressSchema.Type;

export type BinanceHistoryProgressMapInterface = typeof BinanceHistoryProgressMapSchema.Type;
