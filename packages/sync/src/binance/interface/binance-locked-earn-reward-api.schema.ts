import * as Schema from 'effect/Schema';

const BinanceLockedEarnRewardApiSchema = Schema.Struct({
    asset: Schema.String,
    amount: Schema.String,
    time: Schema.Number
});

export const BinanceLockedEarnRewardListApiSchema = Schema.Struct({
    rows: Schema.Array(BinanceLockedEarnRewardApiSchema)
});

export type BinanceLockedEarnRewardApiInterface = typeof BinanceLockedEarnRewardApiSchema.Type;
