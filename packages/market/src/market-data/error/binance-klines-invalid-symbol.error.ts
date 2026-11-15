import * as Schema from 'effect/Schema';

export class BinanceKlinesInvalidSymbolError extends Schema.TaggedError<
    BinanceKlinesInvalidSymbolError,
    { readonly brand: unique symbol }
>()('BinanceKlinesInvalidSymbolError', {
    symbol: Schema.String
}) {
    override get message(): string {
        return `Binance has no klines for ${this.symbol}`;
    }
}
