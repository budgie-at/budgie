import * as Schema from 'effect/Schema';

const BinanceDividendApiSchema = Schema.Struct({
    id: Schema.Number,
    tranId: Schema.Number,
    asset: Schema.String,
    amount: Schema.String,
    divTime: Schema.Number,
    direction: Schema.optionalKey(Schema.Number),
    enInfo: Schema.optionalKey(Schema.String)
});

export const BinanceDividendListApiSchema = Schema.Struct({
    rows: Schema.Array(BinanceDividendApiSchema)
});

export type BinanceDividendApiInterface = typeof BinanceDividendApiSchema.Type;
