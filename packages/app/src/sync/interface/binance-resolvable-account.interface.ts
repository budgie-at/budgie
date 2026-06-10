import type { SyncAccountInterface } from '@budgie/sync';

export interface BinanceResolvableAccountInterface {
    readonly bankAccount: SyncAccountInterface;
    readonly instrumentId: number;
}
