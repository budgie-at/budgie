import * as Schema from 'effect/Schema';

const BinanceConvertFlowApiSchema = Schema.Struct({
    quoteId: Schema.String,
    orderId: Schema.Finite,
    orderStatus: Schema.String,
    fromAsset: Schema.String,
    fromAmount: Schema.String,
    toAsset: Schema.String,
    toAmount: Schema.String,
    createTime: Schema.Finite
});

export const BinanceConvertTradeFlowApiSchema = Schema.Struct({
    list: Schema.Array(BinanceConvertFlowApiSchema),
    startTime: Schema.Finite,
    endTime: Schema.Finite,
    limit: Schema.Finite,
    moreData: Schema.Boolean
});

export type BinanceConvertFlowApiInterface = typeof BinanceConvertFlowApiSchema.Type;
