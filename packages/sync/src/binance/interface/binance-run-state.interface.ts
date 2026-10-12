import type { SyncAccountInterface } from '../../core/interface/sync-account.interface';
import type { BinanceSignedClient } from '../client/binance-signed.client';

export interface BinanceRunStateInterface {
    readonly deadlineAtMs: number;
    readonly isDeferred: boolean;
    readonly transfersSynced: boolean;
    readonly sourcesSynced: boolean;
    readonly balancesAnchored: boolean;
    readonly providerSourceFailed: boolean;
    readonly signedClient: BinanceSignedClient | null;
    readonly clientToken: string | null;
    readonly exchangeAccounts: SyncAccountInterface[] | null;
}
