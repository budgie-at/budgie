import * as Schema from 'effect/Schema';

const BinanceWithdrawalApiSchema = Schema.Struct({
    id: Schema.String,
    txId: Schema.optional(Schema.String),
    amount: Schema.String,
    transactionFee: Schema.String,
    coin: Schema.String,
    applyTime: Schema.String
});

export const BinanceWithdrawalListApiSchema = Schema.Array(BinanceWithdrawalApiSchema);

export type BinanceWithdrawalApiInterface = typeof BinanceWithdrawalApiSchema.Type;
