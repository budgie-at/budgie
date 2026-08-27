import type { SyncAccountInterface } from '@budgie/sync';

export interface BinanceResolvableAccountInterface {
    readonly exchangeAccount: SyncAccountInterface;
    readonly instrumentId: number;
}
