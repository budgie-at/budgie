import * as Schema from 'effect/Schema';

const BinanceConvertFlowApiSchema = Schema.Struct({
    quoteId: Schema.String,
    orderId: Schema.Number,
    orderStatus: Schema.String,
    fromAsset: Schema.String,
    fromAmount: Schema.String,
    toAsset: Schema.String,
    toAmount: Schema.String,
    createTime: Schema.Number
});

export const BinanceConvertTradeFlowApiSchema = Schema.Struct({
    list: Schema.Array(BinanceConvertFlowApiSchema),
    startTime: Schema.Number,
    endTime: Schema.Number,
    limit: Schema.Number,
    moreData: Schema.Boolean
});

export type BinanceConvertFlowApiInterface = typeof BinanceConvertFlowApiSchema.Type;
