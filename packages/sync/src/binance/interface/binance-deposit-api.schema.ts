import * as Schema from 'effect/Schema';

const BinanceDepositApiSchema = Schema.Struct({
    id: Schema.optional(Schema.String),
    txId: Schema.optional(Schema.String),
    amount: Schema.String,
    coin: Schema.String,
    insertTime: Schema.Number,
    status: Schema.optional(Schema.Number),
    walletType: Schema.optional(Schema.Number)
});

export const BinanceDepositListApiSchema = Schema.Array(BinanceDepositApiSchema);

export type BinanceDepositApiInterface = typeof BinanceDepositApiSchema.Type;
