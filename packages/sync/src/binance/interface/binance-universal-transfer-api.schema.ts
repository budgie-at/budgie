import * as Schema from 'effect/Schema';

const BinanceUniversalTransferApiSchema = Schema.Struct({
    asset: Schema.String,
    amount: Schema.String,
    type: Schema.String,
    status: Schema.String,
    tranId: Schema.Number,
    timestamp: Schema.Number
});

export const BinanceUniversalTransferListApiSchema = Schema.Struct({
    rows: Schema.Array(BinanceUniversalTransferApiSchema)
});

export type BinanceUniversalTransferApiInterface = typeof BinanceUniversalTransferApiSchema.Type;
