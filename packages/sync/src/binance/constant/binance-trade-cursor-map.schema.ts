import * as Schema from 'effect/Schema';

export const BinanceTradeCursorMapSchema = Schema.Record(Schema.String, Schema.Number);

export type BinanceTradeCursorMapInterface = typeof BinanceTradeCursorMapSchema.Type;
