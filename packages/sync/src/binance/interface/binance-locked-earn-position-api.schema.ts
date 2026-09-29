import * as Schema from 'effect/Schema';

const BinanceLockedEarnPositionApiSchema = Schema.Struct({
    asset: Schema.String,
    amount: Schema.String
});

export const BinanceLockedEarnPositionListApiSchema = Schema.Struct({
    rows: Schema.Array(BinanceLockedEarnPositionApiSchema),
    total: Schema.Number
});

export type BinanceLockedEarnPositionApiInterface = typeof BinanceLockedEarnPositionApiSchema.Type;
