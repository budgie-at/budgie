import * as Schema from 'effect/Schema';

const BinanceStakingRewardApiSchema = Schema.Struct({
    asset: Schema.optionalKey(Schema.String),
    amount: Schema.String,
    time: Schema.Number
});

export const BinanceStakingRewardListApiSchema = Schema.Struct({
    rows: Schema.Array(BinanceStakingRewardApiSchema)
});

export type BinanceStakingRewardApiInterface = typeof BinanceStakingRewardApiSchema.Type;
