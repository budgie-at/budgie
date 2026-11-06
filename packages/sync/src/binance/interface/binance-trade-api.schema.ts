import * as Schema from 'effect/Schema';

const BinanceTradeApiSchema = Schema.Struct({
    symbol: Schema.String,
    id: Schema.Finite,
    orderId: Schema.Finite,
    price: Schema.String,
    qty: Schema.String,
    quoteQty: Schema.String,
    commission: Schema.String,
    commissionAsset: Schema.String,
    time: Schema.Finite,
    isBuyer: Schema.Boolean,
    isMaker: Schema.Boolean
});

export const BinanceTradeListApiSchema = Schema.Array(BinanceTradeApiSchema);

export type BinanceTradeApiInterface = typeof BinanceTradeApiSchema.Type;
