import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

const BinanceDustDetailApiSchema = Schema.Struct({
    transId: Schema.Finite,
    fromAsset: Schema.String,
    targetAsset: Schema.optionalKey(Schema.String),
    amount: Schema.String,
    transferedAmount: Schema.String,
    serviceChargeAmount: Schema.String,
    operateTime: Schema.Finite
});

const BinanceDustLogApiSchema = Schema.Struct({
    transId: Schema.Finite,
    operateTime: Schema.Finite,
    totalTransferedAmount: Schema.String,
    totalServiceChargeAmount: Schema.String,
    userAssetDribbletDetails: Schema.Array(BinanceDustDetailApiSchema)
});

export const BinanceDustListApiSchema = Schema.Struct({
    userAssetDribblets: Schema.Array(BinanceDustLogApiSchema).pipe(Schema.withDecodingDefaultKey(Effect.succeed([])))
});

export type BinanceDustLogApiInterface = typeof BinanceDustLogApiSchema.Type;
