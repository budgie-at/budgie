import * as Schema from 'effect/Schema';

const BinanceEarnPositionApiSchema = Schema.Struct({
    asset: Schema.String,
    totalAmount: Schema.String
});

export const BinanceEarnPositionListApiSchema = Schema.Struct({
    rows: Schema.Array(BinanceEarnPositionApiSchema),
    total: Schema.Finite
});

export type BinanceEarnPositionApiInterface = typeof BinanceEarnPositionApiSchema.Type;
