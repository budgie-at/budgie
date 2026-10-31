import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { BinanceSignedClient } from '../client/binance-signed.client';

export interface BinanceTokenRunStateInterface {
    readonly transfersSynced: boolean;
    readonly sourcesSynced: boolean;
    readonly balancesAnchored: boolean;
    readonly balancesCorrected: boolean;
    readonly signedClient: BinanceSignedClient;
    readonly exchangeAccounts: SyncAccountInterface[] | null;
}
