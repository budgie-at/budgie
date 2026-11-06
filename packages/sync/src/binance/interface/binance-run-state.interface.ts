import type { BinanceTokenRunStateInterface } from './binance-token-run-state.interface';

export interface BinanceRunStateInterface {
    readonly deadlineAtMs: number;
    readonly startedAtMs: number;
    readonly startedAt: Date;
    readonly isDeferred: boolean;
    readonly providerSourceFailed: boolean;
    readonly tokenRuns: ReadonlyMap<string, BinanceTokenRunStateInterface>;
}
