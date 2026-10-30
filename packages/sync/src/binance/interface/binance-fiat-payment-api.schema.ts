import * as Schema from 'effect/Schema';

const BinanceFiatPaymentApiSchema = Schema.Struct({
    orderNo: Schema.String,
    sourceAmount: Schema.String,
    fiatCurrency: Schema.String,
    obtainAmount: Schema.String,
    cryptoCurrency: Schema.String,
    price: Schema.String,
    status: Schema.String,
    createTime: Schema.Number,
    paymentMethod: Schema.optionalKey(Schema.String)
});

export const BinanceFiatPaymentListApiSchema = Schema.Struct({
    code: Schema.String,
    message: Schema.String,
    data: Schema.Array(BinanceFiatPaymentApiSchema),
    total: Schema.Number,
    success: Schema.Boolean
});

export type BinanceFiatPaymentApiInterface = typeof BinanceFiatPaymentApiSchema.Type;
