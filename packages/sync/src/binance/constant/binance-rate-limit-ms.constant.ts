import * as Context from 'effect/Context';

export const BinanceRateLimitMs = Context.Reference<number>('@budgie/sync/BinanceRateLimitMs', { defaultValue: () => 1000 });
