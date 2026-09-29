import * as Schema from 'effect/Schema';

export const BinanceServerTimeApiSchema = Schema.Struct({
    serverTime: Schema.Number
});

export type BinanceServerTimeApiInterface = typeof BinanceServerTimeApiSchema.Type;
