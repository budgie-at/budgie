import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

const BinanceFiatOrderApiSchema = Schema.Struct({
    orderNo: Schema.String,
    fiatCurrency: Schema.String,
    amount: Schema.String,
    totalFee: Schema.String,
    status: Schema.String,
    createTime: Schema.Number
});

export const BinanceFiatOrderListApiSchema = Schema.Struct({
    code: Schema.String,
    message: Schema.String,
    data: Schema.Array(BinanceFiatOrderApiSchema).pipe(Schema.withDecodingDefaultKey(Effect.succeed([]))),
    total: Schema.Number,
    success: Schema.Boolean
});

export type BinanceFiatOrderApiInterface = typeof BinanceFiatOrderApiSchema.Type;
