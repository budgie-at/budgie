import { ExternalSourceEnum } from '@budgie/contracts';
import { Log } from '@budgie/logger';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { bankSyncRepository } from '../../@generic/drizzle/db/db';

import { binanceSyncService } from './binance-sync.service';
import { ersteSyncService } from './erste-sync.service';
import { monobankSyncService } from './monobank-sync.service';
import { privatbankSyncService } from './privatbank-sync.service';

type SyncServiceShape = {
    readonly supportsTokenAuth: boolean;
    setAccountSyncEnabled(accountId: number, enabled: boolean): Promise<void>;
    updateAccountToken?(accountId: number, token: string): Promise<void>;
};

const SERVICE_MAP = new Map<ExternalSourceEnum, SyncServiceShape>([
    [ExternalSourceEnum.MONOBANK, monobankSyncService],
    [ExternalSourceEnum.BINANCE, binanceSyncService],
    [ExternalSourceEnum.ERSTE, ersteSyncService],
    [ExternalSourceEnum.PRIVATBANK, privatbankSyncService]
]);

class SyncProviderRegistryService {
    readonly supportsTokenAuthByProvider: ReadonlyMap<ExternalSourceEnum, boolean> = new Map(
        [...SERVICE_MAP.entries()].map(([provider, service]) => [provider, service.supportsTokenAuth])
    );

    @Log(
        accountId => `enter accountId=${accountId}`,
        (result, accountId) => `done accountId=${accountId} provider=${result?.constructor.name ?? 'null'}`,
        (error, accountId) => `throw accountId=${accountId} error=${getErrorMessage(error)}`
    )
    async getServiceForAccount(accountId: number): Promise<SyncServiceShape | null> {
        const bankSync = await bankSyncRepository.getByAccountId(accountId);
        if (!isDefined(bankSync)) {
            return null;
        }

        return this.getServiceForProvider(bankSync.provider);
    }

    getServiceForProvider(provider: ExternalSourceEnum): SyncServiceShape | null {
        return SERVICE_MAP.get(provider) ?? null;
    }
}

export const syncProviderRegistryService = new SyncProviderRegistryService();
