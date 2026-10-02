import * as Schema from 'effect/Schema';

const BinanceC2cOrderApiSchema = Schema.Struct({
    orderNumber: Schema.String,
    tradeType: Schema.String,
    asset: Schema.String,
    fiat: Schema.String,
    amount: Schema.String,
    totalPrice: Schema.String,
    unitPrice: Schema.String,
    orderStatus: Schema.String,
    createTime: Schema.Number,
    takerCommission: Schema.String
});

export const BinanceC2cOrderListApiSchema = Schema.Struct({
    code: Schema.String,
    message: Schema.String,
    data: Schema.Array(BinanceC2cOrderApiSchema),
    total: Schema.Number,
    success: Schema.Boolean
});

export type BinanceC2cOrderApiInterface = typeof BinanceC2cOrderApiSchema.Type;
