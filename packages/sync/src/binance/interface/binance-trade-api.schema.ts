import * as Schema from 'effect/Schema';

const BinanceTradeApiSchema = Schema.Struct({
    symbol: Schema.String,
    id: Schema.Number,
    orderId: Schema.Number,
    price: Schema.String,
    qty: Schema.String,
    quoteQty: Schema.String,
    commission: Schema.String,
    commissionAsset: Schema.String,
    time: Schema.Number,
    isBuyer: Schema.Boolean,
    isMaker: Schema.Boolean
});

export const BinanceTradeListApiSchema = Schema.Array(BinanceTradeApiSchema);

export type BinanceTradeApiInterface = typeof BinanceTradeApiSchema.Type;
