import * as Schema from 'effect/Schema';

const BinanceDividendApiSchema = Schema.Struct({
    id: Schema.Finite,
    tranId: Schema.Finite,
    asset: Schema.String,
    amount: Schema.String,
    divTime: Schema.Finite,
    direction: Schema.optionalKey(Schema.Finite),
    enInfo: Schema.optionalKey(Schema.String)
});

export const BinanceDividendListApiSchema = Schema.Struct({
    rows: Schema.Array(BinanceDividendApiSchema)
});

export type BinanceDividendApiInterface = typeof BinanceDividendApiSchema.Type;
