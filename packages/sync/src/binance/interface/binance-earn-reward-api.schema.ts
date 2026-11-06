import * as Schema from 'effect/Schema';

const BinanceEarnRewardApiSchema = Schema.Struct({
    asset: Schema.String,
    rewards: Schema.String,
    time: Schema.Finite
});

export const BinanceEarnRewardListApiSchema = Schema.Struct({
    rows: Schema.Array(BinanceEarnRewardApiSchema)
});

export type BinanceEarnRewardApiInterface = typeof BinanceEarnRewardApiSchema.Type;
