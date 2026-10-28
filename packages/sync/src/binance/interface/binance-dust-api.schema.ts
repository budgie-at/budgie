import * as Schema from 'effect/Schema';

const BinanceDustDetailApiSchema = Schema.Struct({
    transId: Schema.Number,
    fromAsset: Schema.String,
    targetAsset: Schema.optionalKey(Schema.String),
    amount: Schema.String,
    transferedAmount: Schema.String,
    serviceChargeAmount: Schema.String,
    operateTime: Schema.Number
});

const BinanceDustLogApiSchema = Schema.Struct({
    transId: Schema.Number,
    operateTime: Schema.Number,
    totalTransferedAmount: Schema.String,
    totalServiceChargeAmount: Schema.String,
    userAssetDribbletDetails: Schema.Array(BinanceDustDetailApiSchema)
});

export const BinanceDustListApiSchema = Schema.Struct({
    total: Schema.Number,
    userAssetDribblets: Schema.Array(BinanceDustLogApiSchema)
});

export type BinanceDustLogApiInterface = typeof BinanceDustLogApiSchema.Type;
