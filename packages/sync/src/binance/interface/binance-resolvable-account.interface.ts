import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';

export interface BinanceResolvableAccountInterface {
    readonly exchangeAccount: SyncAccountInterface;
    readonly instrumentId: number;
}
