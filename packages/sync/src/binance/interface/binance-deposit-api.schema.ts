import * as Schema from 'effect/Schema';

const BinanceDepositApiSchema = Schema.Struct({
    id: Schema.optional(Schema.String),
    txId: Schema.optional(Schema.String),
    amount: Schema.String,
    coin: Schema.String,
    insertTime: Schema.Finite,
    status: Schema.optional(Schema.Finite),
    walletType: Schema.optional(Schema.Finite)
});

export const BinanceDepositListApiSchema = Schema.Array(BinanceDepositApiSchema);

export type BinanceDepositApiInterface = typeof BinanceDepositApiSchema.Type;
